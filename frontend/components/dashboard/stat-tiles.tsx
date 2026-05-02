'use client';

import { motion } from 'framer-motion';
import { Zap, Globe2, Shield, Database } from 'lucide-react';
import useSWR from 'swr';
import { fetcher, toFa, API } from '@/lib/utils';

export function StatTiles() {
  const { data: stats } = useSWR<any>(`${API}/articles/stats`, fetcher, { refreshInterval: 30000 });

  const tiles = [
    { icon: Zap,      label: 'اخبار ۱ ساعت گذشته', value: toFa(stats?.new_hour ?? 0), sub: stats?.new_hour > 0 ? 'فعال' : 'منتظر داده', tone: 'violet' },
    { icon: Globe2,   label: 'منابع فعال',         value: toFa(stats?.sources_active ?? 0), sub: `از ${toFa(stats?.sources_total ?? 0)} منبع`, tone: 'cyan' },
    { icon: Shield,   label: 'اخبار فوری',         value: toFa(stats?.breaking ?? 0), sub: 'در ۲۴ ساعت', tone: 'gold' },
    { icon: Database, label: 'کل بانک',            value: toFa((stats?.total ?? 0).toLocaleString('en-US')), sub: 'خبر تحلیل‌شده', tone: 'alert' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {tiles.map((t, i) => <Tile key={i} {...t} index={i} />)}
    </div>
  );
}

const TONE: Record<string, { bg: string; glow: string }> = {
  violet:  { bg: 'bg-gradient-violet', glow: 'rgba(183,148,246,0.4)' },
  cyan:    { bg: 'bg-gradient-cyan',   glow: 'rgba(110,231,212,0.4)' },
  gold:    { bg: 'bg-gradient-gold',   glow: 'rgba(212,184,122,0.4)' },
  alert:   { bg: 'bg-gradient-to-br from-alert to-[#c64545]', glow: 'rgba(248,113,113,0.4)' },
};

function Tile({ icon: Icon, label, value, sub, tone, index }: any) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-[20px] p-5 bg-gradient-to-b from-bg-2 to-bg-1 border border-line cursor-pointer transition-all hover:border-line-2 shadow-soft-2"
    >
      <div className="absolute -top-1/2 -right-1/2 w-[200px] h-[200px] rounded-full pointer-events-none opacity-30 blur-3xl" style={{ background: t.glow }} />
      <div className={`relative w-9 h-9 rounded-[10px] grid place-items-center mb-3.5 ${t.bg} shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2)]`}>
        <Icon className="w-[17px] h-[17px] text-black/70" strokeWidth={2} />
      </div>
      <div className="relative text-[12.5px] text-ink-3 mb-1.5 font-medium">{label}</div>
      <div className="relative text-[30px] font-bold leading-none tracking-tight mb-2">{value}</div>
      <div className="relative font-mono text-[11px] text-ink-3">{sub}</div>
    </motion.div>
  );
}
