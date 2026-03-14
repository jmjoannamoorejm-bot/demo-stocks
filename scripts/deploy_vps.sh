#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <user@host> <remote_app_dir>"
  echo "Example: $0 ubuntu@203.0.113.10 /var/www/market-point-pro"
}

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

TARGET="$1"
REMOTE_DIR="$2"

echo "[1/4] Syncing project files to ${TARGET}:${REMOTE_DIR} ..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='node_modules' \
  --exclude='data/db.json' \
  ./ "${TARGET}:${REMOTE_DIR}/"

echo "[2/4] Installing production dependencies on VPS ..."
ssh "${TARGET}" "cd '${REMOTE_DIR}' && npm install --omit=dev"

echo "[3/4] Ensuring data directory exists ..."
ssh "${TARGET}" "mkdir -p '${REMOTE_DIR}/data'"

echo "[4/4] Reloading PM2 app ..."
ssh "${TARGET}" "cd '${REMOTE_DIR}' && pm2 startOrReload deploy/vps/ecosystem.config.cjs --env production && pm2 save"

echo "Done. Deployment completed."
