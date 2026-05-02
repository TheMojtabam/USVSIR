# 🔧 آپدیت روی سرور موجود

اگه قبلاً نصب کردی و فقط می‌خوای فیکس‌های جدید رو بگیری، اینو روی سرور بزن:

```bash
cd /opt/observatory
git pull origin main

# rebuild frontend
cd frontend
rm -rf .next
npm install --silent
npm run build

# restart everything
systemctl restart observatory-backend observatory-worker observatory-frontend nginx

# تست
observatory test
```

یا یک خطی:

```bash
bash <(curl -sSL https://raw.githubusercontent.com/TheMojtabam/USVSIR/main/scripts/update.sh)
```

## فیکس‌های این نسخه

- ✅ صفحه از کناره‌ها overflow نمیشه
- ✅ API call ها به مسیر درست (/api → /v1) میرن
- ✅ Frontend به جای fallback data، داده واقعی نشون میده
- ✅ Error handling برای خالی بودن داده‌ها
- ✅ install.sh حالا full pipe رو بدون قطع شدن میره
- ✅ SSL permissions درست شد (644 برای nginx)
- ✅ DNS auto-fix در صورت خرابی
- ✅ check برای repo URL
- ✅ گزینه نصب لوکال
- ✅ CLI helper بهتر (`observatory test`)

## وقتی تازه نصب شد، چی ببینی

اول سرویس‌ها بالا میان ولی هیچ خبری نیست (دیتابیس خالیه). صبر کن:

1. **اولین چند دقیقه**: کرالر اخبار رو از RSS ها میاره
2. **چند دقیقه بعد**: Worker شروع به enrich با Ollama می‌کنه (ترجمه/تحلیل)
3. **15-20 دقیقه بعد**: شاخص تنش محاسبه میشه

برای دیدن پیشرفت:
```bash
observatory logs-worker
```

باید ببینی:
```
crawling 16 sources...
[Reuters] +5 new articles
enriched 8 articles
tension score = 67.5
```
