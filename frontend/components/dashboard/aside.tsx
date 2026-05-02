'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, toFa, API } from '@/lib/utils';

export function NewsAside() {
  return (
    <aside className="flex flex-col gap-5">
      <EntitiesCard />
      <SourcesCard />
    </aside>
  );
}

function EntitiesCard() {
  const { data, isLoading } = useSWR<any[]>(`${API}/articles/entities`, fetcher, { refreshInterval: 60000 });
  const items: any[] = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...items.map(e => e.count || 0));

  return (
    <Card>
      <CardHead title={<>اشخاص <em className="font-serif italic font-normal gradient-text">پرتکرار</em></>} link="24H · NER" />
      {isLoading ? (
        <SkeletonList />
      ) : items.length === 0 ? (
        <EmptyMini msg="هنوز موجودیتی استخراج نشده" />
      ) : (
        <div className="space-y-2">
          {items.slice(0, 8).map((e: any, i: number) => (
            <EntityRow key={(e.name || '') + i} rank={i + 1} name={e.name} count={e.count}
              color={['violet', 'violet', 'cyan', 'violet', 'gold', 'cyan', 'violet', 'gold'][i % 8]}
              pct={Math.max(15, Math.round((e.count / max) * 100))} />
          ))}
        </div>
      )}
    </Card>
  );
}

function SourcesCard() {
  const { data } = useSWR<any[]>(`${API}/sources`, fetcher, { refreshInterval: 120000 });
  const sources: any[] = Array.isArray(data) ? data : [];
  const byRegion: Record<string, any[]> = {};
  for (const s of sources) (byRegion[s.region] ??= []).push(s);
  const labels: any = {
    western: 'غربی', iranian: 'ایرانی', 'russian-chinese': 'روسی/چینی',
    arab: 'عربی', israeli: 'اسرائیلی', thinktank: 'تینک‌تنک',
  };

  return (
    <Card>
      <CardHead title={<>منابع <em className="font-serif italic font-normal gradient-text">فعال</em></>} link={`${toFa(sources.length)} TOTAL`} />
      {sources.length === 0 ? (
        <EmptyMini msg="منابعی در دسترس نیست" />
      ) : (
        <div className="space-y-3">
          {Object.entries(byRegion).map(([region, list]) => (
            <div key={region}>
              <div className="font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase mb-1.5">{labels[region] || region}</div>
              <div className="flex flex-wrap gap-1.5">
                {list.map((s: any) => (
                  <Link key={s.id} href={`/sources?region=${s.region}`}>
                    <span className="text-[11px] bg-bg-3 border border-line rounded-full px-2 py-0.5 text-ink-2 flex items-center gap-1.5 cursor-pointer hover:bg-bg-4 hover:text-ink transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function EntityRow({ rank, name, count, color, pct }: any) {
  const colors: any = {
    violet: 'bg-gradient-to-r from-violet-deep to-violet',
    cyan:   'bg-gradient-to-r from-cyan-deep to-cyan',
    gold:   'bg-gradient-to-r from-gold-deep to-gold',
  };
  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rank * 0.04 }}
      className="flex items-center gap-2.5 py-2 border-b border-line last:border-0">
      <div className="font-mono text-[11px] text-ink-3 font-semibold w-5">{toFa(String(rank).padStart(2, '0'))}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1 gap-2">
          <div className="text-[13.5px] font-semibold truncate">{name}</div>
          <div className="font-mono text-[11px] text-ink-3 shrink-0">{toFa(count)}</div>
        </div>
        <div className="h-[3px] bg-bg-3 rounded-sm overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ delay: 0.2 + rank * 0.04, duration: 0.6 }}
            className={`h-full rounded-sm ${colors[color] || colors.violet}`} />
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-4 h-3 bg-bg-3 rounded animate-pulse" />
          <div className="flex-1 h-3 bg-bg-3 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyMini({ msg }: { msg: string }) {
  return <div className="text-[12px] text-ink-3 py-4 text-center">{msg}</div>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gradient-to-b from-bg-2 to-bg-1 border border-line rounded-[20px] p-5 shadow-soft-1 relative overflow-hidden">{children}</div>;
}

function CardHead({ title, link }: any) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-[15px] font-bold tracking-tight">{title}</div>
      <span className="font-mono text-[10px] text-ink-3 tracking-[0.1em] uppercase cursor-pointer hover:text-violet transition-colors">{link}</span>
    </div>
  );
}
