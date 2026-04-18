use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    error::{AppError, AppResult},
    state::AppState,
};

use super::unfurl::fetch_preview;

#[derive(Debug, Serialize)]
pub struct TripLink {
    pub id: Uuid,
    pub url: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub site_name: Option<String>,
    pub note: String,
    pub added_by: Uuid,
    pub added_by_display_name: String,
    pub created_at: DateTime<Utc>,
    pub fetched_at: Option<DateTime<Utc>>,
    pub likes: i64,
    pub dislikes: i64,
    /// Current user's vote: 1, -1 or 0 (no vote).
    pub my_vote: i16,
    /// Folder this link is organized into. Null means "unsorted".
    pub folder_id: Option<Uuid>,
    pub folder_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TripFolder {
    pub id: Uuid,
    pub name: String,
    pub created_by: Uuid,
    pub created_by_display_name: String,
    pub created_at: DateTime<Utc>,
    pub link_count: i64,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateFolderRequest {
    #[validate(length(min = 1, max = 80))]
    pub name: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateFolderRequest {
    #[validate(length(min = 1, max = 80))]
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct MoveLinkRequest {
    /// Target folder id. `null` (or missing) moves the link back into
    /// the implicit "unsorted" bucket.
    #[serde(default)]
    pub folder_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct VoteRequest {
    /// 1 = like, -1 = dislike, 0 = remove vote.
    #[validate(range(min = -1, max = 1))]
    pub value: i16,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateLinkRequest {
    #[validate(url, length(max = 2048))]
    pub url: String,
    #[validate(length(max = 2000))]
    #[serde(default)]
    pub note: String,
    /// Optional folder to drop the new link into.
    #[serde(default)]
    pub folder_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateLinkRequest {
    #[validate(length(max = 2000))]
    pub note: Option<String>,
}

pub async fn list_links(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
) -> AppResult<Json<Vec<TripLink>>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    let links = fetch_links(&state.db, group_id, user.id).await?;
    Ok(Json(links))
}

pub async fn create_link(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<CreateLinkRequest>,
) -> AppResult<Json<TripLink>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    if let Some(folder_id) = payload.folder_id {
        ensure_folder_in_group(&state.db, folder_id, group_id).await?;
    }

    // Best-effort metadata fetch. A failure here should NOT prevent the link
    // from being saved, so the user still gets a usable bare-URL entry.
    let preview = match fetch_preview(&payload.url).await {
        Ok(p) => Some(p),
        Err(e) => {
            tracing::info!(url = %payload.url, error = %e, "unfurl failed");
            None
        }
    };

    let id: (Uuid,) = sqlx::query_as(
        "INSERT INTO trip_links
            (group_id, added_by, url, title, description, image_url, site_name, note, fetched_at, folder_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id",
    )
    .bind(group_id)
    .bind(user.id)
    .bind(payload.url.trim())
    .bind(preview.as_ref().and_then(|p| p.title.clone()))
    .bind(preview.as_ref().and_then(|p| p.description.clone()))
    .bind(preview.as_ref().and_then(|p| p.image_url.clone()))
    .bind(preview.as_ref().and_then(|p| p.site_name.clone()))
    .bind(payload.note.trim())
    .bind(preview.as_ref().map(|_| Utc::now()))
    .bind(payload.folder_id)
    .fetch_one(&state.db)
    .await?;

    let link = fetch_link(&state.db, id.0, user.id).await?;
    Ok(Json(link))
}

pub async fn update_link(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, link_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateLinkRequest>,
) -> AppResult<Json<TripLink>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    // Any group member may edit a link; we still need to make sure the link
    // exists within this group.
    let exists: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM trip_links WHERE id = $1 AND group_id = $2")
            .bind(link_id)
            .bind(group_id)
            .fetch_optional(&state.db)
            .await?;
    if exists.is_none() {
        return Err(AppError::NotFound("link not found".into()));
    }

    if let Some(note) = payload.note.as_deref() {
        sqlx::query("UPDATE trip_links SET note = $1 WHERE id = $2")
            .bind(note.trim())
            .bind(link_id)
            .execute(&state.db)
            .await?;
    }

    let link = fetch_link(&state.db, link_id, user.id).await?;
    Ok(Json(link))
}

pub async fn delete_link(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, link_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<serde_json::Value>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    // Any group member can delete links inside their group. The group-id
    // filter guarantees we don't touch other groups' data.
    let result = sqlx::query("DELETE FROM trip_links WHERE id = $1 AND group_id = $2")
        .bind(link_id)
        .bind(group_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("link not found".into()));
    }

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn refresh_link(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, link_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<TripLink>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    let row: Option<(String,)> =
        sqlx::query_as("SELECT url FROM trip_links WHERE id = $1 AND group_id = $2")
            .bind(link_id)
            .bind(group_id)
            .fetch_optional(&state.db)
            .await?;
    let Some((url,)) = row else {
        return Err(AppError::NotFound("link not found".into()));
    };

    match fetch_preview(&url).await {
        Ok(p) => {
            sqlx::query(
                "UPDATE trip_links
                 SET title = $1, description = $2, image_url = $3, site_name = $4, fetched_at = NOW()
                 WHERE id = $5",
            )
            .bind(p.title)
            .bind(p.description)
            .bind(p.image_url)
            .bind(p.site_name)
            .bind(link_id)
            .execute(&state.db)
            .await?;
        }
        Err(e) => {
            tracing::info!(url = %url, error = %e, "refresh unfurl failed");
        }
    }

    let link = fetch_link(&state.db, link_id, user.id).await?;
    Ok(Json(link))
}

pub async fn vote_link(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, link_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<VoteRequest>,
) -> AppResult<Json<TripLink>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    let exists: Option<(i64,)> =
        sqlx::query_as("SELECT 1::BIGINT FROM trip_links WHERE id = $1 AND group_id = $2")
            .bind(link_id)
            .bind(group_id)
            .fetch_optional(&state.db)
            .await?;
    if exists.is_none() {
        return Err(AppError::NotFound("link not found".into()));
    }

    if payload.value == 0 {
        sqlx::query("DELETE FROM trip_link_votes WHERE link_id = $1 AND user_id = $2")
            .bind(link_id)
            .bind(user.id)
            .execute(&state.db)
            .await?;
    } else {
        sqlx::query(
            "INSERT INTO trip_link_votes (link_id, user_id, value)
             VALUES ($1, $2, $3)
             ON CONFLICT (link_id, user_id)
             DO UPDATE SET value = EXCLUDED.value, voted_at = NOW()",
        )
        .bind(link_id)
        .bind(user.id)
        .bind(payload.value)
        .execute(&state.db)
        .await?;
    }

    let link = fetch_link(&state.db, link_id, user.id).await?;
    Ok(Json(link))
}

// ---------- folder handlers ----------

pub async fn list_folders(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
) -> AppResult<Json<Vec<TripFolder>>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    let rows: Vec<(Uuid, String, Uuid, String, DateTime<Utc>, i64)> = sqlx::query_as(
        "SELECT f.id, f.name, f.created_by, u.display_name, f.created_at,
                COALESCE(COUNT(tl.id), 0)::BIGINT AS link_count
         FROM trip_folders f
         INNER JOIN users u ON u.id = f.created_by
         LEFT JOIN trip_links tl ON tl.folder_id = f.id
         WHERE f.group_id = $1
         GROUP BY f.id, u.display_name
         ORDER BY f.created_at ASC",
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    let out = rows
        .into_iter()
        .map(
            |(id, name, created_by, created_by_display_name, created_at, link_count)| TripFolder {
                id,
                name,
                created_by,
                created_by_display_name,
                created_at,
                link_count,
            },
        )
        .collect();
    Ok(Json(out))
}

pub async fn create_folder(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<CreateFolderRequest>,
) -> AppResult<Json<TripFolder>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    let row: (Uuid, String, Uuid, DateTime<Utc>) = sqlx::query_as(
        "INSERT INTO trip_folders (group_id, name, created_by)
         VALUES ($1, $2, $3)
         RETURNING id, name, created_by, created_at",
    )
    .bind(group_id)
    .bind(payload.name.trim())
    .bind(user.id)
    .fetch_one(&state.db)
    .await?;

    let display: (String,) = sqlx::query_as("SELECT display_name FROM users WHERE id = $1")
        .bind(row.2)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(TripFolder {
        id: row.0,
        name: row.1,
        created_by: row.2,
        created_by_display_name: display.0,
        created_at: row.3,
        link_count: 0,
    }))
}

pub async fn update_folder(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, folder_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateFolderRequest>,
) -> AppResult<Json<TripFolder>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_folder_in_group(&state.db, folder_id, group_id).await?;

    sqlx::query("UPDATE trip_folders SET name = $1 WHERE id = $2")
        .bind(payload.name.trim())
        .bind(folder_id)
        .execute(&state.db)
        .await?;

    load_folder(&state.db, folder_id).await.map(Json)
}

pub async fn delete_folder(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, folder_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<serde_json::Value>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    // ON DELETE SET NULL moves the links back to the "unsorted" bucket.
    let result = sqlx::query("DELETE FROM trip_folders WHERE id = $1 AND group_id = $2")
        .bind(folder_id)
        .bind(group_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("folder not found".into()));
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn move_link(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, link_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<MoveLinkRequest>,
) -> AppResult<Json<TripLink>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    let exists: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM trip_links WHERE id = $1 AND group_id = $2")
            .bind(link_id)
            .bind(group_id)
            .fetch_optional(&state.db)
            .await?;
    if exists.is_none() {
        return Err(AppError::NotFound("link not found".into()));
    }

    if let Some(folder_id) = payload.folder_id {
        ensure_folder_in_group(&state.db, folder_id, group_id).await?;
    }

    sqlx::query("UPDATE trip_links SET folder_id = $1 WHERE id = $2")
        .bind(payload.folder_id)
        .bind(link_id)
        .execute(&state.db)
        .await?;

    let link = fetch_link(&state.db, link_id, user.id).await?;
    Ok(Json(link))
}

async fn ensure_folder_in_group(pool: &PgPool, folder_id: Uuid, group_id: Uuid) -> AppResult<()> {
    let exists: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM trip_folders WHERE id = $1 AND group_id = $2")
            .bind(folder_id)
            .bind(group_id)
            .fetch_optional(pool)
            .await?;
    if exists.is_none() {
        return Err(AppError::NotFound("folder not found".into()));
    }
    Ok(())
}

async fn load_folder(pool: &PgPool, folder_id: Uuid) -> AppResult<TripFolder> {
    let row: (Uuid, String, Uuid, String, DateTime<Utc>, i64) = sqlx::query_as(
        "SELECT f.id, f.name, f.created_by, u.display_name, f.created_at,
                COALESCE(COUNT(tl.id), 0)::BIGINT AS link_count
         FROM trip_folders f
         INNER JOIN users u ON u.id = f.created_by
         LEFT JOIN trip_links tl ON tl.folder_id = f.id
         WHERE f.id = $1
         GROUP BY f.id, u.display_name",
    )
    .bind(folder_id)
    .fetch_one(pool)
    .await?;

    Ok(TripFolder {
        id: row.0,
        name: row.1,
        created_by: row.2,
        created_by_display_name: row.3,
        created_at: row.4,
        link_count: row.5,
    })
}

// ---------- internal helpers ----------

type LinkRow = (
    Uuid,
    String,
    Option<String>,
    Option<String>,
    Option<String>,
    Option<String>,
    String,
    Uuid,
    String,
    DateTime<Utc>,
    Option<DateTime<Utc>>,
    i64,
    i64,
    Option<i16>,
    Option<Uuid>,
    Option<String>,
);

const LINK_SELECT: &str = "\
    SELECT tl.id, tl.url, tl.title, tl.description, tl.image_url, tl.site_name, \
           tl.note, tl.added_by, u.display_name, tl.created_at, tl.fetched_at, \
           COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS likes, \
           COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0)::BIGINT AS dislikes, \
           MAX(CASE WHEN v.user_id = $2 THEN v.value END) AS my_vote, \
           tl.folder_id, f.name AS folder_name \
    FROM trip_links tl \
    INNER JOIN users u ON u.id = tl.added_by \
    LEFT JOIN trip_link_votes v ON v.link_id = tl.id \
    LEFT JOIN trip_folders f ON f.id = tl.folder_id";

fn row_into_link(row: LinkRow) -> TripLink {
    TripLink {
        id: row.0,
        url: row.1,
        title: row.2,
        description: row.3,
        image_url: row.4,
        site_name: row.5,
        note: row.6,
        added_by: row.7,
        added_by_display_name: row.8,
        created_at: row.9,
        fetched_at: row.10,
        likes: row.11,
        dislikes: row.12,
        my_vote: row.13.unwrap_or(0),
        folder_id: row.14,
        folder_name: row.15,
    }
}

async fn fetch_links(pool: &PgPool, group_id: Uuid, me: Uuid) -> AppResult<Vec<TripLink>> {
    let sql = format!(
        "{LINK_SELECT} \
         WHERE tl.group_id = $1 \
         GROUP BY tl.id, u.display_name, f.name \
         ORDER BY tl.created_at DESC"
    );
    let rows: Vec<LinkRow> = sqlx::query_as(&sql)
        .bind(group_id)
        .bind(me)
        .fetch_all(pool)
        .await?;
    Ok(rows.into_iter().map(row_into_link).collect())
}

async fn fetch_link(pool: &PgPool, id: Uuid, me: Uuid) -> AppResult<TripLink> {
    let sql = format!(
        "{LINK_SELECT} \
         WHERE tl.id = $1 \
         GROUP BY tl.id, u.display_name, f.name"
    );
    let row: LinkRow = sqlx::query_as(&sql)
        .bind(id)
        .bind(me)
        .fetch_one(pool)
        .await?;
    Ok(row_into_link(row))
}
