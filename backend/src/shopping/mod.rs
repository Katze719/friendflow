pub mod handlers;

use axum::{
    routing::{get, patch, post, put},
    Router,
};

use crate::state::AppState;

/// Mounted under `/api/groups/:id/shopping/...`.
///
/// All item routes are list-scoped now. Groups get one or more shopping
/// lists; every item lives on exactly one list. `:list_id` appears between
/// the group segment and the item segment so permissions can be checked
/// per list without touching the item body.
pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/lists",
            get(handlers::list_lists).post(handlers::create_list),
        )
        .route(
            "/lists/:list_id",
            patch(handlers::rename_list).delete(handlers::delete_list),
        )
        .route(
            "/lists/:list_id/items",
            get(handlers::list_items).post(handlers::create_item),
        )
        .route(
            "/lists/:list_id/items/:item_id",
            patch(handlers::update_item).delete(handlers::delete_item),
        )
        .route(
            "/lists/:list_id/items/:item_id/toggle",
            put(handlers::toggle_item),
        )
        .route(
            "/lists/:list_id/items/clear-done",
            post(handlers::clear_done),
        )
}
