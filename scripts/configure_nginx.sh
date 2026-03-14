#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <domain> [www-domain]"
  echo "Example: $0 example.com www.example.com"
  exit 1
fi

DOMAIN="$1"
WWW_DOMAIN="${2:-www.$DOMAIN}"
TEMPLATE="deploy/vps/nginx.market-point-pro.conf"
TARGET="/etc/nginx/sites-available/market-point-pro"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Template not found: $TEMPLATE"
  exit 1
fi

sudo sed \
  -e "s/example.com/${DOMAIN//\//\\/}/g" \
  -e "s/www.example.com/${WWW_DOMAIN//\//\\/}/g" \
  "$TEMPLATE" | sudo tee "$TARGET" >/dev/null

sudo ln -sf "$TARGET" /etc/nginx/sites-enabled/market-point-pro
sudo nginx -t
sudo systemctl reload nginx

echo "Nginx configured for $DOMAIN and $WWW_DOMAIN"
