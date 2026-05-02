'use client';

import { motion } from 'framer-motion';
import useSWR from 'swr';
import { fetcher, toFa, API } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useState } from 'react';

const HOURS = [
  { v: 24,   l: '۲۴ ساعت' },
  { v: 168,  l: '۷ روز' },
  { v: 720,  l: '۳۰ روز' },
];

export function AnalyticsView() {
  const [hours, setHours] = useState(168);
  const { data: dist } = useSWR<any>(`${API}/analytics/distribution?hours=${hours}`, fetcher, { refreshInterval: 60000 });
  const { data: tension } = useSWR<any>(`${API}/tension`, fetcher, { refreshInterval: 60000 });

  const points = Array.isArray(tension?.history)
    ? tension.history.map((p: any) => ({ t: new Date(p.t).getTime(), score: p.score, vol: p.vol }))
    : [];

  return (
    <>
      <div className="flex justify-end mb-4 gap-2">
        {HOURS.map(h => (
          <button
            key={h.v}
            onClick={() => setHours(h.v)}
            className={`px-3.5 py-1.5 text-[12.5px] font-medium rounded-lg border transition-all shadow-soft-1 ${
              hours === h.v
                ? 'bg-gradient-to-b from-bg-4 to-bg-3 text-ink border-line-3'
                : 'bg-bg-2 text-ink-2 border-line-2 hover:bg-bg-3 hover:text-ink'
            }`}
          >
            {h.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <BarChart
          title="توزیع زبان"
          subtitle="PERCENTAGE BY LANGUAGE"
          items={dist?.languages || []}
          gradients={['violet', 'cyan', 'gold', 'neutral', 'cyan']}
          mapLabel={(k) => ({ en: 'انگلیسی', fa: 'فارسی', ar: 'عربی', ru: 'روسی', he: 'عبری' }[k] || k)}
        />
        <BarChart
          title="دسته‌بندی"
          subtitle="CATEGORY DISTRIBUTION"
          items={dist?.categories || []}
          gradients={['alert', 'violet', 'gold', 'cyan', 'neutral']}
          mapLabel={(k) => ({ military: 'نظامی', diplomatic: 'دیپلماتیک', economic: 'اقتصادی', cyber: 'سایبری', social: 'اجتماعی' }[k] || k)}
        />
        <BarChart
          title="جهت‌گیری"
          subtitle="BIAS DETECTION"
          items={dist?.bias || []}
          gradients={['cyan', 'neutral', 'gold']}
          mapLabel={(k) => ({ 'pro-iran': 'طرفدار ایران', 'pro-us': 'طرفدار آمریکا', 'neutral': 'بی‌طرف' }[k] || k)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-6">
        <ChartCard title="شاخص تنش - 72 ساعت" sub="UPDATED LIVE">
          <div className="h-60 -mx-2">
            {points.length === 0 ? (
              <div className="h-full grid place-items-center text-ink-3 font-mono text-[11px] tracking-[0.18em] uppercase">
                NOT ENOUGH DATA YET
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b794f6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#b794f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ee7d4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6ee7d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#161922',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontFamily: 'var(--font-geist-mono)',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#b8b5ac' }}
                    formatter={(v: any) => Number(v).toFixed(1)}
                  />
                  <Area type="monotone" dataKey="vol" stroke="#6ee7d4" fill="url(#cGrad)" strokeWidth={1.5} strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="score" stroke="#b794f6" fill="url(#vGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="قطب‌نمای روایت" sub={`${toFa(dist?.sources_count || 0)} SOURCES`}>
          <NarrativeCompass items={dist?.compass || []} />
        </ChartCard>
      </div>
    </>
  );
}

function ChartCard({ title, sub, children }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-bg-2 to-bg-1 border border-line rounded-2xl p-6 shadow-soft-1"
    >
      <div className="flex justify-between items-end mb-5">
        <div>
          <div className="text-[16px] font-bold tracking-tight mb-1">{title}</div>
          <div className="font-mono text-[10px] text-ink-3 tracking-[0.1em] uppercase">{sub}</div>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

const GRADIENT_MAP: any = {
  violet:  'from-violet-deep to-violet',
  cyan:    'from-cyan-deep to-cyan',
  gold:    'from-gold-deep to-gold',
  alert:   'from-[#c64545] to-alert',
  neutral: 'from-[#6661a5] to-neutral2',
};

function BarChart({ title, subtitle, items, gradients, mapLabel }: any) {
  const total = items.reduce((s: number, it: any) => s + (it.count || 0), 0);
  return (
    <ChartCard title={title} sub={subtitle}>
      {items.length === 0 ? (
        <div className="text-center py-8 text-ink-3 font-mono text-[11px] tracking-[0.18em] uppercase">NO DATA</div>
      ) : (
        <div className="space-y-1">
          {items.map((it: any, i: number) => {
            const pct = total > 0 ? Math.round((it.count / total) * 100) : 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 py-1.5"
              >
                <div className="w-[110px] text-[12.5px] text-ink-2 truncate">{mapLabel(it.key)}</div>
                <div className="flex-1 h-1.5 bg-bg-3 rounded-sm overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.7 }}
                    className={`h-full rounded-sm bg-gradient-to-r ${GRADIENT_MAP[gradients[i % gradients.length]] || GRADIENT_MAP.violet}`}
                  />
                </div>
                <div className="w-[44px] text-left font-mono text-[11px] text-ink-3">{toFa(pct)}٪</div>
              </motion.div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

function NarrativeCompass({ items }: { items: any[] }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-60">
      <g stroke="rgba(255,255,255,0.06)" fill="none">
        <circle cx="160" cy="120" r="100" />
        <circle cx="160" cy="120" r="70" />
        <circle cx="160" cy="120" r="40" />
      </g>
      <g stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4">
        <line x1="160" y1="20" x2="160" y2="220" />
        <line x1="60" y1="120" x2="260" y2="120" />
      </g>
      <g fontFamily="var(--font-geist-mono)" fontSize="10" fill="rgba(255,255,255,0.4)">
        <text x="160" y="14" textAnchor="middle">PRO-IRAN</text>
        <text x="160" y="234" textAnchor="middle">PRO-US</text>
        <text x="50" y="124" textAnchor="end">NEUTRAL</text>
        <text x="270" y="124">STRONG</text>
      </g>
      {items.map((d: any, i: number) => {
        const color = d.bias === 'pro-iran' ? '#6ee7d4' : d.bias === 'pro-us' ? '#a8a4f3' : '#b8b5ac';
        const y = d.bias === 'pro-iran' ? 60 + (i % 3) * 12 : d.bias === 'pro-us' ? 180 - (i % 3) * 12 : 105 + (i % 3) * 15;
        const x = 100 + (d.bias_score ?? 50) * 1.5 + (i % 5) * 6;
        return (
          <motion.circle
            key={d.name}
            cx={x} cy={y} r={4}
            fill={color}
            opacity={0.85}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.025 + 0.2 }}
          >
            <title>{d.name}</title>
          </motion.circle>
        );
      })}
      <circle cx="160" cy="120" r="4" fill="#fff" />
    </svg>
  );
}
