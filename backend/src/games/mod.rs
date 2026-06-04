pub mod handlers;

use axum::{
    routing::{get, post, put},
    Router,
};

use crate::state::AppState;

/// Mounted under `/api/groups/:id/games/...`. Hosts the tournament planner
/// (points round-robin or single-elimination bracket, with optional teams).
/// The wheel ("Glücksrad") is implemented purely client-side and has no
/// endpoints here.
pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/tournaments",
            get(handlers::list_tournaments).post(handlers::create_tournament),
        )
        .route(
            "/tournaments/:tid",
            get(handlers::get_tournament)
                .put(handlers::update_tournament)
                .delete(handlers::delete_tournament),
        )
        .route(
            "/tournaments/:tid/participants",
            post(handlers::add_participant),
        )
        .route(
            "/tournaments/:tid/participants/:pid",
            put(handlers::update_participant).delete(handlers::remove_participant),
        )
        .route("/tournaments/:tid/teams", post(handlers::create_team))
        .route(
            "/tournaments/:tid/teams/:team_id",
            put(handlers::update_team).delete(handlers::delete_team),
        )
        .route("/tournaments/:tid/randomize", post(handlers::randomize))
        .route("/tournaments/:tid/start", post(handlers::start))
        .route(
            "/tournaments/:tid/matches/:mid",
            put(handlers::submit_result),
        )
}
