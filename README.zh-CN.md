# OpenProxy 中文说明

OpenProxy 是一款自部署的 AI API 代理服务，支持多家 AI 服务商统一接入，具备 API 密钥管理、用量统计、Web 管理后台等功能。

## 功能特性

- **统一 API**：兼容 OpenAI（/v1/chat/completions）和 Anthropic（/v1/messages）接口
- **多供应商容灾**：同一模型可配置多个后端，权重随机分流，自动故障切换
- **多 Key 轮换**：每个供应商可配置多个 API Key。代理会记录每个用户 API Key 最近 N 次请求命中的 `(供应商, Key)` 组合（N = min(10, 组合总数)），下次请求时优先选择未近期使用的组合，均摊负载并降低触发限速的风险
- **API Key 管理**：支持额度、请求次数、过期时间、模型访问控制
- **用量统计**：按请求统计费用、响应时间、供应商归属
- **管理后台**：模型、供应商、用户、订单管理
- **租户仪表盘**：用量图表、余额、历史请求
- **密钥加密存储**：供应商 API Key 使用 RSA 加密存储
- **多方式认证**：邮箱、魔法链接、手机、GitHub、Google（集成 better-auth）

## 架构

```
openproxy/
├── apps/
│   ├── api/        # Rust 代理服务，转发 AI 请求并统计用量
│   ├── server/     # Bun/Elysia 后端，认证、Key 管理、管理 API
│   └── web/        # React 前端，租户与管理后台
├── docker/
│   ├── docker-compose.yml        # 使用已发布镜像的部署 compose
│   └── docker-compose.dokploy.yml  # 用于 Dokploy 源码构建部署的 compose
├── packages/
│   └── schema/     # 共享 schema
```

### 请求流程

```
Client → apps/api (Rust, 5060 端口)
           ├── 鉴权中间件：通过 apps/server 校验 API Key
           ├── 权重随机选择供应商
           ├── Key 轮换：跳过近期已使用的（供应商, Key）组合
           ├── 转发到上游 AI 服务商（失败自动切换）
           └── 记录用量（tokens、费用、延迟）到数据库
```

![request_flow](./assets/workflow.png)

## 技术栈

| 层级      | 技术栈                                   |
| --------- | ---------------------------------------- |
| 代理      | Rust, axum, reqwest, tokio               |
| 后端      | Bun, Elysia, Drizzle ORM, better-auth    |
| 前端      | React, Vite, TailwindCSS, TanStack Query |
| 数据库    | PostgreSQL                               |
| Monorepo  | Turborepo, Bun workspaces                |

## 快速开始

### 依赖环境

- [Rust](https://rustup.rs/) 1.75+
- [Bun](https://bun.sh/) 1.3+
- PostgreSQL 15+
- Docker & Docker Compose（可选）

### 1. 克隆并安装依赖

```bash
git clone https://github.com/xuerzong/openproxy.git
cd openproxy
bun install
```

### 2. 配置环境变量

```bash
cp apps/server/.env.example apps/server/.env
```

编辑 `apps/server/.env`：

```dotenv
# PostgreSQL 连接
DATABASE_URL=postgres://user:password@localhost:5432/openproxy

# 生成密钥：openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-here

# 前端来源和认证回调 URL
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173
BETTER_AUTH_URL=http://localhost:5173/api

# 可选的域名 / 来源覆盖
APP_DOMAIN=
CLIENT_ORIGIN=

# 可选的 OSS 模式与定时任务鉴权
IS_OSS=true
CRON_SECRET=

# RSA 密钥对（加密供应商 API Key）
# 生成：bun scripts/generateRSAKey.ts
RSA_PRIVATE_KEY=
RSA_PUBLIC_KEY=

# 邮箱（任选其一）
RESEND_API_KEY=         # Resend
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# 可选阿里云短信 / 验证码
ALIBABA_CLOUD_ACCESS_KEY_ID=
ALIBABA_CLOUD_ACCESS_KEY_SECRET=
ALI_CAPTCHA_API_KEY=

# 可选 ZPayZ 支付
ZPAYZ_CID=
ZPAYZ_PID=
ZPAYZ_PAY_KEY=
ZPAYZ_GATEWAY=https://zpayz.cn/submit.php

# 可选 Redis
REDIS_URL=

# GitHub / Google OAuth（可选）
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

创建 `apps/api/.env`：

```dotenv
DATABASE_URL=postgres://user:password@localhost:5432/openproxy
RSA_PRIVATE_KEY=        # 与 server 保持一致
PORT=5060
```

### 生成 RSA 密钥对

用于加密供应商 API Key。运行以下命令：

```bash
bun scripts/generateRSAKey.ts
```

将输出的 RSA_PRIVATE_KEY 和 RSA_PUBLIC_KEY 分别填入 server 和 api 的 .env 文件。

### 4. 运行数据库迁移

```bash
cd apps/server
bun run migrate
```

### 5. 启动开发服务

```bash
# 根目录一键启动 server 开发服务，以及 web 的 admin 和 tenant（Turborepo）
bun run dev

# 或分别启动：
cd apps/api   && cargo run
cd apps/server && bun run dev
cd apps/web   && bun run dev:tenant   # 租户仪表盘 :5173
cd apps/web   && bun run dev:admin    # 管理后台 :5173
```

## Docker Compose 部署

推荐使用 `docker/docker-compose.yml` 一键部署，包含 server、api、web-tenant、web-admin 及 postgresql。
如果要在 Dokploy 中基于源码构建 server 和 web 镜像，可使用 `docker/docker-compose.dokploy.yml`。

### 步骤

1. 复制并编辑环境变量文件：

```bash
cp docker/.env.example docker/.env
# 编辑 docker/.env，填写数据库、密钥等配置
```

2. 启动所有服务：

```bash
cd docker
# 后台启动所有服务
docker compose up -d
```

3. 域名与端口映射

- web-tenant: 5090
- web-admin: 5091
- server: 3888
- api: 5060

如需绑定域名，建议用 Nginx 反向代理。例如：

```nginx
server {
    listen 80;
    server_name tenant.example.com;
    location / {
        proxy_pass http://127.0.0.1:5090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name admin.example.com;
    location / {
        proxy_pass http://127.0.0.1:5091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

更多配置详见 `docker/docker-compose.yml`、`docker/docker-compose.dokploy.yml` 和 `docker/.env.example`。

## API 参考

代理服务（`apps/api`）兼容 OpenAI API。

**Base URL:** `http://localhost:5060`

**认证:** `Authorization: Bearer <api-key>`

| 方法   | 路径                      | 说明                     |
| ------ | ------------------------- | ------------------------ |
| `GET`  | `/health`                 | 健康检查                 |
| `GET`  | `/v1/models`              | 获取可用模型列表         |
| `POST` | `/v1/chat/completions`    | OpenAI 聊天接口          |
| `POST` | `/v1/messages`            | Anthropic 聊天接口       |
| `POST` | `/v1/embeddings`          | 向量嵌入                 |

### 示例

```bash
curl http://localhost:5060/v1/chat/completions \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## License

MIT
