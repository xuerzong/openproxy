# --- 第一阶段：编译阶段 ---
FROM rustlang/rust:nightly-bookworm AS builder

WORKDIR /app

# Build context must be the repository root so shared config under packages/ is available.
COPY apps/api/Cargo.toml apps/api/Cargo.lock ./apps/api/

WORKDIR /app/apps/api

# 预编译依赖
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/api*

# 正式编译源码，并包含共享配置文件
COPY apps/api/src ./src
COPY packages/config /app/packages/config
ENV SQLX_OFFLINE=true
RUN cargo build --release

# --- 第二阶段：运行时 ---
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 拷贝二进制文件
COPY --from=builder /app/apps/api/target/release/api /app/axum_server

ENV PORT=5060
ENV RUST_LOG=info
EXPOSE $PORT

CMD ["./axum_server"]