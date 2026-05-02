import { Shell } from '@/components/dashboard/shell';
import { TimelinePage } from '@/components/dashboard/timeline-page';

export default function Page() {
  return (
    <Shell>
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.18em] text-violet uppercase font-medium mb-2">CRITICAL EVENTS</div>
        <h1 className="text-[28px] font-bold tracking-tight">تایم‌لاین <em className="font-serif italic font-normal gradient-text">رخدادها</em></h1>
        <p className="text-ink-2 mt-2 text-[14px]">رویدادهای کلیدی استخراج‌شده از اخبار</p>
      </div>
      <TimelinePage />
    </Shell>
  );
}
