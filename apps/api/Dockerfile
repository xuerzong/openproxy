# --- 第一阶段：编译阶段 ---
FROM rustlang/rust:nightly-bookworm AS builder

WORKDIR /app

# 1. 此时 Context 是 apps/api，所以直接拷贝当前目录下的锁文件
COPY Cargo.toml Cargo.lock ./

# 2. 预编译依赖
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
# 注意：这里的 api 替换为你的 [package] name
RUN rm -f target/release/deps/api*

# 3. 拷贝源码并正式编译
COPY src ./src
ENV SQLX_OFFLINE=true
RUN cargo build --release

# --- 第二阶段：运行时 ---
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 拷贝二进制文件
# 在独立项目中，target 就在当前目录的 target 里
COPY --from=builder /app/target/release/api /app/axum_server

ENV PORT=5060
ENV RUST_LOG=info
EXPOSE $PORT

CMD ["./axum_server"]