export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="text-center">
        <div className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase mb-3">ERR · 404</div>
        <h1 className="text-[42px] font-bold tracking-tight mb-3">
          صفحه‌ای <em className="font-serif italic font-normal text-gold">یافت</em> نشد
        </h1>
        <p className="text-ink-2 text-[14px] mb-6">آدرسی که وارد کردی موجود نیست.</p>
        <a
          href="/"
          className="inline-flex bg-gradient-gold text-bg-0 px-5 py-2.5 rounded-lg text-[13px] font-bold shadow-soft-2"
        >
          بازگشت به فید زنده
        </a>
      </div>
    </div>
  );
}
