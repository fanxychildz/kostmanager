# syntax=docker/dockerfile:1

# ---- base: shared node + pnpm ----
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate
WORKDIR /app

# ---- build: install all deps and produce dist/ ----
FROM base AS build
# Toolchain for compiling native modules (better-sqlite3) when no prebuild matches.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- runtime: minimal image that serves the build ----
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/app/data/kostmanager.db
# Auto-migrate (always) + auto-seed demo data on boot. Set SEED=false to skip seeding.
ENV SEED=true
# Override these in real deployments.
ENV BETTER_AUTH_SECRET=change-me-in-production
ENV BETTER_AUTH_URL=http://localhost:3000

# node_modules is built in the `build` stage on the same base image, so the
# native better-sqlite3 binary is ABI-compatible — copy instead of reinstalling.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/server.mjs ./server.mjs
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh && mkdir -p /app/data

EXPOSE 3000
VOLUME ["/app/data"]
ENTRYPOINT ["./docker-entrypoint.sh"]
