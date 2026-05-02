# Observatory · OSINT War Room

A self-hosted intelligence aggregator for monitoring Iran-US conflict news with on-device LLM analysis (Ollama).

## ⚡ نصب یک‌خطی

```bash
bash <(curl -sSL https://raw.githubusercontent.com/TheMojtabam/USVSIR/main/install.sh)
```

منوی تعاملی با گزینه‌های:
- نصب از گیت‌هاب
- نصب لوکال
- آپدیت
- حذف
- وضعیت

## 🔧 مدیریت

```bash
observatory status        # وضعیت سرویس‌ها
observatory logs          # لاگ‌های زنده همه
observatory logs-backend  # فقط backend
observatory logs-worker   # فقط worker (LLM)
observatory test          # تست API
observatory restart       # بازنشانی
```

## 🩺 مشکلات رایج

### Frontend بالا نمیاد
```bash
cd /opt/observatory/frontend
rm -rf .next
npm run build
systemctl restart observatory-frontend
```

### اخبار جمع نمیشه
```bash
# ببین worker چی میگه
journalctl -u observatory-worker -n 50

# ببین Ollama سالمه
ollama list
curl http://localhost:11434/api/tags
```

### 502 یا 404 از Nginx
```bash
nginx -t
systemctl restart nginx
observatory test
```

## 🏗 معماری

- **Frontend**: Next.js 14 + Tailwind + Framer Motion + Recharts
- **Backend**: FastAPI + SQLAlchemy async + APScheduler
- **DB**: PostgreSQL + Redis
- **LLM**: Ollama (qwen2.5:14b default)
- **Proxy**: Nginx with self-signed SSL bound to server IP

## 📜 لایسنس

MIT
