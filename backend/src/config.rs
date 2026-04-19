use anyhow::{Context, Result};

/// Controls what happens to new accounts right after registration.
///
/// - `Approval` (default): new users land in `pending` status and cannot
///   sign in until an admin explicitly approves them. Good for private
///   instances where you want to gate access.
/// - `Open`: new users are auto-approved and get a JWT immediately after
///   registration, so they can start using the app straight away.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegistrationMode {
    Approval,
    Open,
}

impl RegistrationMode {
    fn parse(raw: &str) -> Option<Self> {
        match raw.trim().to_ascii_lowercase().as_str() {
            "approval" | "admin" | "pending" | "closed" => Some(Self::Approval),
            "open" | "auto" | "public" => Some(Self::Open),
            _ => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiry_hours: i64,
    pub bind_addr: String,
    pub cors_origin: String,
    pub registration_mode: RegistrationMode,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let database_url = std::env::var("DATABASE_URL").context("DATABASE_URL is required")?;
        let jwt_secret = std::env::var("JWT_SECRET").context("JWT_SECRET is required")?;
        if jwt_secret.len() < 16 {
            anyhow::bail!("JWT_SECRET must be at least 16 characters");
        }
        let jwt_expiry_hours = std::env::var("JWT_EXPIRY_HOURS")
            .ok()
            .and_then(|v| v.parse::<i64>().ok())
            .unwrap_or(24 * 7);
        let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:3000".to_string());
        let cors_origin =
            std::env::var("CORS_ORIGIN").unwrap_or_else(|_| "http://localhost:8080".to_string());

        let registration_mode = match std::env::var("REGISTRATION_MODE") {
            Ok(raw) if !raw.trim().is_empty() => RegistrationMode::parse(&raw).with_context(|| {
                format!(
                    "REGISTRATION_MODE must be one of 'approval' or 'open' (got: {raw:?})"
                )
            })?,
            _ => RegistrationMode::Approval,
        };

        Ok(Self {
            database_url,
            jwt_secret,
            jwt_expiry_hours,
            bind_addr,
            cors_origin,
            registration_mode,
        })
    }
}
