
FROM oven/bun:1.3 AS build
ARG BUILD_MODE=tenant
WORKDIR /app

COPY package.json bun.lock* ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY website/package.json ./website/package.json

RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

WORKDIR /app/apps/web
RUN bun run build:${BUILD_MODE}

FROM nginx:stable-alpine
WORKDIR /app
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY --from=build /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
CMD ["/docker-entrypoint.sh"]