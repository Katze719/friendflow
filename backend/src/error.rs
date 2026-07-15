use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    BadRequest(String),

    #[error("unauthorized")]
    Unauthorized,

    #[error("forbidden")]
    Forbidden,

    #[error("{0}")]
    NotFound(String),

    #[error("{0}")]
    Conflict(String),

    #[error("account pending approval")]
    AccountPending,

    // Prepared for endpoints that cannot safely serve older installed apps.
    #[allow(dead_code)]
    #[error("app update required")]
    AppUpdateRequired {
        minimum_supported_app_version: Option<String>,
        latest_app_version: Option<String>,
    },

    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),

    #[error(transparent)]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error(transparent)]
    Validation(#[from] validator::ValidationErrors),

    #[error("internal error")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message): (StatusCode, &'static str, String) = match &self {
            AppError::BadRequest(m) => (StatusCode::BAD_REQUEST, "bad_request", m.clone()),
            AppError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "unauthorized",
                "unauthorized".into(),
            ),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "forbidden", "forbidden".into()),
            AppError::NotFound(m) => (StatusCode::NOT_FOUND, "not_found", m.clone()),
            AppError::Conflict(m) => (StatusCode::CONFLICT, "conflict", m.clone()),
            AppError::AccountPending => (
                StatusCode::FORBIDDEN,
                "account_pending",
                "account pending approval".into(),
            ),
            AppError::AppUpdateRequired { .. } => (
                StatusCode::UPGRADE_REQUIRED,
                "app_update_required",
                "this app version is no longer supported by this server".into(),
            ),
            AppError::Validation(e) => (StatusCode::BAD_REQUEST, "validation", e.to_string()),
            AppError::Sqlx(e) => {
                tracing::error!(error = ?e, "sqlx error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "database",
                    "database error".into(),
                )
            }
            AppError::Jwt(_) => (
                StatusCode::UNAUTHORIZED,
                "invalid_token",
                "invalid token".into(),
            ),
            AppError::Internal(e) => {
                tracing::error!(error = ?e, "internal error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal",
                    "internal error".into(),
                )
            }
        };

        let mut body = json!({ "error": message, "code": code });
        if let AppError::AppUpdateRequired {
            minimum_supported_app_version,
            latest_app_version,
        } = self
        {
            if let Some(minimum_supported_app_version) = minimum_supported_app_version {
                body["minimum_supported_app_version"] = json!(minimum_supported_app_version);
            }
            if let Some(latest_app_version) = latest_app_version {
                body["latest_app_version"] = json!(latest_app_version);
            }
        }

        (status, Json(body)).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
