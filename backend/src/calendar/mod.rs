pub mod categories;
pub mod handlers;

use axum::{routing::get, Router};

use crate::state::AppState;

/// Mounted under `/api/groups/:id/calendar/...`. Group-scoped routes.
pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/events",
            get(handlers::list_group_events).post(handlers::create_group_event),
        )
        .route(
            "/events/:event_id",
            axum::routing::patch(handlers::update_group_event)
                .delete(handlers::delete_group_event),
        )
        .route(
            "/categories",
            get(categories::list_group_categories).post(categories::create_group_category),
        )
        .route(
            "/categories/:category_id",
            axum::routing::patch(categories::update_group_category)
                .delete(categories::delete_group_category),
        )
}

/// Mounted under `/api/me/calendar/...`. Personal-scoped routes (events
/// and categories owned by the authenticated user, never shared).
pub fn personal_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/events",
            get(handlers::list_personal_events).post(handlers::create_personal_event),
        )
        .route(
            "/events/:event_id",
            axum::routing::patch(handlers::update_personal_event)
                .delete(handlers::delete_personal_event),
        )
        .route(
            "/categories",
            get(categories::list_personal_categories).post(categories::create_personal_category),
        )
        .route(
            "/categories/:category_id",
            axum::routing::patch(categories::update_personal_category)
                .delete(categories::delete_personal_category),
        )
}
