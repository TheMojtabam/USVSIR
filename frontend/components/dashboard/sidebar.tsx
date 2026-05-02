'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Zap, Globe2, BarChart3, Clock, MessageSquare, Settings, ChevronDown, X } from 'lucide-react';
import { cn, toFa, fetcher, API } from '@/lib/utils';
import useSWR from 'swr';
import { useEffect } from 'react';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const { data: stats } = useSWR<any>(`${API}/articles/stats`, fetcher, { refreshInterval: 30000 });
  const { data: sources } = useSWR<any[]>(`${API}/sources`, fetcher, { refreshInterval: 300000 });

  const total = stats?.total ?? 0;
  const breaking = stats?.breaking ?? 0;
  const sourcesByRegion: Record<string, number> = {};
  if (Array.isArray(sources)) {
    for (const s of sources) sourcesByRegion[s.region] = (sourcesByRegion[s.region] ?? 0) + 1;
  }

  const navMain = [
    { href: '/',          icon: Activity,    label: 'فید زنده',     count: total },
    { href: '/breaking',  icon: Zap,         label: 'اخبار فوری',   count: breaking },
    { href: '/analytics', icon: BarChart3,   label: 'تحلیل‌ها',     count: 0 },
    { href: '/timeline',  icon: Clock,       label: 'تایم‌لاین',    count: 0 },
  ];

  const sourceItems = [
    { color: '#d4924a',         label: 'غربی',        region: 'western' },
    { color: '#6ee7d4',         label: 'ایرانی',      region: 'iranian' },
    { color: '#a8a4f3',         label: 'روسی/چینی',   region: 'russian-chinese' },
    { color: '#d4b87a',         label: 'عربی',        region: 'arab' },
    { color: '#b794f6',         label: 'اسرائیلی',    region: 'israeli' },
    { color: '#b8b5ac',         label: 'تینک‌تنک',    region: 'thinktank' },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // close drawer when navigation occurs
  useEffect(() => { onClose(); }, [path, onClose]);

  const inner = (
    <>
      <div className="px-5 pt-6 pb-5 border-b border-line flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <div className="font-serif text-[22px] leading-none">Observatory</div>
            <div className="font-mono text-[9px] tracking-[0.18em] text-ink-3 mt-1">PERSIAN GULF DESK</div>
          </div>
        </Link>
        <button onClick={onClose} className="lg:hidden text-ink-3 p-2"><X className="w-4 h-4" /></button>
      </div>

      <NavSection title="داشبورد">
        {navMain.map((item, i) => (
          <NavItem key={i} {...item} active={path === item.href} index={i} />
        ))}
      </NavSection>

      <NavSection title="منابع">
        {sourceItems.map((s, i) => (
          <SourceLink
            key={i} {...s}
            count={sourcesByRegion[s.region] || 0}
            active={path === `/sources?region=${s.region}`}
          />
        ))}
      </NavSection>

      <NavSection title="سیستم">
        <NavItem href="/chat"     icon={MessageSquare} label="چت RAG"    count={0} active={path === '/chat'} index={0} />
        <NavItem href="/settings" icon={Settings}      label="تنظیمات"   count={0} active={path === '/settings'} index={1} />
      </NavSection>

      <UserCard />
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[268px] shrink-0 sticky top-0 h-screen overflow-y-auto bg-gradient-to-b from-bg-1 to-bg-0 border-l border-line">
        {inner}
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed top-0 right-0 w-[280px] h-full overflow-y-auto bg-gradient-to-b from-bg-1 to-bg-0 border-l border-line z-[70]"
            >
              {inner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function BrandLogo() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="relative w-10 h-10 rounded-xl grid place-items-center bg-gradient-conic shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_16px_rgba(183,148,246,0.4)]"
    >
      <div className="absolute inset-[3px] rounded-[9px] bg-bg-1" />
      <svg viewBox="0 0 24 24" className="relative z-10 w-[18px] h-[18px]" fill="none" stroke="white" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" fill="white" />
      </svg>
    </motion.div>
  );
}

function NavSection({ title, children }: any) {
  return (
    <div className="mb-5 mt-5">
      <div className="px-5 pb-2.5 font-mono text-[9.5px] tracking-[0.2em] text-ink-3 uppercase font-medium">{title}</div>
      {children}
    </div>
  );
}

function NavItem({ href, icon: Icon, label, count, active = false, index = 0 }: any) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.04 * index }}
        className={cn(
          "mx-2 px-4 py-2.5 rounded-[10px] flex items-center gap-3 cursor-pointer transition-all relative text-[13px] font-medium",
          active
            ? "bg-gradient-to-b from-bg-3 to-bg-2 text-ink border border-line-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.4)]"
            : "text-ink-2 hover:bg-bg-2 hover:text-ink"
        )}
      >
        {active && (
          <span className="absolute -right-[9px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-sm bg-gradient-to-b from-violet to-cyan shadow-[0_0_12px_rgba(183,148,246,0.6)]" />
        )}
        <Icon className="w-[15px] h-[15px] opacity-85 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {count > 0 && (
          <span className={cn(
            "font-mono text-[10px] px-1.5 py-0.5 rounded-full font-medium border tabular-nums",
            active
              ? "bg-gradient-violet text-white border-transparent"
              : "bg-bg-3 text-ink-3 border-line"
          )}>
            {toFa(count)}
          </span>
        )}
      </motion.div>
    </Link>
  );
}

function SourceLink({ color, label, count, region, active }: any) {
  return (
    <Link href={`/sources?region=${region}`}>
      <div className={cn(
        "mx-2 px-4 py-2 rounded-[10px] flex items-center gap-3 cursor-pointer transition-all text-[13px] font-medium",
        active ? "bg-bg-3 text-ink" : "text-ink-2 hover:bg-bg-2 hover:text-ink"
      )}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="flex-1 truncate">{label}</span>
        {count > 0 && <span className="font-mono text-[10px] text-ink-3">{toFa(count)}</span>}
      </div>
    </Link>
  );
}

function UserCard() {
  return (
    <div className="mt-auto mx-4 mb-5 mt-5 p-3 rounded-2xl bg-gradient-to-b from-bg-2 to-bg-1 border border-line-2 flex items-center gap-3 shadow-soft-2">
      <div className="w-9 h-9 rounded-full bg-gradient-conic grid place-items-center font-bold text-[14px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">م</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate">مجتبی</div>
        <div className="font-mono text-[10px] text-ink-3">ANALYST</div>
      </div>
      <ChevronDown className="w-3.5 h-3.5 text-ink-3" />
    </div>
  );
}
