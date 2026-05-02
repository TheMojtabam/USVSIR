import { Shell } from '@/components/dashboard/shell';
import { SettingsView } from '@/components/dashboard/settings-view';

export default function Page() {
  return (
    <Shell>
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.18em] text-violet uppercase font-medium mb-2">SYSTEM CONFIG</div>
        <h1 className="text-[28px] font-bold tracking-tight">تنظیمات <em className="font-serif italic font-normal gradient-text">سیستم</em></h1>
        <p className="text-ink-2 mt-2 text-[14px]">پیکربندی LLM ها، crawl، ترجمه و مانیتورینگ</p>
      </div>
      <SettingsView />
    </Shell>
  );
}
