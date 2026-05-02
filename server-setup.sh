#!/usr/bin/env bash
# ============================================================
#  Observatory · Server Pre-Setup
#  - Fixes DNS / network issues
#  - Creates a non-root user
#  - Installs basic tools
#
#  Usage: sudo bash server-setup.sh [username]
# ============================================================
set -e

USERNAME="${1:-mojtaba}"

R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; W='\033[1;37m'; N='\033[0m'

echo -e "${C}╔════════════════════════════════════════════╗${N}"
echo -e "${C}║      Observatory Server Pre-Setup          ║${N}"
echo -e "${C}╚════════════════════════════════════════════╝${N}"
echo

[[ $EUID -eq 0 ]] || { echo -e "${R}باید با root یا sudo اجرا شود${N}"; exit 1; }

# ───────────────────────────────────────────
# 1) DNS FIX
# ───────────────────────────────────────────
echo -e "${Y}[1/5]${N} رفع مشکل DNS..."

if ! getent hosts github.com >/dev/null 2>&1 || ! getent hosts speedtest.net >/dev/null 2>&1; then
  echo -e "  ${Y}DNS فعلی کار نمی‌کند، تغییر می‌دهیم...${N}"

  # disable systemd-resolved if it's stuck
  if systemctl is-active systemd-resolved >/dev/null 2>&1; then
    chattr -i /etc/resolv.conf 2>/dev/null || true
    rm -f /etc/resolv.conf
  fi

  cat > /etc/resolv.conf <<EOF
nameserver 1.1.1.1
nameserver 1.0.0.1
nameserver 8.8.8.8
nameserver 9.9.9.9
EOF
  chattr +i /etc/resolv.conf 2>/dev/null || true
  echo -e "  ${G}✓${N} DNS به Cloudflare/Google تغییر یافت"
else
  echo -e "  ${G}✓${N} DNS سالم است"
fi

# ───────────────────────────────────────────
# 2) CONNECTIVITY TEST
# ───────────────────────────────────────────
echo -e "${Y}[2/5]${N} تست اتصال..."

test_url() {
  local url=$1
  if curl -sSf --max-time 8 -o /dev/null "$url"; then
    echo -e "  ${G}✓${N} $url"
    return 0
  else
    echo -e "  ${R}✗${N} $url - در دسترس نیست"
    return 1
  fi
}

ALL_OK=1
test_url https://github.com || ALL_OK=0
test_url https://raw.githubusercontent.com || ALL_OK=0
test_url https://registry.npmjs.org || ALL_OK=0
test_url https://pypi.org || ALL_OK=0

if [[ $ALL_OK -eq 0 ]]; then
  echo -e "${R}⚠ بعضی سرویس‌ها در دسترس نیستند - فایروال خروجی یا تحریم را بررسی کن${N}"
else
  echo -e "  ${G}همه سرویس‌های اصلی در دسترس هستند${N}"
fi

# ───────────────────────────────────────────
# 3) CREATE USER
# ───────────────────────────────────────────
echo -e "${Y}[3/5]${N} ساخت یوزر $USERNAME..."

if id "$USERNAME" >/dev/null 2>&1; then
  echo -e "  ${Y}یوزر $USERNAME از قبل وجود دارد${N}"
else
  useradd -m -s /bin/bash "$USERNAME"
  echo -e "  ${G}✓${N} یوزر ساخته شد"

  echo
  echo -e "${W}یک پسورد برای $USERNAME تعیین کن:${N}"
  passwd "$USERNAME"
fi

# add to sudo
usermod -aG sudo "$USERNAME"
echo -e "  ${G}✓${N} به گروه sudo اضافه شد"

# allow passwordless sudo (optional, comment out if you want password)
# echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME
# chmod 440 /etc/sudoers.d/$USERNAME

# copy ssh keys from root
if [[ -f /root/.ssh/authorized_keys ]]; then
  mkdir -p /home/$USERNAME/.ssh
  cp /root/.ssh/authorized_keys /home/$USERNAME/.ssh/
  chown -R $USERNAME:$USERNAME /home/$USERNAME/.ssh
  chmod 700 /home/$USERNAME/.ssh
  chmod 600 /home/$USERNAME/.ssh/authorized_keys
  echo -e "  ${G}✓${N} کلیدهای SSH از root کپی شدند"
fi

# ───────────────────────────────────────────
# 4) INSTALL BASIC TOOLS
# ───────────────────────────────────────────
echo -e "${Y}[4/5]${N} نصب ابزارهای پایه..."

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  curl wget git unzip vim htop tmux jq net-tools \
  ca-certificates gnupg lsb-release \
  >/dev/null 2>&1

echo -e "  ${G}✓${N} ابزارهای پایه نصب شدند"

# fix speedtest-cli
if command -v speedtest-cli >/dev/null 2>&1; then
  pip3 uninstall -y speedtest-cli 2>/dev/null || true
fi

# install official speedtest
if ! command -v speedtest >/dev/null 2>&1; then
  echo -e "  ${Y}نصب speedtest رسمی Ookla...${N}"
  curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | bash >/dev/null 2>&1
  apt-get install -y speedtest >/dev/null 2>&1 || \
    echo -e "  ${Y}!${N} نصب speedtest ناموفق - ادامه می‌دهیم"
fi

# ───────────────────────────────────────────
# 5) SUMMARY
# ───────────────────────────────────────────
echo -e "${Y}[5/5]${N} پایان"
echo
echo -e "${G}════════════════════════════════════════════${N}"
echo -e "${G}✓ آماده‌سازی سرور با موفقیت انجام شد${N}"
echo -e "${G}════════════════════════════════════════════${N}"
echo
echo -e "  ${W}یوزر:${N}      $USERNAME"
echo -e "  ${W}گروه‌ها:${N}    $(groups $USERNAME)"
echo -e "  ${W}تست نت:${N}    speedtest"
echo
echo -e "${W}قدم بعدی - نصب Observatory:${N}"
echo
echo -e "  ${C}# اگه فایل‌ها رو روی سرور داری:${N}"
echo -e "  cd /path/to/observatory"
echo -e "  sudo bash install.sh local"
echo
echo -e "  ${C}# یا از گیت‌هاب (آدرس مخزن خودت رو بذار):${N}"
echo -e "  bash <(curl -sSL https://raw.githubusercontent.com/USERNAME/REPO/main/install.sh)"
echo
