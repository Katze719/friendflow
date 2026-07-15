use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;

use crate::state::AppState;

const BUILD_VERSION: Option<&str> = option_env!("FRIENDFLOW_APP_VERSION");

#[derive(Debug, Serialize)]
pub struct AppVersionResponse {
    pub backend_version: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minimum_supported_app_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest_app_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ios_store_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub android_store_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

pub fn routes() -> Router<AppState> {
    Router::new().route("/version", get(version))
}

async fn version(State(state): State<AppState>) -> Json<AppVersionResponse> {
    let cfg = &state.cfg.app_version;
    let backend_version = build_version();
    Json(AppVersionResponse {
        backend_version,
        minimum_supported_app_version: cfg.minimum_supported_app_version.clone(),
        latest_app_version: cfg
            .latest_app_version
            .clone()
            .or_else(|| Some(backend_version.to_string())),
        ios_store_url: cfg.ios_store_url.clone(),
        android_store_url: cfg.android_store_url.clone(),
        message: cfg.update_message.clone(),
    })
}

fn build_version() -> &'static str {
    match BUILD_VERSION {
        Some(version) if !version.is_empty() => version,
        _ => env!("CARGO_PKG_VERSION"),
    }
}
