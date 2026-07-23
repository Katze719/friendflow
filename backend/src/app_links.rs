use axum::{
    extract::State,
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::Serialize;

use crate::state::AppState;

const APP_BUNDLE_ID: &str = "app.friendflow.mobile";

#[derive(Debug, Serialize)]
struct AppleAppSiteAssociation {
    applinks: AppleAppLinks,
}

#[derive(Debug, Serialize)]
struct AppleAppLinks {
    apps: Vec<String>,
    details: Vec<AppleAppLinkDetails>,
}

#[derive(Debug, Serialize)]
struct AppleAppLinkDetails {
    #[serde(rename = "appID")]
    app_id: String,
    paths: Vec<&'static str>,
}

#[derive(Debug, Serialize)]
struct AndroidAssetLink {
    relation: Vec<&'static str>,
    target: AndroidAssetLinkTarget,
}

#[derive(Debug, Serialize)]
struct AndroidAssetLinkTarget {
    namespace: &'static str,
    package_name: &'static str,
    sha256_cert_fingerprints: Vec<String>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/.well-known/apple-app-site-association",
            get(apple_app_site_association),
        )
        .route("/.well-known/assetlinks.json", get(android_asset_links))
}

async fn apple_app_site_association(State(state): State<AppState>) -> Response {
    let Some(team_id) = &state.cfg.app_links.ios_team_id else {
        return StatusCode::NOT_FOUND.into_response();
    };

    json_response(AppleAppSiteAssociation {
        applinks: AppleAppLinks {
            apps: Vec::new(),
            details: vec![AppleAppLinkDetails {
                app_id: format!("{team_id}.{APP_BUNDLE_ID}"),
                paths: vec!["*"],
            }],
        },
    })
}

async fn android_asset_links(State(state): State<AppState>) -> Response {
    let fingerprints = &state.cfg.app_links.android_sha256_cert_fingerprints;
    if fingerprints.is_empty() {
        return StatusCode::NOT_FOUND.into_response();
    }

    json_response(vec![AndroidAssetLink {
        relation: vec!["delegate_permission/common.handle_all_urls"],
        target: AndroidAssetLinkTarget {
            namespace: "android_app",
            package_name: APP_BUNDLE_ID,
            sha256_cert_fingerprints: fingerprints.clone(),
        },
    }])
}

fn json_response<T: Serialize>(document: T) -> Response {
    (
        [
            (header::CONTENT_TYPE, "application/json"),
            (header::CACHE_CONTROL, "public, max-age=3600"),
        ],
        Json(document),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn apple_document_covers_every_path() {
        let value = serde_json::to_value(AppleAppSiteAssociation {
            applinks: AppleAppLinks {
                apps: Vec::new(),
                details: vec![AppleAppLinkDetails {
                    app_id: "TEAM123456.app.friendflow.mobile".into(),
                    paths: vec!["*"],
                }],
            },
        })
        .unwrap();

        assert_eq!(
            value["applinks"]["details"][0]["appID"],
            "TEAM123456.app.friendflow.mobile"
        );
        assert_eq!(value["applinks"]["details"][0]["paths"][0], "*");
    }

    #[test]
    fn android_document_delegates_every_url() {
        let value = serde_json::to_value(vec![AndroidAssetLink {
            relation: vec!["delegate_permission/common.handle_all_urls"],
            target: AndroidAssetLinkTarget {
                namespace: "android_app",
                package_name: APP_BUNDLE_ID,
                sha256_cert_fingerprints: vec!["AA:BB".into()],
            },
        }])
        .unwrap();

        assert_eq!(
            value[0]["relation"][0],
            "delegate_permission/common.handle_all_urls"
        );
        assert_eq!(value[0]["target"]["package_name"], APP_BUNDLE_ID);
    }
}
