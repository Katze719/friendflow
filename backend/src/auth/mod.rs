pub mod handlers;
pub mod jwt;
pub mod middleware;
pub mod password;

use axum::{
    routing::{get, post},
    Router,
};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(handlers::register))
        .route("/login", post(handlers::login))
        .route(
            "/me",
            get(handlers::me)
                .patch(handlers::update_me)
                .delete(handlers::delete_me),
        )
        .route("/config", get(handlers::config))
        .route("/password/change", post(handlers::change_password))
        .route("/password/forgot", post(handlers::forgot_password))
        .route("/password/reset", post(handlers::reset_password))
}
