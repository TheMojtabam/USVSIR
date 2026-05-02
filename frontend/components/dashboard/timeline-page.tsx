'use client';

import { motion } from 'framer-motion';
import useSWR from 'swr';
import { fetcher, toFa, formatTimeIR, formatDateFa, API } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import { useState } from 'react';

const RANGES = [
  { v: 24,  l: '۲۴ ساعت' },
  { v: 168, l: 'هفته' },
  { v: 720, l: 'ماه' },
];

export function TimelinePage() {
  const [hours, setHours] = useState(24);
  const { data, isLoading } = useSWR<any[]>(`${API}/timeline?hours=${hours}`, fetcher, { refreshInterval: 60000 });
  const events: any[] = Array.isArray(data) ? data : [];

  const counts = {
    critical: events.filter(e => e.severity === 'critical').length,
    major:    events.filter(e => e.severity === 'major').length,
    minor:    events.filter(e => e.severity === 'minor').length,
    verified: events.filter(e => e.verified).length,
  };

  return (
    <>
      <div className="flex justify-end mb-4 gap-2">
        {RANGES.map(r => (
          <button
            key={r.v}
            onClick={() => setHours(r.v)}
            className={`px-3.5 py-1.5 text-[12.5px] font-medium rounded-lg border transition-all shadow-soft-1 ${
              hours === r.v
                ? 'bg-gradient-to-b from-bg-4 to-bg-3 text-ink border-line-3'
                : 'bg-bg-2 text-ink-2 border-line-2 hover:bg-bg-3 hover:text-ink'
            }`}
          >
            {r.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatBox label="CRITICAL" value={counts.critical} color="text-alert" />
        <StatBox label="MAJOR"    value={counts.major}    color="text-warn" />
        <StatBox label="MINOR"    value={counts.minor}    color="text-ink-2" />
        <StatBox label="VERIFIED" value={counts.verified} color="text-cyan" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] p-6 lg:p-8 border border-line shadow-soft-2 max-w-[900px] mx-auto"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 500px 300px at 0% 0%, rgba(110,231,212,0.05), transparent 60%), linear-gradient(180deg, #0f1118 0%, #0a0c12 100%)',
        }}
      >
        {isLoading ? (
          <div className="text-center py-12 text-ink-3 font-mono text-[11px] tracking-[0.18em] uppercase">LOADING</div>
        ) : events.length === 0 ? (
          <Empty />
        ) : (
          <div className="relative pr-8">
            <div
              className="absolute right-[7px] top-1.5 bottom-1.5 w-px"
              style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0.1) 90%, transparent)' }}
            />
            {events.map((e: any, i: number) => (
              <Item key={e.id ?? i} event={e} index={i} />
            ))}
          </div>
        )}
      </motion.section>
    </>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-bg-2 border border-line rounded-xl p-4">
      <div className="font-mono text-[9.5px] tracking-[0.16em] text-ink-3 uppercase">{label}</div>
      <div className={`text-[22px] font-bold mt-1 ${color}`}>{toFa(value)}</div>
    </div>
  );
}

function Item({ event, index }: { event: any; index: number }) {
  const minor = event.severity === 'minor';
  const critical = event.severity === 'critical';
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.06 }}
      className="relative py-2.5 grid grid-cols-[110px_1fr] gap-[18px]"
    >
      <div
        className={`absolute -right-[29px] top-4 w-3.5 h-3.5 rounded-full bg-bg-1 border-2 ${
          critical ? 'border-alert' : minor ? 'border-ink-3' : 'border-violet'
        }`}
        style={{
          boxShadow: minor
            ? '0 0 0 4px #0a0c12'
            : critical
            ? '0 0 0 4px #0a0c12, 0 0 12px rgba(248,113,113,0.5)'
            : '0 0 0 4px #0a0c12, 0 0 12px rgba(183,148,246,0.5)',
        }}
      />
      <div className="font-mono text-[11px] text-ink-3 tracking-[0.04em] pt-3.5 font-semibold">
        <div>{event.occurred_at ? formatTimeIR(event.occurred_at) : ''}</div>
        <div className="text-[9.5px] text-ink-3 opacity-70 font-normal mt-0.5">{event.occurred_at ? formatDateFa(event.occurred_at) : ''}</div>
      </div>
      <div className="bg-gradient-to-b from-bg-3 to-bg-2 border border-line-2 rounded-2xl px-[18px] py-3.5 shadow-soft-1">
        <div className="text-[14.5px] font-bold mb-1 tracking-tight">{event.title}</div>
        {event.description && <div className="text-[12.5px] text-ink-2 leading-snug">{event.description}</div>}
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {event.category && <Tag>{event.category}</Tag>}
          {event.source_count > 0 && <Tag>{toFa(event.source_count)} منبع</Tag>}
          {critical && <Tag className="text-alert border-alert/30">CRITICAL</Tag>}
          {event.verified && <Tag className="text-cyan border-cyan/30">VERIFIED</Tag>}
        </div>
      </div>
    </motion.div>
  );
}

function Tag({ children, className = '' }: any) {
  return (
    <span className={`font-mono text-[9px] text-ink-3 tracking-[0.1em] uppercase px-2 py-0.5 border border-line-2 rounded-full font-semibold ${className}`}>
      {children}
    </span>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-ink-3">
      <Inbox className="w-8 h-8 opacity-40" />
      <div className="text-[13px] text-ink-2">رخدادی در این بازه ثبت نشده</div>
    </div>
  );
}
