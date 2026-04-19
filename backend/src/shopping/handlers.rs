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

// -------------------------------------------------------------------------
// Shopping lists
// -------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct ShoppingList {
    pub id: Uuid,
    pub group_id: Uuid,
    pub name: String,
    /// Number of unchecked items on this list. Precomputed so the UI can
    /// show a "3 open" badge in the dropdown without a second round-trip.
    pub items_open: i64,
    /// Number of items already ticked off.
    pub items_done: i64,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateListRequest {
    #[validate(length(min = 1, max = 120))]
    pub name: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RenameListRequest {
    #[validate(length(min = 1, max = 120))]
    pub name: String,
}

pub async fn list_lists(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
) -> AppResult<Json<Vec<ShoppingList>>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    Ok(Json(fetch_lists(&state.db, group_id).await?))
}

pub async fn create_list(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<CreateListRequest>,
) -> AppResult<Json<ShoppingList>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;

    let id: (Uuid,) = sqlx::query_as(
        "INSERT INTO shopping_lists (group_id, name, created_by)
         VALUES ($1, $2, $3)
         RETURNING id",
    )
    .bind(group_id)
    .bind(payload.name.trim())
    .bind(user.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(fetch_list(&state.db, id.0).await?))
}

pub async fn rename_list(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, list_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<RenameListRequest>,
) -> AppResult<Json<ShoppingList>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_list_in_group(&state.db, list_id, group_id).await?;

    sqlx::query("UPDATE shopping_lists SET name = $1 WHERE id = $2")
        .bind(payload.name.trim())
        .bind(list_id)
        .execute(&state.db)
        .await?;

    Ok(Json(fetch_list(&state.db, list_id).await?))
}

pub async fn delete_list(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, list_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<ShoppingList>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_list_in_group(&state.db, list_id, group_id).await?;

    // Safeguard: never leave a group without a list. The frontend is
    // list-centric and would render a broken empty state otherwise. If
    // we're deleting the last list, synthesise a fresh empty default in
    // the same transaction so the UI always has something to switch to.
    let mut tx = state.db.begin().await?;

    sqlx::query("DELETE FROM shopping_lists WHERE id = $1")
        .bind(list_id)
        .execute(&mut *tx)
        .await?;

    let remaining: (i64,) =
        sqlx::query_as("SELECT COUNT(*)::BIGINT FROM shopping_lists WHERE group_id = $1")
            .bind(group_id)
            .fetch_one(&mut *tx)
            .await?;

    let fallback_id: Uuid = if remaining.0 == 0 {
        let row: (Uuid,) = sqlx::query_as(
            "INSERT INTO shopping_lists (group_id, name, created_by)
             VALUES ($1, 'Einkaufsliste', $2)
             RETURNING id",
        )
        .bind(group_id)
        .bind(user.id)
        .fetch_one(&mut *tx)
        .await?;
        row.0
    } else {
        // Any remaining list works as the follow-up selection; the
        // frontend will switch to whatever list_id comes back.
        let row: (Uuid,) = sqlx::query_as(
            "SELECT id FROM shopping_lists
             WHERE group_id = $1
             ORDER BY created_at ASC
             LIMIT 1",
        )
        .bind(group_id)
        .fetch_one(&mut *tx)
        .await?;
        row.0
    };

    tx.commit().await?;

    Ok(Json(fetch_list(&state.db, fallback_id).await?))
}

// -------------------------------------------------------------------------
// Shopping items (now scoped to a list)
// -------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct ShoppingItem {
    pub id: Uuid,
    pub group_id: Uuid,
    pub list_id: Uuid,
    pub name: String,
    pub quantity: String,
    pub note: String,
    pub is_done: bool,
    pub done_at: Option<DateTime<Utc>>,
    pub done_by: Option<Uuid>,
    pub done_by_display_name: Option<String>,
    pub added_by: Uuid,
    pub added_by_display_name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateItemRequest {
    #[validate(length(min = 1, max = 200))]
    pub name: String,
    #[validate(length(max = 80))]
    #[serde(default)]
    pub quantity: String,
    #[validate(length(max = 500))]
    #[serde(default)]
    pub note: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateItemRequest {
    #[validate(length(min = 1, max = 200))]
    pub name: Option<String>,
    #[validate(length(max = 80))]
    pub quantity: Option<String>,
    #[validate(length(max = 500))]
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ToggleRequest {
    /// When omitted the state is flipped; otherwise forced to the given value.
    #[serde(default)]
    pub done: Option<bool>,
}

pub async fn list_items(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, list_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<Vec<ShoppingItem>>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_list_in_group(&state.db, list_id, group_id).await?;
    Ok(Json(fetch_items(&state.db, list_id).await?))
}

pub async fn create_item(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, list_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<CreateItemRequest>,
) -> AppResult<Json<ShoppingItem>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_list_in_group(&state.db, list_id, group_id).await?;

    let id: (Uuid,) = sqlx::query_as(
        "INSERT INTO shopping_items (group_id, list_id, added_by, name, quantity, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id",
    )
    .bind(group_id)
    .bind(list_id)
    .bind(user.id)
    .bind(payload.name.trim())
    .bind(payload.quantity.trim())
    .bind(payload.note.trim())
    .fetch_one(&state.db)
    .await?;

    Ok(Json(fetch_item(&state.db, id.0).await?))
}

pub async fn update_item(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, list_id, item_id)): Path<(Uuid, Uuid, Uuid)>,
    Json(payload): Json<UpdateItemRequest>,
) -> AppResult<Json<ShoppingItem>> {
    payload.validate()?;
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_list_in_group(&state.db, list_id, group_id).await?;
    ensure_item_in_list(&state.db, item_id, list_id).await?;

    sqlx::query(
        "UPDATE shopping_items
         SET name     = COALESCE($1, name),
             quantity = COALESCE($2, quantity),
             note     = COALESCE($3, note)
         WHERE id = $4",
    )
    .bind(payload.name.as_deref().map(str::trim))
    .bind(payload.quantity.as_deref().map(str::trim))
    .bind(payload.note.as_deref().map(str::trim))
    .bind(item_id)
    .execute(&state.db)
    .await?;

    Ok(Json(fetch_item(&state.db, item_id).await?))
}

pub async fn toggle_item(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, list_id, item_id)): Path<(Uuid, Uuid, Uuid)>,
    Json(payload): Json<ToggleRequest>,
) -> AppResult<Json<ShoppingItem>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_list_in_group(&state.db, list_id, group_id).await?;

    let current: Option<(bool,)> =
        sqlx::query_as("SELECT is_done FROM shopping_items WHERE id = $1 AND list_id = $2")
            .bind(item_id)
            .bind(list_id)
            .fetch_optional(&state.db)
            .await?;
    let Some((was_done,)) = current else {
        return Err(AppError::NotFound("item not found".into()));
    };

    let target = payload.done.unwrap_or(!was_done);

    if target {
        sqlx::query(
            "UPDATE shopping_items
             SET is_done = TRUE, done_at = NOW(), done_by = $1
             WHERE id = $2",
        )
        .bind(user.id)
        .bind(item_id)
        .execute(&state.db)
        .await?;
    } else {
        sqlx::query(
            "UPDATE shopping_items
             SET is_done = FALSE, done_at = NULL, done_by = NULL
             WHERE id = $1",
        )
        .bind(item_id)
        .execute(&state.db)
        .await?;
    }

    Ok(Json(fetch_item(&state.db, item_id).await?))
}

pub async fn delete_item(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, list_id, item_id)): Path<(Uuid, Uuid, Uuid)>,
) -> AppResult<Json<serde_json::Value>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_list_in_group(&state.db, list_id, group_id).await?;
    ensure_item_in_list(&state.db, item_id, list_id).await?;
    sqlx::query("DELETE FROM shopping_items WHERE id = $1")
        .bind(item_id)
        .execute(&state.db)
        .await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn clear_done(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, list_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<serde_json::Value>> {
    crate::groups::ensure_member(&state, group_id, user.id).await?;
    ensure_list_in_group(&state.db, list_id, group_id).await?;
    let res = sqlx::query("DELETE FROM shopping_items WHERE list_id = $1 AND is_done = TRUE")
        .bind(list_id)
        .execute(&state.db)
        .await?;
    Ok(Json(
        serde_json::json!({ "ok": true, "removed": res.rows_affected() }),
    ))
}

// -------------------------------------------------------------------------
// helpers
// -------------------------------------------------------------------------

/// Verify that the given list belongs to the given group. Pairs with
/// `ensure_member` to block cross-group access via guessed IDs.
pub async fn ensure_list_in_group(
    pool: &PgPool,
    list_id: Uuid,
    group_id: Uuid,
) -> AppResult<()> {
    let exists: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM shopping_lists WHERE id = $1 AND group_id = $2")
            .bind(list_id)
            .bind(group_id)
            .fetch_optional(pool)
            .await?;
    if exists.is_none() {
        return Err(AppError::NotFound("shopping list not found".into()));
    }
    Ok(())
}

async fn ensure_item_in_list(pool: &PgPool, item_id: Uuid, list_id: Uuid) -> AppResult<()> {
    let row: Option<(i64,)> =
        sqlx::query_as("SELECT 1::BIGINT FROM shopping_items WHERE id = $1 AND list_id = $2")
            .bind(item_id)
            .bind(list_id)
            .fetch_optional(pool)
            .await?;
    if row.is_none() {
        return Err(AppError::NotFound("item not found".into()));
    }
    Ok(())
}

type ListRow = (Uuid, Uuid, String, i64, i64, Uuid, DateTime<Utc>);

const LIST_SELECT: &str = "\
    SELECT sl.id, sl.group_id, sl.name, \
           COALESCE((SELECT COUNT(*) FROM shopping_items si \
                     WHERE si.list_id = sl.id AND si.is_done = FALSE), 0)::BIGINT AS items_open, \
           COALESCE((SELECT COUNT(*) FROM shopping_items si \
                     WHERE si.list_id = sl.id AND si.is_done = TRUE), 0)::BIGINT AS items_done, \
           sl.created_by, sl.created_at \
    FROM shopping_lists sl";

fn row_into_list(row: ListRow) -> ShoppingList {
    ShoppingList {
        id: row.0,
        group_id: row.1,
        name: row.2,
        items_open: row.3,
        items_done: row.4,
        created_by: row.5,
        created_at: row.6,
    }
}

async fn fetch_lists(pool: &PgPool, group_id: Uuid) -> AppResult<Vec<ShoppingList>> {
    let sql = format!(
        "{LIST_SELECT} WHERE sl.group_id = $1 \
         ORDER BY sl.created_at ASC"
    );
    let rows: Vec<ListRow> = sqlx::query_as(&sql).bind(group_id).fetch_all(pool).await?;
    Ok(rows.into_iter().map(row_into_list).collect())
}

async fn fetch_list(pool: &PgPool, id: Uuid) -> AppResult<ShoppingList> {
    let sql = format!("{LIST_SELECT} WHERE sl.id = $1");
    let row: ListRow = sqlx::query_as(&sql).bind(id).fetch_one(pool).await?;
    Ok(row_into_list(row))
}

type ItemRow = (
    Uuid,
    Uuid,
    Uuid,
    String,
    String,
    String,
    bool,
    Option<DateTime<Utc>>,
    Option<Uuid>,
    Option<String>,
    Uuid,
    String,
    DateTime<Utc>,
);

const ITEM_SELECT: &str = "\
    SELECT si.id, si.group_id, si.list_id, si.name, si.quantity, si.note, \
           si.is_done, si.done_at, si.done_by, du.display_name AS done_by_display_name, \
           si.added_by, au.display_name AS added_by_display_name, si.created_at \
    FROM shopping_items si \
    INNER JOIN users au ON au.id = si.added_by \
    LEFT JOIN users du ON du.id = si.done_by";

fn row_into_item(row: ItemRow) -> ShoppingItem {
    ShoppingItem {
        id: row.0,
        group_id: row.1,
        list_id: row.2,
        name: row.3,
        quantity: row.4,
        note: row.5,
        is_done: row.6,
        done_at: row.7,
        done_by: row.8,
        done_by_display_name: row.9,
        added_by: row.10,
        added_by_display_name: row.11,
        created_at: row.12,
    }
}

async fn fetch_items(pool: &PgPool, list_id: Uuid) -> AppResult<Vec<ShoppingItem>> {
    let sql = format!(
        "{ITEM_SELECT} WHERE si.list_id = $1 \
         ORDER BY si.is_done ASC, si.created_at DESC"
    );
    let rows: Vec<ItemRow> = sqlx::query_as(&sql).bind(list_id).fetch_all(pool).await?;
    Ok(rows.into_iter().map(row_into_item).collect())
}

async fn fetch_item(pool: &PgPool, id: Uuid) -> AppResult<ShoppingItem> {
    let sql = format!("{ITEM_SELECT} WHERE si.id = $1");
    let row: ItemRow = sqlx::query_as(&sql).bind(id).fetch_one(pool).await?;
    Ok(row_into_item(row))
}
