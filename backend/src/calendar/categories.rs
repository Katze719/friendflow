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

use super::handlers::Scope;

#[derive(Debug, Serialize)]
pub struct Category {
    pub id: Uuid,
    pub group_id: Option<Uuid>,
    pub owner_user_id: Option<Uuid>,
    pub name: String,
    pub color: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateCategoryRequest {
    #[validate(length(min = 1, max = 60))]
    pub name: String,
    #[validate(length(equal = 7))]
    pub color: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateCategoryRequest {
    #[validate(length(min = 1, max = 60))]
    pub name: Option<String>,
    #[validate(length(equal = 7))]
    pub color: Option<String>,
}

/// Colors are stored as free-form strings but constrained to a hex-ish
/// shape on write so the DB doesn't grow stray HTML/JS - the UI only
/// picks from a fixed palette anyway.
fn validate_color(color: &str) -> AppResult<()> {
    let bytes = color.as_bytes();
    let ok = bytes.len() == 7
        && bytes[0] == b'#'
        && bytes[1..]
            .iter()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(b) || (b'A'..=b'F').contains(b));
    if !ok {
        return Err(AppError::BadRequest(
            "color must be a hex string like #64748b".into(),
        ));
    }
    Ok(())
}

// ---------- group-scoped handlers ----------

pub async fn list_group_categories(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
) -> AppResult<Json<Vec<Category>>> {
    let scope = Scope::for_group(&state, group_id, &user).await?;
    Ok(Json(list(&state.db, scope).await?))
}

pub async fn create_group_category(
    State(state): State<AppState>,
    user: AuthUser,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<CreateCategoryRequest>,
) -> AppResult<Json<Category>> {
    let scope = Scope::for_group(&state, group_id, &user).await?;
    create(&state.db, scope, payload).await.map(Json)
}

pub async fn update_group_category(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, category_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateCategoryRequest>,
) -> AppResult<Json<Category>> {
    let scope = Scope::for_group(&state, group_id, &user).await?;
    update(&state.db, scope, category_id, payload).await.map(Json)
}

pub async fn delete_group_category(
    State(state): State<AppState>,
    user: AuthUser,
    Path((group_id, category_id)): Path<(Uuid, Uuid)>,
) -> AppResult<Json<serde_json::Value>> {
    let scope = Scope::for_group(&state, group_id, &user).await?;
    delete(&state.db, scope, category_id).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

// ---------- personal-scoped handlers ----------

pub async fn list_personal_categories(
    State(state): State<AppState>,
    user: AuthUser,
) -> AppResult<Json<Vec<Category>>> {
    let scope = Scope::for_personal(&user);
    Ok(Json(list(&state.db, scope).await?))
}

pub async fn create_personal_category(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<CreateCategoryRequest>,
) -> AppResult<Json<Category>> {
    let scope = Scope::for_personal(&user);
    create(&state.db, scope, payload).await.map(Json)
}

pub async fn update_personal_category(
    State(state): State<AppState>,
    user: AuthUser,
    Path(category_id): Path<Uuid>,
    Json(payload): Json<UpdateCategoryRequest>,
) -> AppResult<Json<Category>> {
    let scope = Scope::for_personal(&user);
    update(&state.db, scope, category_id, payload).await.map(Json)
}

pub async fn delete_personal_category(
    State(state): State<AppState>,
    user: AuthUser,
    Path(category_id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let scope = Scope::for_personal(&user);
    delete(&state.db, scope, category_id).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

// ---------- core CRUD ----------

type CategoryRow = (
    Uuid,
    Option<Uuid>,
    Option<Uuid>,
    String,
    String,
    DateTime<Utc>,
);

fn row_into_category(row: CategoryRow) -> Category {
    Category {
        id: row.0,
        group_id: row.1,
        owner_user_id: row.2,
        name: row.3,
        color: row.4,
        created_at: row.5,
    }
}

async fn list(pool: &PgPool, scope: Scope) -> AppResult<Vec<Category>> {
    let (sql, owner) = match scope {
        Scope::Group { group_id, .. } => (
            "SELECT id, group_id, owner_user_id, name, color, created_at \
             FROM calendar_categories WHERE group_id = $1 ORDER BY name ASC",
            group_id,
        ),
        Scope::Personal { user_id } => (
            "SELECT id, group_id, owner_user_id, name, color, created_at \
             FROM calendar_categories WHERE owner_user_id = $1 ORDER BY name ASC",
            user_id,
        ),
    };
    let rows: Vec<CategoryRow> = sqlx::query_as(sql).bind(owner).fetch_all(pool).await?;
    Ok(rows.into_iter().map(row_into_category).collect())
}

async fn create(
    pool: &PgPool,
    scope: Scope,
    payload: CreateCategoryRequest,
) -> AppResult<Category> {
    payload.validate()?;
    validate_color(&payload.color)?;
    let (group_id, owner_user_id) = match scope {
        Scope::Group { group_id, .. } => (Some(group_id), None),
        Scope::Personal { user_id } => (None, Some(user_id)),
    };

    let id: (Uuid,) = sqlx::query_as(
        "INSERT INTO calendar_categories (group_id, owner_user_id, name, color, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id",
    )
    .bind(group_id)
    .bind(owner_user_id)
    .bind(payload.name.trim())
    .bind(&payload.color)
    .bind(scope.acting_user())
    .fetch_one(pool)
    .await
    .map_err(map_unique)?;

    fetch_one(pool, scope, id.0).await
}

async fn update(
    pool: &PgPool,
    scope: Scope,
    category_id: Uuid,
    payload: UpdateCategoryRequest,
) -> AppResult<Category> {
    payload.validate()?;
    if let Some(color) = &payload.color {
        validate_color(color)?;
    }

    // Existence + scope check.
    fetch_one(pool, scope, category_id).await?;

    sqlx::query(
        "UPDATE calendar_categories
         SET name  = COALESCE($1, name),
             color = COALESCE($2, color)
         WHERE id = $3",
    )
    .bind(payload.name.as_deref().map(str::trim))
    .bind(payload.color.as_deref())
    .bind(category_id)
    .execute(pool)
    .await
    .map_err(map_unique)?;

    fetch_one(pool, scope, category_id).await
}

async fn delete(pool: &PgPool, scope: Scope, category_id: Uuid) -> AppResult<()> {
    let (scope_sql, owner) = match scope {
        Scope::Group { group_id, .. } => ("group_id = $2", group_id),
        Scope::Personal { user_id } => ("owner_user_id = $2", user_id),
    };
    let sql = format!(
        "DELETE FROM calendar_categories WHERE id = $1 AND {scope_sql}",
    );
    let result = sqlx::query(&sql)
        .bind(category_id)
        .bind(owner)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("category not found".into()));
    }
    Ok(())
}

async fn fetch_one(pool: &PgPool, scope: Scope, id: Uuid) -> AppResult<Category> {
    let (scope_sql, owner) = match scope {
        Scope::Group { group_id, .. } => ("group_id = $2", group_id),
        Scope::Personal { user_id } => ("owner_user_id = $2", user_id),
    };
    let sql = format!(
        "SELECT id, group_id, owner_user_id, name, color, created_at \
         FROM calendar_categories WHERE id = $1 AND {scope_sql}",
    );
    let row: Option<CategoryRow> = sqlx::query_as(&sql)
        .bind(id)
        .bind(owner)
        .fetch_optional(pool)
        .await?;
    row.map(row_into_category)
        .ok_or_else(|| AppError::NotFound("category not found".into()))
}

/// Translate Postgres unique-violation into a domain `Conflict`, so the
/// frontend gets a friendly "name already exists" instead of a 500.
fn map_unique(e: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(ref db_err) = e {
        if db_err.code().as_deref() == Some("23505") {
            return AppError::Conflict("category name already exists".into());
        }
    }
    AppError::Sqlx(e)
}
