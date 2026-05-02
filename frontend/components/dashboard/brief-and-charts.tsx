'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { fetcher, toFa, formatTimeIR, API } from '@/lib/utils';

export function AIBrief() {
  const { data, isLoading } = useSWR<any>(`${API}/brief`, fetcher, { refreshInterval: 300000 });

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[28px] p-9 mb-8 border border-violet/25 shadow-soft-3"
      style={{
        backgroundImage: 'radial-gradient(ellipse 800px 400px at 50% 0%, rgba(183,148,246,0.12), transparent 60%), linear-gradient(180deg, #0f1118 0%, #0a0c12 100%)',
      }}
    >
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.18em] text-violet uppercase font-medium mb-2 flex items-center gap-2">
          <span>✦</span>
          AI · DAILY BRIEFING · QWEN 2.5
        </div>
        <h2 className="text-[26px] font-bold tracking-tight leading-snug">
          گزارش <em className="font-serif italic font-normal gradient-text">روایی</em> امروز
        </h2>
      </div>

      <div className="font-serif italic text-[20px] leading-[1.7] text-ink max-w-[920px] min-h-[80px]">
        {isLoading ? (
          <span className="text-ink-3 not-italic font-sans text-[14px] flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> در حال تولید گزارش هوش مصنوعی...
          </span>
        ) : data?.text ? (
          data.text
        ) : (
          <span className="text-ink-3 not-italic font-sans text-[14px]">
            هنوز گزارش امروز تولید نشده است. به محض جمع‌آوری اخبار کافی، Qwen 2.5 خلاصه‌سازی می‌کند.
          </span>
        )}
      </div>

      {data?.generated_at && (
        <div className="flex gap-6 mt-7 pt-[22px] border-t border-dashed border-line-2 font-mono text-[11px] text-ink-3 flex-wrap">
          <span>منابع: <strong className="text-ink-2 font-semibold">{toFa(data.sources ?? 0)}</strong></span>
          <span>اخبار: <strong className="text-ink-2 font-semibold">{toFa(data.articles ?? 0)}</strong></span>
          <span>زمان: <strong className="text-ink-2 font-semibold">{formatTimeIR(data.generated_at)}</strong></span>
        </div>
      )}
    </motion.section>
  );
}
