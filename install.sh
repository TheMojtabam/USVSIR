#!/usr/bin/env bash
# ============================================================
#  Observatory · OSINT War Room Installer v1.1
# ============================================================
set -eo pipefail

REPO_URL="${OBSERVATORY_REPO:-https://github.com/TheMojtabam/USVSIR.git}"
INSTALL_DIR="${OBSERVATORY_DIR:-/opt/observatory}"
PORT="${OBSERVATORY_PORT:-443}"
DEFAULT_BRANCH="${OBSERVATORY_BRANCH:-main}"
OLLAMA_MODEL="${OBSERVATORY_MODEL:-qwen2.5:14b}"

R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'
M='\033[0;35m'; C='\033[0;36m'; W='\033[1;37m'; N='\033[0m'; BOLD='\033[1m'

banner() {
  clear
  echo -e "${C}"
  cat <<'EOF'
   ____  _                              _
  / __ \| |__  ___  ___ _ ____   ____ _| |_ ___  _ __ _   _
 | |  | | '_ \/ __|/ _ \ '__\ \ / / _` | __/ _ \| '__| | | |
 | |__| | |_) \__ \  __/ |   \ V / (_| | || (_) | |  | |_| |
  \____/|_.__/|___/\___|_|    \_/ \__,_|\__\___/|_|   \__, |
                                                       |___/
EOF
  echo -e "${N}"
  echo -e "${W}  OSINT War Room · Iran-US Conflict Intelligence${N}"
  echo -e "${Y}  ════════════════════════════════════════════════════════${N}"
  echo
}

log()  { echo -e "${G}[+]${N} $1"; }
warn() { echo -e "${Y}[!]${N} $1"; }
err()  { echo -e "${R}[✗]${N} $1"; exit 1; }

require_root() { [[ $EUID -eq 0 ]] || err "این اسکریپت باید با sudo اجرا شود"; }

detect_os() {
  if [[ -f /etc/os-release ]]; then . /etc/os-release; OS=$ID
  else err "نمی‌توان نوع OS را تشخیص داد"; fi
  log "OS: $OS"
}

fix_dns() {
  if ! getent hosts github.com >/dev/null 2>&1; then
    warn "DNS خراب، تنظیم Cloudflare..."
    chattr -i /etc/resolv.conf 2>/dev/null || true
    cat > /etc/resolv.conf <<EOF
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF
  fi
}

detect_ip() {
  PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me || curl -s --max-time 5 ipinfo.io/ip || hostname -I | awk '{print $1}')
  log "Public IP: ${BOLD}$PUBLIC_IP${N}"
}

install_dependencies() {
  log "نصب پیش‌نیازها..."
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    curl wget git unzip ca-certificates gnupg lsb-release \
    nginx postgresql postgresql-contrib redis-server \
    python3 python3-pip python3-venv python3-dev \
    build-essential libpq-dev openssl ufw rsync >/dev/null
  log "deps نصب شد"
}

install_nodejs() {
  if command -v node &>/dev/null && [[ $(node -v | cut -d. -f1 | tr -d 'v') -ge 20 ]]; then
    log "Node.js: $(node -v)"; return
  fi
  log "نصب Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  apt-get install -y nodejs >/dev/null 2>&1
  log "Node.js $(node -v) نصب شد"
}

install_ollama() {
  if ! command -v ollama &>/dev/null; then
    log "نصب Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh >/dev/null 2>&1
  else
    log "Ollama موجود است"
  fi
  systemctl enable ollama >/dev/null 2>&1 || true
  systemctl start ollama || true
  sleep 4

  if ! ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
    log "دانلود مدل $OLLAMA_MODEL (~9GB، چند دقیقه)..."
    ollama pull "$OLLAMA_MODEL" || warn "دانلود مدل ناموفق - بعداً می‌توانید دستی نصب کنید"
  else
    log "مدل $OLLAMA_MODEL آماده است"
  fi
}

setup_database() {
  log "راه‌اندازی PostgreSQL..."
  systemctl enable postgresql >/dev/null 2>&1
  systemctl start postgresql

  if [[ -f "$INSTALL_DIR/.db_password" ]]; then
    DB_PASS=$(cat "$INSTALL_DIR/.db_password")
    log "استفاده از رمز DB موجود"
  else
    DB_PASS=$(openssl rand -hex 16)
    sudo -u postgres psql <<SQL >/dev/null 2>&1
DROP DATABASE IF EXISTS observatory;
DROP USER IF EXISTS observatory;
CREATE USER observatory WITH PASSWORD '$DB_PASS';
CREATE DATABASE observatory OWNER observatory;
GRANT ALL PRIVILEGES ON DATABASE observatory TO observatory;
SQL
    mkdir -p "$INSTALL_DIR"
    echo "$DB_PASS" > "$INSTALL_DIR/.db_password"
    chmod 600 "$INSTALL_DIR/.db_password"
  fi
  log "DB آماده"

  systemctl enable redis-server >/dev/null 2>&1 || systemctl enable redis >/dev/null 2>&1 || true
  systemctl start redis-server 2>/dev/null || systemctl start redis 2>/dev/null || true
}

clone_or_pull() {
  if [[ "$LOCAL_MODE" == "1" ]]; then
    local src="${LOCAL_SRC:-$(pwd)}"
    log "Local install from $src"
    [[ -f "$src/install.sh" ]] || err "install.sh در $src یافت نشد"
    mkdir -p "$INSTALL_DIR"
    rsync -a --exclude '.git' --exclude 'node_modules' --exclude 'venv' \
          --exclude '__pycache__' --exclude '.next' "$src/" "$INSTALL_DIR/"
    return
  fi

  if [[ -d "$INSTALL_DIR/.git" ]]; then
    log "آپدیت مخزن..."
    cd "$INSTALL_DIR"
    git fetch --all >/dev/null 2>&1
    git reset --hard "origin/$DEFAULT_BRANCH" >/dev/null 2>&1
  else
    log "کلون از $REPO_URL"
    [[ -f "$INSTALL_DIR/.db_password" ]] && cp "$INSTALL_DIR/.db_password" /tmp/.obs_db_pass
    rm -rf "$INSTALL_DIR"
    git clone --depth 1 -b "$DEFAULT_BRANCH" "$REPO_URL" "$INSTALL_DIR" 2>&1 || err "clone failed"
    [[ -f /tmp/.obs_db_pass ]] && mv /tmp/.obs_db_pass "$INSTALL_DIR/.db_password"
  fi
}

setup_backend() {
  log "Backend setup..."
  cd "$INSTALL_DIR/backend"
  python3 -m venv venv
  source venv/bin/activate
  pip install --upgrade pip wheel >/dev/null 2>&1
  pip install -r requirements.txt >/dev/null 2>&1

  DB_PASS=$(cat "$INSTALL_DIR/.db_password")
  cat > "$INSTALL_DIR/backend/.env" <<EOF
DATABASE_URL=postgresql+asyncpg://observatory:$DB_PASS@localhost:5432/observatory
REDIS_URL=redis://localhost:6379/0
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=$OLLAMA_MODEL
SECRET_KEY=$(openssl rand -hex 32)
PUBLIC_IP=$PUBLIC_IP
ENVIRONMENT=production
EOF

  python -c "from app.core.db import init_db; import asyncio; asyncio.run(init_db())" 2>/dev/null || true
  deactivate
  log "Backend آماده"
}

setup_frontend() {
  log "Frontend install..."
  cd "$INSTALL_DIR/frontend"
  cat > .env.production <<EOF
NEXT_PUBLIC_API_URL=/api
EOF
  npm install --silent --no-audit --no-fund 2>&1 | tail -3 || err "npm install failed"

  log "Building frontend (1-2 min)..."
  if ! npm run build 2>&1 | tail -20; then
    err "build خطا"
  fi

  if [[ ! -f "$INSTALL_DIR/frontend/.next/BUILD_ID" ]]; then
    err "frontend build خراب: .next/BUILD_ID وجود ندارد"
  fi
  log "Frontend آماده ✓"
}

setup_ssl() {
  log "SSL self-signed برای $PUBLIC_IP..."
  mkdir -p /etc/observatory/ssl
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/observatory/ssl/key.pem \
    -out /etc/observatory/ssl/cert.pem \
    -subj "/C=IR/ST=Tehran/L=Tehran/O=Observatory/CN=$PUBLIC_IP" \
    -addext "subjectAltName=IP:$PUBLIC_IP,DNS:localhost" \
    >/dev/null 2>&1
  chmod 644 /etc/observatory/ssl/cert.pem
  chmod 600 /etc/observatory/ssl/key.pem
}

setup_nginx() {
  log "Nginx port $PORT..."
  cat > /etc/nginx/sites-available/observatory <<NGINX
upstream observatory_backend  { server 127.0.0.1:8000; }
upstream observatory_frontend { server 127.0.0.1:3000; }

server {
    listen 80;
    listen [::]:80;
    server_name _;
    return 301 https://\$host\$request_uri;
}

server {
    listen $PORT ssl http2;
    listen [::]:$PORT ssl http2;
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
  ln -sf /etc/nginx/sites-available/observatory /etc/nginx/sites-enabled/observatory
  rm -f /etc/nginx/sites-enabled/default
  nginx -t >/dev/null 2>&1 || err "nginx config invalid"
  systemctl enable nginx >/dev/null 2>&1
  systemctl restart nginx
  log "Nginx آماده ✓"
}

setup_systemd() {
  log "ساخت systemd services..."

  cat > /etc/systemd/system/observatory-backend.service <<EOF
[Unit]
Description=Observatory Backend
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/backend
EnvironmentFile=$INSTALL_DIR/backend/.env
ExecStart=$INSTALL_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  cat > /etc/systemd/system/observatory-worker.service <<EOF
[Unit]
Description=Observatory Worker
After=network.target observatory-backend.service

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/backend
EnvironmentFile=$INSTALL_DIR/backend/.env
ExecStart=$INSTALL_DIR/backend/venv/bin/python -m app.workers.scheduler
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

  cat > /etc/systemd/system/observatory-frontend.service <<EOF
[Unit]
Description=Observatory Frontend
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable observatory-backend observatory-worker observatory-frontend >/dev/null 2>&1
  systemctl restart observatory-backend
  sleep 2
  systemctl restart observatory-worker observatory-frontend
  log "Services up ✓"
}

setup_firewall() {
  log "تنظیم فایروال..."
  if command -v ufw &>/dev/null; then
    ufw allow 22/tcp  >/dev/null 2>&1
    ufw allow 80/tcp  >/dev/null 2>&1
    ufw allow $PORT/tcp >/dev/null 2>&1
    ufw --force enable >/dev/null 2>&1
  fi
}

install_cli_helper() {
  cat > /usr/local/bin/observatory <<'CLI'
#!/usr/bin/env bash
case "$1" in
  status)   systemctl status observatory-backend observatory-worker observatory-frontend nginx --no-pager ;;
  logs)     journalctl -u observatory-backend -u observatory-worker -u observatory-frontend -f ;;
  restart)  systemctl restart observatory-backend observatory-worker observatory-frontend nginx; echo "✓ بازنشانی شد" ;;
  stop)     systemctl stop observatory-backend observatory-worker observatory-frontend; echo "✓ متوقف شد" ;;
  start)    systemctl start observatory-backend observatory-worker observatory-frontend; echo "✓ شروع شد" ;;
  *)        echo "Usage: observatory {status|logs|restart|stop|start}" ;;
esac
CLI
  chmod +x /usr/local/bin/observatory
}

verify_install() {
  log "بررسی نصب (10 ثانیه صبر)..."
  sleep 10

  local fail=0
  for svc in observatory-backend observatory-worker observatory-frontend nginx; do
    if systemctl is-active --quiet "$svc"; then
      echo -e "  ${G}✓${N} $svc"
    else
      echo -e "  ${R}✗${N} $svc"
      fail=1
    fi
  done

  if curl -k -sSf -o /dev/null https://localhost/api/articles/stats; then
    echo -e "  ${G}✓${N} API responding"
  else
    echo -e "  ${Y}!${N} API not yet responding"
    fail=1
  fi
  return $fail
}

cmd_install() {
  banner
  echo -e "${W}${BOLD}  ▶ نصب Observatory${N}\n"
  require_root
  detect_os
  fix_dns
  detect_ip
  install_dependencies
  install_nodejs
  install_ollama
  clone_or_pull
  setup_database
  setup_backend
  setup_frontend
  setup_ssl
  setup_nginx
  setup_systemd
  setup_firewall
  install_cli_helper

  echo
  if verify_install; then
    echo -e "${G}${BOLD}  ✓ نصب موفق${N}"
  else
    echo -e "${Y}${BOLD}  ⚠ نصب انجام شد ولی بعضی سرویس‌ها مشکل دارند${N}"
    echo -e "${Y}    'observatory status' را اجرا کنید${N}"
  fi

  echo -e "${Y}  ════════════════════════════════════════════════════════${N}"
  echo -e "  ${W}پنل:${N}    ${C}https://$PUBLIC_IP${N}"
  echo -e "  ${W}مدل:${N}    ${C}$OLLAMA_MODEL${N}"
  echo -e "  ${W}مسیر:${N}   ${C}$INSTALL_DIR${N}"
  echo
  echo -e "  ${W}دستورات:${N} ${B}observatory status${N} · ${B}logs${N} · ${B}restart${N}"
  echo -e "${Y}  ════════════════════════════════════════════════════════${N}"
  echo
  warn "گواهی SSL خودامضا - مرورگر هشدار می‌دهد، 'Advanced → Proceed'"
  echo
}

cmd_update() {
  banner
  echo -e "${W}${BOLD}  ▶ آپدیت${N}\n"
  require_root
  detect_ip
  systemctl stop observatory-backend observatory-worker observatory-frontend 2>/dev/null || true

  clone_or_pull

  cd "$INSTALL_DIR/backend"
  source venv/bin/activate
  pip install -r requirements.txt --upgrade --quiet
  python -c "from app.core.db import init_db; import asyncio; asyncio.run(init_db())" 2>/dev/null || true
  deactivate

  cd "$INSTALL_DIR/frontend"
  cat > .env.production <<EOF
NEXT_PUBLIC_API_URL=/api
EOF
  rm -rf .next
  npm install --silent --no-audit --no-fund
  npm run build || err "frontend build failed"
  [[ -f .next/BUILD_ID ]] || err "build incomplete"

  setup_nginx
  systemctl restart observatory-backend
  sleep 2
  systemctl restart observatory-worker observatory-frontend

  echo
  if verify_install; then
    echo -e "${G}${BOLD}  ✓ آپدیت موفق${N}"
  fi
  echo -e "  ${W}آدرس:${N} ${C}https://$PUBLIC_IP${N}"
}

cmd_remove() {
  banner
  require_root
  echo -e "${R}همه داده‌ها پاک می‌شوند. تایپ 'YES':${N}"
  read -p "> " confirm
  [[ "$confirm" != "YES" ]] && { warn "لغو شد"; exit 0; }
  systemctl stop observatory-backend observatory-worker observatory-frontend 2>/dev/null || true
  systemctl disable observatory-backend observatory-worker observatory-frontend 2>/dev/null || true
  rm -f /etc/systemd/system/observatory-*.service
  systemctl daemon-reload
  rm -f /etc/nginx/sites-enabled/observatory /etc/nginx/sites-available/observatory
  systemctl restart nginx 2>/dev/null || true
  sudo -u postgres psql <<SQL >/dev/null 2>&1
DROP DATABASE IF EXISTS observatory;
DROP USER IF EXISTS observatory;
SQL
  rm -rf "$INSTALL_DIR" /etc/observatory /usr/local/bin/observatory
  echo -e "${G}✓ حذف شد${N}"
}

LOCAL_MODE="${LOCAL_MODE:-0}"
LOCAL_SRC=""

case "${1:-install}" in
  install)            cmd_install ;;
  local)              LOCAL_MODE=1; LOCAL_SRC="${2:-$(pwd)}"; cmd_install ;;
  update)             cmd_update ;;
  remove|uninstall)   cmd_remove ;;
  *) echo "Usage: $0 {install|local [path]|update|remove}"; exit 1 ;;
esac
