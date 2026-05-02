'use client';

import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import { fetcher, toFa, formatTimeIR, API } from '@/lib/utils';

const REGION_LABELS: any = {
  western: 'غربی', iranian: 'ایرانی', 'russian-chinese': 'روسی/چینی',
  arab: 'عربی', israeli: 'اسرائیلی', thinktank: 'تینک‌تنک',
};

export function SourcesView() {
  const params = useSearchParams();
  const regionFilter = params.get('region');

  const { data, isLoading } = useSWR<any[]>(`${API}/sources`, fetcher);
  const sources: any[] = Array.isArray(data) ? data : [];
  const filtered = regionFilter ? sources.filter(s => s.region === regionFilter) : sources;

  const byRegion: Record<string, any[]> = {};
  for (const s of filtered) (byRegion[s.region] ??= []).push(s);

  if (isLoading) {
    return <div className="text-ink-3 py-8 text-center font-mono text-[11px] tracking-[0.18em] uppercase">LOADING</div>;
  }
  if (filtered.length === 0) {
    return <div className="text-ink-3 py-8 text-center text-[14px]">منبعی یافت نشد</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(byRegion).map(([region, list]) => (
        <div key={region}>
          <div className="font-mono text-[10px] tracking-[0.18em] text-ink-3 uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: list[0]?.color }} />
            {REGION_LABELS[region] || region} · {toFa(list.length)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map(s => <SourceCard key={s.id} source={s} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceCard({ source }: any) {
  const isOk = source.enabled && source.last_crawled;
  const last = source.last_crawled ? formatTimeIR(source.last_crawled) : '—';

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-gradient-to-b from-bg-2 to-bg-1 border border-line rounded-xl hover:border-line-2 hover:-translate-y-0.5 transition-all shadow-soft-1 hover:shadow-soft-2"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: source.color, boxShadow: `0 0 6px ${source.color}` }} />
        <div className="font-semibold text-[14px] truncate flex-1">{source.name}</div>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold ${
          isOk ? 'text-cyan bg-cyan/10' : 'text-alert bg-alert/10'
        }`}>
          {isOk ? 'OK' : 'IDLE'}
        </span>
      </div>
      <div className="font-mono text-[11px] text-ink-3 space-y-0.5">
        <div>زبان: {source.language?.toUpperCase()}</div>
        <div>آخرین crawl: {last}</div>
        <div>جهت‌گیری: {source.bias} ({toFa(source.bias_score)}%)</div>
      </div>
    </a>
  );
}
