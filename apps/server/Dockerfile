FROM oven/bun:1.3 AS builder

WORKDIR /app

COPY package.json bun.lock* ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY website/package.json ./website/package.json

RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

WORKDIR /app/apps/server
RUN bun build ./index.ts --bundle --minify --target bun --outfile dist/index.js
RUN bun build ./scripts/migrate.ts --bundle --minify --target bun --outfile dist/migrate.js

FROM oven/bun:1.3

WORKDIR /app

COPY --from=builder /app/apps/server/dist/index.js .
COPY --from=builder /app/apps/server/dist/migrate.js .
COPY --from=builder /app/apps/server/drizzle ./drizzle

ENV PORT=3888
ENV NODE_ENV=production

EXPOSE 3888

ENTRYPOINT ["sh", "-c", "bun migrate.js && bun index.js"]