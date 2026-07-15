# --- builder ---
FROM rust:1.90-slim-bookworm AS builder
WORKDIR /app/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends pkg-config libssl-dev ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

# Cache deps
COPY backend/Cargo.toml backend/Cargo.lock* ./
RUN mkdir -p src && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src target/release/friendflow-backend target/release/deps/friendflow_backend*

WORKDIR /app
COPY . .
WORKDIR /app/backend
ARG FRIENDFLOW_APP_VERSION=
RUN FRIENDFLOW_BUILD_VERSION="${FRIENDFLOW_APP_VERSION:-$(git -C /app describe --tags --always --dirty 2>/dev/null || true)}" \
    && FRIENDFLOW_BUILD_VERSION="${FRIENDFLOW_BUILD_VERSION:-$(sed -n 's/^version = "\(.*\)"/\1/p' Cargo.toml | head -n 1)}" \
    && SQLX_OFFLINE=true FRIENDFLOW_APP_VERSION="$FRIENDFLOW_BUILD_VERSION" cargo build --release

# --- runtime ---
FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 10001 app

COPY --from=builder /app/backend/target/release/friendflow-backend /usr/local/bin/friendflow-backend
COPY --from=builder /app/backend/migrations ./migrations

USER app
EXPOSE 3000
ENV RUST_LOG=info
CMD ["/usr/local/bin/friendflow-backend"]
