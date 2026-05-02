import { Shell } from '@/components/dashboard/shell';
import { SourcesView } from '@/components/dashboard/sources-view';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Shell>
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.18em] text-violet uppercase font-medium mb-2">SOURCES</div>
        <h1 className="text-[28px] font-bold tracking-tight">منابع <em className="font-serif italic font-normal gradient-text">خبری</em></h1>
        <p className="text-ink-2 mt-2 text-[14px]">لیست تمام منابع با وضعیت crawler</p>
      </div>
      <Suspense fallback={<div className="text-ink-3 py-8 text-center">در حال بارگذاری...</div>}>
        <SourcesView />
      </Suspense>
    </Shell>
  );
}
