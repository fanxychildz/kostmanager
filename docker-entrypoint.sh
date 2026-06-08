#!/bin/sh
set -e

# Ensure the SQLite data directory exists (mounted volume in production).
mkdir -p "$(dirname "${DATABASE_PATH:-/app/data/kostmanager.db}")"

# Call the binaries directly rather than via `pnpm <script>`: pnpm would try to
# verify/repair node_modules first, which fails on a copied (not pnpm-installed)
# tree inside the image.
# Auto-migrate: create/update the schema on every boot (idempotent).
echo "[entrypoint] migrating database schema (drizzle push)..."
node_modules/.bin/drizzle-kit push --force

# Auto-seed demo data by default (the seed is idempotent — existing rows are
# skipped). Disable with -e SEED=false.
if [ "${SEED:-true}" != "false" ]; then
  echo "[entrypoint] seeding demo data..."
  node_modules/.bin/tsx src/seed.ts
fi

echo "[entrypoint] starting KostManager on ${HOST:-0.0.0.0}:${PORT:-3000}..."
exec node server.mjs
