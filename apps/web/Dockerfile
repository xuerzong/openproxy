
FROM oven/bun:1.3 AS build
ARG BUILD_MODE=tenant
WORKDIR /app

COPY package.json bun.lock* ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY website/package.json ./website/package.json

RUN bun install --frozen-lockfile

COPY . .

WORKDIR /app/apps/web
RUN bun run build:${BUILD_MODE}

FROM nginx:stable-alpine
WORKDIR /app
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY --from=build /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]