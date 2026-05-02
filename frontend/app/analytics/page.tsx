import { Shell } from '@/components/dashboard/shell';
import { AnalyticsView } from '@/components/dashboard/analytics-view';

export default function Page() {
  return (
    <Shell>
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.18em] text-violet uppercase font-medium mb-2">ANALYTICS · NARRATIVE INTEL</div>
        <h1 className="text-[28px] font-bold tracking-tight">تحلیل <em className="font-serif italic font-normal gradient-text">ساختاری</em></h1>
        <p className="text-ink-2 mt-2 text-[14px]">توزیع زبان‌ها، دسته‌ها، جهت‌گیری‌ها و شاخص‌های تحلیلی</p>
      </div>
      <AnalyticsView />
    </Shell>
  );
}
