'use client';

import { motion } from 'framer-motion';
import { toFa, formatDateFa, formatTimeIR, fetcher, API } from '@/lib/utils';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

export function Hero() {
  const { data: stats } = useSWR<any>(`${API}/articles/stats`, fetcher, { refreshInterval: 30000 });
  const { data: tension } = useSWR<any>(`${API}/tension`, fetcher, { refreshInterval: 60000 });

  const score = Math.round(tension?.current ?? 0);
  const newHour = stats?.new_hour ?? 0;
  const newDay = stats?.new_day ?? 0;
  const sourcesActive = stats?.sources_active ?? 0;
  const sourcesTotal = stats?.sources_total ?? 0;
  const total = stats?.total ?? 0;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 mb-8">
      <HeroMain newHour={newHour} newDay={newDay} sourcesActive={sourcesActive} sourcesTotal={sourcesTotal} total={total} />
      <TensionCard score={score} />
    </section>
  );
}

function HeroMain({ newHour, newDay, sourcesActive, sourcesTotal, total }: any) {
  const [now, setNow] = useState({ d: '', t: '' });
  useEffect(() => {
    const tick = () => setNow({ d: formatDateFa(new Date()), t: formatTimeIR(new Date()) });
    tick();
    const i = setInterval(tick, 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[28px] p-9 bg-gradient-to-br from-bg-2 to-bg-1 border border-line-2 shadow-soft-3"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 800px 500px at 100% 0%, rgba(183,148,246,0.15), transparent 60%)' }}
      />
      <div className="relative z-10">
        <div className="font-mono text-[11px] tracking-[0.2em] text-violet uppercase font-medium mb-3.5 flex items-center gap-2.5">
          <span className="w-6 h-px bg-violet" />
          <span suppressHydrationWarning>گزارش وضعیت · {now.d} · {now.t}</span>
        </div>

        <h1 className="text-[34px] font-bold leading-tight tracking-tight mb-3">
          فرماندهی <em className="font-serif italic font-normal gradient-text">اطلاعات</em>
          <br />
          درگیری <em className="font-serif italic font-normal gradient-text">ایران ـ آمریکا</em>
        </h1>

        <p className="text-[14.5px] leading-relaxed text-ink-2 max-w-[620px] mb-5">
          {total > 0 ? (
            <>پایش ۲۴ ساعته از <strong className="text-ink">{toFa(sourcesActive)}</strong> منبع. تاکنون <strong className="text-ink">{toFa(total.toLocaleString('en-US'))}</strong> خبر در بانک ذخیره شده. موتور Qwen 2.5 محلی به‌صورت موازی فعال است.</>
          ) : (
            <>سیستم آماده است. کرالرها در حال جمع‌آوری اولین خبرها از منابع بین‌المللی هستند.</>
          )}
        </p>

        <div className="flex gap-8 flex-wrap">
          <Stat label="در ۱ ساعت" value={toFa(newHour)} />
          <Stat label="در ۲۴ ساعت" value={toFa(newDay)} />
          <Stat label="منابع" value={`${toFa(sourcesActive)}/${toFa(sourcesTotal)}`} />
          <Stat label="کل بانک" value={toFa(total.toLocaleString('en-US'))} />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">{label}</div>
      <div className="text-[26px] font-bold leading-none tracking-tight">{value}</div>
    </div>
  );
}

function TensionCard({ score }: { score: number }) {
  const status = score < 30 ? { l: 'CALM', c: 'cyan' }
    : score < 55 ? { l: 'WATCH', c: 'neutral2' }
    : score < 75 ? { l: 'ELEVATED', c: 'warn' }
    : { l: 'CRITICAL', c: 'alert' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-[28px] p-6 bg-gradient-to-b from-bg-2 to-bg-1 border border-line-2 shadow-soft-3"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 400px 300px at 50% 0%, rgba(183,148,246,0.12), transparent 70%)' }}
      />
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="font-mono text-[10px] tracking-[0.18em] text-ink-3 uppercase">شاخص تنش</div>
          <div className={`font-mono text-[10.5px] tracking-wider font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-${status.c}/10 text-${status.c} border border-${status.c}/30`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-${status.c}`} />
            {status.l}
          </div>
        </div>

        <div className="relative w-[240px] h-[130px] mx-auto mb-4">
          <svg viewBox="0 0 240 130" className="w-full h-full">
            <defs>
              <linearGradient id="gFill" x1="0" x2="1">
                <stop offset="0%" stopColor="#6ee7d4" />
                <stop offset="40%" stopColor="#b794f6" />
                <stop offset="75%" stopColor="#d4924a" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
            <path d="M 25 115 A 95 95 0 0 1 215 115" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" strokeLinecap="round" />
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
              d="M 25 115 A 95 95 0 0 1 215 115"
              fill="none" stroke="url(#gFill)" strokeWidth="14" strokeLinecap="round"
            />
          </svg>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <div className="text-[60px] font-extrabold leading-none gradient-text tracking-[-0.04em]">
              {toFa(score)}
            </div>
            <div className="font-mono text-[10px] text-ink-3 tracking-[0.15em] mt-0.5">از ۱۰۰</div>
          </div>
        </div>

        <div className="text-center font-mono text-[11px] text-ink-3 pt-3 border-t border-dashed border-line-2">
          محاسبه شده توسط Qwen 2.5
        </div>
      </div>
    </motion.div>
  );
}
