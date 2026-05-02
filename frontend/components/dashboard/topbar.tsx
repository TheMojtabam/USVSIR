'use client';

import { motion } from 'framer-motion';
import { Bell, Settings2, Menu } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toFa, formatTimeIR } from '@/lib/utils';
import useSWR from 'swr';
import { fetcher, API } from '@/lib/utils';
import { useLangFilter } from '@/lib/lang-store';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [time, setTime] = useState('');
  const { data: stats } = useSWR<any>(`${API}/articles/stats`, fetcher, { refreshInterval: 30000 });
  const { data: settings } = useSWR<any>(`${API}/settings`, fetcher, { refreshInterval: 60000 });
  const { lang, setLang } = useLangFilter();

  useEffect(() => {
    const tick = () => setTime(formatTimeIR(new Date()));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const sourcesActive = stats?.sources_active ?? 0;
  const sourcesTotal = stats?.sources_total ?? 0;
  const llmInstances = settings?.llm_instances ?? 1;

  return (
    <div className="sticky top-0 z-50 backdrop-blur-2xl backdrop-saturate-150 bg-bg-0/70 border-b border-line px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 grid place-items-center bg-bg-2 border border-line-2 rounded-lg text-ink-2 hover:bg-bg-3 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <LangTabs current={lang} onChange={setLang} />
      </div>

      <div className="flex items-center gap-2 lg:gap-2.5 flex-wrap justify-end">
        <Pill>
          <span className="relative flex h-2 w-2 ml-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan"></span>
          </span>
          <span className="font-mono text-[10.5px] tracking-wide">LIVE · {toFa(sourcesActive)}/{toFa(sourcesTotal)}</span>
        </Pill>

        <Pill className="hidden md:flex">
          <span className="font-mono text-[10.5px] tracking-wide" suppressHydrationWarning>{time}</span>
        </Pill>

        <Pill className="hidden xl:flex">
          <span className="font-mono text-[10.5px] tracking-wide">QWEN ×{toFa(llmInstances)}</span>
        </Pill>

        <Link href="/settings">
          <IconButton><Settings2 className="w-4 h-4" /></IconButton>
        </Link>
      </div>
    </div>
  );
}

function LangTabs({ current, onChange }: { current: string; onChange: (l: string) => void }) {
  const tabs = [
    { v: 'all', l: 'همه' },
    { v: 'fa',  l: 'فارسی' },
    { v: 'en',  l: 'انگلیسی' },
    { v: 'ar',  l: 'عربی' },
  ];
  return (
    <div className="flex gap-1 bg-bg-2 border border-line-2 rounded-[10px] p-1">
      {tabs.map(t => (
        <button
          key={t.v}
          onClick={() => onChange(t.v)}
          className={`px-3 lg:px-3.5 py-1.5 text-[12.5px] font-medium rounded-[7px] transition-all ${
            current === t.v
              ? 'bg-gradient-to-b from-bg-4 to-bg-3 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.5)]'
              : 'text-ink-3 hover:text-ink-2'
          }`}
        >
          {t.l}
        </button>
      ))}
    </div>
  );
}

function Pill({ children, className = '' }: any) {
  return (
    <div className={`flex items-center gap-2 bg-bg-2 border border-line-2 rounded-full px-2.5 lg:px-3 py-1.5 text-ink-2 shadow-soft-1 ${className}`}>
      {children}
    </div>
  );
}

function IconButton({ children }: any) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.95 }}
      className="w-9 h-9 grid place-items-center bg-bg-2 border border-line-2 rounded-lg text-ink-2 cursor-pointer hover:bg-bg-3 hover:text-ink hover:border-line-3 transition-colors"
    >
      {children}
    </motion.div>
  );
}
