pub mod handlers;
mod unfurl;

use axum::{
    routing::{get, post, put},
    Router,
};

use crate::state::AppState;

/// Mounted under `/api/groups/:id/trips/...`.
pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/links",
            get(handlers::list_links).post(handlers::create_link),
        )
        .route(
            "/links/:link_id",
            axum::routing::patch(handlers::update_link)
                .delete(handlers::delete_link),
        )
        .route("/links/:link_id/refresh", post(handlers::refresh_link))
        .route("/links/:link_id/vote", put(handlers::vote_link))
        .route("/links/:link_id/folder", put(handlers::move_link))
        .route(
            "/folders",
            get(handlers::list_folders).post(handlers::create_folder),
        )
        .route(
            "/folders/:folder_id",
            axum::routing::patch(handlers::update_folder)
                .delete(handlers::delete_folder),
        )
}
