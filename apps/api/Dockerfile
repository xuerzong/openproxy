# --- Stage 1: Build ---
FROM rustlang/rust:nightly-bookworm AS builder

WORKDIR /app/apps/api

# Main build context is apps/api. Shared config is provided via a named build context.
COPY Cargo.toml Cargo.lock ./

# Prebuild dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/api*

# Copy application sources and shared config for the final build
COPY src ./src
COPY --from=config . /app/packages/config
ENV SQLX_OFFLINE=true
RUN cargo build --release

# --- Stage 2: Runtime ---
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy the compiled binary
COPY --from=builder /app/apps/api/target/release/api /app/axum_server

ENV PORT=5060
ENV RUST_LOG=info
EXPOSE $PORT

CMD ["./axum_server"]