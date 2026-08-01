use axum::{
    body::{to_bytes, Body},
    extract::{Request, State},
    http::{header, HeaderValue, Method, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::state::AppState;

const OPERATION_HEADER: &str = "x-friendflow-operation-id";
const MAX_REQUEST_BYTES: usize = 2 * 1024 * 1024;
const MAX_RESPONSE_BYTES: usize = 8 * 1024 * 1024;

pub async fn deduplicate(State(state): State<AppState>, request: Request, next: Next) -> Response {
    if request.method() != Method::POST {
        return no_store(next.run(request).await);
    }

    let Some(operation_id) = request
        .headers()
        .get(OPERATION_HEADER)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| Uuid::parse_str(value).ok())
    else {
        return no_store(next.run(request).await);
    };

    let (parts, body) = request.into_parts();
    let body = match to_bytes(body, MAX_REQUEST_BYTES).await {
        Ok(body) => body,
        Err(_) => {
            return (
                StatusCode::PAYLOAD_TOO_LARGE,
                "offline operation request is too large",
            )
                .into_response()
        }
    };
    let request_hash = fingerprint(&parts.method, &parts.uri.to_string(), &body);
    let request = Request::from_parts(parts, Body::from(body));

    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(error) => {
            tracing::error!(?error, "could not start idempotency transaction");
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    if let Err(error) = sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(operation_id.to_string())
        .execute(&mut *tx)
        .await
    {
        tracing::error!(?error, "could not lock offline operation");
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }

    let stored: Option<(String, Option<i16>, Option<String>, Option<Vec<u8>>)> =
        match sqlx::query_as(
            "SELECT request_hash, response_status, response_content_type, response_body
             FROM offline_operation_receipts WHERE operation_id = $1",
        )
        .bind(operation_id)
        .fetch_optional(&mut *tx)
        .await
        {
            Ok(row) => row,
            Err(error) => {
                tracing::error!(?error, "could not read offline operation receipt");
                return StatusCode::INTERNAL_SERVER_ERROR.into_response();
            }
        };

    if let Some((stored_hash, status, content_type, response_body)) = stored {
        if stored_hash != request_hash {
            return (
                StatusCode::CONFLICT,
                "operation id was already used for a different request",
            )
                .into_response();
        }
        if let (Some(status), Some(response_body)) = (status, response_body) {
            let _ = tx.commit().await;
            let mut response = Response::new(Body::from(response_body));
            *response.status_mut() =
                StatusCode::from_u16(status as u16).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
            if let Some(content_type) =
                content_type.and_then(|value| HeaderValue::from_str(&value).ok())
            {
                response
                    .headers_mut()
                    .insert(header::CONTENT_TYPE, content_type);
            }
            return no_store(response);
        }
    } else if let Err(error) = sqlx::query(
        "INSERT INTO offline_operation_receipts (operation_id, request_hash)
         VALUES ($1, $2)",
    )
    .bind(operation_id)
    .bind(&request_hash)
    .execute(&mut *tx)
    .await
    {
        tracing::error!(?error, "could not reserve offline operation");
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }

    let response = next.run(request).await;
    let (parts, body) = response.into_parts();
    let body = match to_bytes(body, MAX_RESPONSE_BYTES).await {
        Ok(body) => body,
        Err(_) => {
            let _ = tx.rollback().await;
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    if parts.status.as_u16() < 500 {
        let content_type = parts
            .headers
            .get(header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok());
        if let Err(error) = sqlx::query(
            "UPDATE offline_operation_receipts
             SET response_status = $2, response_content_type = $3, response_body = $4
             WHERE operation_id = $1",
        )
        .bind(operation_id)
        .bind(parts.status.as_u16() as i16)
        .bind(content_type)
        .bind(body.as_ref())
        .execute(&mut *tx)
        .await
        {
            tracing::error!(?error, "could not store offline operation receipt");
            let _ = tx.rollback().await;
        } else if let Err(error) = tx.commit().await {
            tracing::error!(?error, "could not commit offline operation receipt");
        }
    } else {
        let _ = tx.rollback().await;
    }

    no_store(Response::from_parts(parts, Body::from(body)))
}

fn no_store(mut response: Response) -> Response {
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("private, no-store"),
    );
    response
}

fn fingerprint(method: &Method, uri: &str, body: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(method.as_str().as_bytes());
    hasher.update(b"\0");
    hasher.update(uri.as_bytes());
    hasher.update(b"\0");
    hasher.update(body);
    hex::encode(hasher.finalize())
}
