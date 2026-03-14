#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/setup_vps_ubuntu.sh"
  exit 1
fi

APP_DIR="/var/www/market-point-pro"

apt-get update
apt-get install -y curl gnupg2 ca-certificates lsb-release apt-transport-https nginx

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PM2
npm install -g pm2

mkdir -p "${APP_DIR}"
chown -R ${SUDO_USER:-root}:${SUDO_USER:-root} "${APP_DIR}"

echo "Base setup complete."
echo "Next: copy app files, create .env, configure nginx, then start pm2."
