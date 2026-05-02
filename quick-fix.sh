#!/usr/bin/env bash
# Apply v1.1 update to existing install
set -e
INSTALL_DIR="/opt/observatory"
[[ $EUID -eq 0 ]] || { echo "must be root"; exit 1; }

REPO_URL="${OBSERVATORY_REPO:-https://github.com/TheMojtabam/USVSIR.git}"

R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; N='\033[0m'
log()  { echo -e "${G}[+]${N} $1"; }
warn() { echo -e "${Y}[!]${N} $1"; }
err()  { echo -e "${R}[✗]${N} $1"; exit 1; }

PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me || hostname -I | awk '{print $1}')

log "Pulling latest from $REPO_URL..."
cd "$INSTALL_DIR"
git fetch --all
git reset --hard origin/main

log "Backend deps update..."
cd "$INSTALL_DIR/backend"
source venv/bin/activate
pip install -r requirements.txt --upgrade --quiet
# create new tables (Setting model)
python -c "from app.core.db import init_db; import asyncio; asyncio.run(init_db())" 2>/dev/null || warn "init_db skipped"
deactivate

log "Frontend rebuild..."
cd "$INSTALL_DIR/frontend"
cat > .env.production <<EOF
NEXT_PUBLIC_API_URL=/api
EOF
rm -rf .next
npm install --silent --no-audit --no-fund 2>&1 | tail -3
if ! npm run build 2>&1 | tail -15; then
  err "frontend build failed"
fi
[[ -f .next/BUILD_ID ]] || err "frontend build missing BUILD_ID"
log "Frontend built OK"

log "Refreshing nginx config..."
cat > /etc/nginx/sites-available/observatory <<NGINX
upstream observatory_backend  { server 127.0.0.1:8000; }
upstream observatory_frontend { server 127.0.0.1:3000; }

server {
    listen 80;
    server_name _;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate     /etc/observatory/ssl/cert.pem;
    ssl_certificate_key /etc/observatory/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api/ {
        rewrite ^/api/(.*)\$ /v1/\$1 break;
        proxy_pass http://observatory_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
    }

    location ~ ^/(docs|openapi.json|health)\$ {
        proxy_pass http://observatory_backend;
        proxy_set_header Host \$host;
    }

    location / {
        proxy_pass http://observatory_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
nginx -t >/dev/null 2>&1 || err "nginx config invalid"
systemctl reload nginx

log "Restarting services..."
systemctl restart observatory-backend
sleep 2
systemctl restart observatory-worker
systemctl restart observatory-frontend
sleep 5

# Verify
echo ""
log "Verification:"
ok=0; bad=0
for svc in observatory-backend observatory-worker observatory-frontend nginx; do
  if systemctl is-active --quiet "$svc"; then
    echo -e "  ${G}✓${N} $svc"
    ok=$((ok+1))
  else
    echo -e "  ${R}✗${N} $svc - check: journalctl -u $svc -n 30"
    bad=$((bad+1))
  fi
done

if curl -k -sSf -o /dev/null https://localhost/api/articles/stats; then
  echo -e "  ${G}✓${N} API responding"
else
  echo -e "  ${Y}!${N} API not yet responding (give it 10s and retry)"
fi

echo ""
if [[ $bad -eq 0 ]]; then
  echo -e "${G}همه چیز آپدیت شد ✓${N}"
  echo -e "آدرس: https://$PUBLIC_IP"
else
  warn "$bad سرویس مشکل داره"
fi
