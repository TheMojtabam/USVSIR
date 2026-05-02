#!/usr/bin/env bash
# Quick update script - pulls from git, rebuilds frontend, restarts services
set -e

INSTALL_DIR="/opt/observatory"

cd "$INSTALL_DIR"
git fetch --all
git reset --hard origin/main

cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade >/dev/null 2>&1
deactivate

cd ../frontend
npm install --silent --no-audit --no-fund >/dev/null 2>&1
rm -rf .next
npm run build

systemctl restart observatory-backend observatory-worker observatory-frontend nginx

echo "✓ آپدیت کامل شد"
echo "  observatory status   برای بررسی"
