'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Link2, AlertTriangle, RefreshCw, Inbox, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { fetcher, toFa, formatTimeIR, timeAgo, API, cn } from '@/lib/utils';
import { useState } from 'react';
import { useLang } from '@/lib/lang-store';

const FILTERS = {
  category: [
    { v: '', l: 'همه' },
    { v: 'military',   l: 'نظامی' },
    { v: 'diplomatic', l: 'دیپلماتیک' },
    { v: 'economic',   l: 'اقتصادی' },
    { v: 'cyber',      l: 'سایبری' },
  ],
  bias: [
    { v: 'pro-iran', l: 'طرفدار ایران' },
    { v: 'pro-us',   l: 'طرفدار آمریکا' },
    { v: 'neutral',  l: 'بی‌طرف' },
  ],
  hours: [
    { v: 1,   l: '۱ ساعت' },
    { v: 24,  l: '۲۴ ساعت' },
    { v: 168, l: 'هفته' },
  ],
};

export function NewsFeed({ breakingOnly = false }: { breakingOnly?: boolean }) {
  const [category, setCategory] = useState('');
  const [bias, setBias] = useState('');
  const [hours, setHours] = useState(24);
  const lang = useLang();

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (bias) params.set('bias', bias);
  if (lang !== 'all') params.set('language', lang);
  if (breakingOnly) params.set('breaking', 'true');
  params.set('hours', String(hours));
  params.set('limit', '20');

  const { data, mutate, isLoading } = useSWR<any[]>(
    `${API}/articles/?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const articles: any[] = Array.isArray(data) ? data : [];

  return (
    <section>
      <SectionHeader
        eyebrow={breakingOnly ? "BREAKING NEWS · LIVE" : "LIVE FEED · AUTO REFRESH 30s"}
        title={breakingOnly ? null : <>آخرین <em className="font-serif italic font-normal gradient-text">اخبار</em></>}
        actions={<BtnSoft icon={RefreshCw} onClick={() => mutate()}>تازه‌سازی</BtnSoft>}
      />

      {!breakingOnly && (
        <FilterBar>
          {FILTERS.category.map(c => (
            <Chip key={c.v} active={category === c.v} onClick={() => setCategory(c.v)}>{c.l}</Chip>
          ))}
          <Sep />
          {FILTERS.bias.map(b => (
            <Chip key={b.v} active={bias === b.v} onClick={() => setBias(bias === b.v ? '' : b.v)}>{b.l}</Chip>
          ))}
          <Sep />
          {FILTERS.hours.map(h => (
            <Chip key={h.v} active={hours === h.v} onClick={() => setHours(h.v)}>{h.l}</Chip>
          ))}
        </FilterBar>
      )}

      <div className="flex flex-col gap-3.5">
        {isLoading && articles.length === 0 ? (
          <Loading />
        ) : articles.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            {articles.map((a: any, i: number) => (
              <NewsCard key={a.id ?? i} article={a} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-ink-3">
      <Loader2 className="w-6 h-6 animate-spin text-violet" />
      <div className="font-mono text-[11px] tracking-[0.18em] uppercase">LOADING</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-ink-3 bg-bg-2 border border-line rounded-2xl">
      <Inbox className="w-10 h-10 opacity-40" />
      <div className="text-center">
        <div className="text-[15px] text-ink-2 font-medium mb-1">خبری در این بازه نیست</div>
        <div className="text-[12px] text-ink-3">کرالرها در حال جمع‌آوری اخبار هستند.</div>
      </div>
    </div>
  );
}

function NewsCard({ article, index }: any) {
  const sentiment = Math.abs(Math.round((article.sentiment ?? 0) * 100));
  const positive = (article.sentiment ?? 0) >= 0;
  const showTime = article.published_at || article.crawled_at;

  // language tag: source lang → display lang
  const sourceLang = (article.language || 'en').toUpperCase();
  const langLabel = sourceLang !== 'FA' ? `${sourceLang}→FA` : 'FA';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      whileHover={{ y: -1 }}
      onClick={() => article.url && window.open(article.url, '_blank')}
      className={cn(
        'relative overflow-hidden rounded-[20px] p-5 lg:p-6 cursor-pointer transition-all border shadow-soft-1 hover:shadow-soft-2 group',
        article.is_breaking
          ? 'bg-gradient-to-br from-bg-2 to-bg-1 border-violet/25'
          : 'bg-gradient-to-b from-bg-2 to-bg-1 border-line hover:border-line-2'
      )}
      style={article.is_breaking ? {
        backgroundImage: 'radial-gradient(ellipse 500px 300px at 100% 0%, rgba(183,148,246,0.12), transparent 60%), linear-gradient(180deg, #0f1118 0%, #0a0c12 100%)',
      } : undefined}
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {article.is_breaking && (
          <span className="bg-gradient-to-br from-alert to-[#c64545] text-white px-2.5 py-1 rounded-full font-mono text-[9.5px] font-bold tracking-wider uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_6px_rgba(248,113,113,0.3)]">
            ⚡ Breaking
          </span>
        )}

        {article.source && (
          <span className="flex items-center gap-1.5 bg-bg-3 border border-line rounded-full px-3 py-1 text-[11.5px] font-semibold text-ink-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: article.source.color || '#888' }} />
            {article.source.name}
          </span>
        )}

        {article.bias_detected && (
          <BiasPill bias={article.bias_detected} score={article.source?.bias_score ?? 50} />
        )}

        {article.category && <CategoryPill cat={article.category} />}

        <span className="font-mono text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-bg-4 text-ink-3 border border-line-2">
          {langLabel}
        </span>

        <span className="mr-auto font-mono text-[11px] text-ink-3 flex items-center gap-1.5">
          <Clock className="w-2.5 h-2.5" />
          <span>{showTime && formatTimeIR(showTime)} · {showTime && timeAgo(showTime)}</span>
        </span>
      </div>

      <h3 className="text-[18px] font-bold leading-snug tracking-tight mb-2 transition-colors group-hover:text-violet-soft">
        {article.title_fa || article.title_original}
      </h3>

      {article.title_en && article.language !== 'fa' && article.title_en !== article.title_fa && (
        <div className="font-serif italic text-[14.5px] text-ink-3 leading-snug mb-3 text-left" dir="ltr">
          {article.title_en}
        </div>
      )}

      {article.summary_fa && (
        <p className="text-[13.5px] leading-[1.75] text-ink-2 mb-4">{article.summary_fa}</p>
      )}

      <div className="flex justify-between items-center pt-3 border-t border-line gap-3 flex-wrap">
        <div className="flex gap-3 font-mono text-[11px] text-ink-3 items-center flex-wrap">
          {article.cross_refs > 0 && (
            <span className="flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />
              <strong className="text-ink-2 font-semibold">{toFa(article.cross_refs)}</strong> ارجاع
            </span>
          )}
          {article.entities && article.entities.length > 0 && (
            <span>
              <strong className="text-ink-2 font-semibold">{toFa(article.entities.length)}</strong> اشخاص
            </span>
          )}
          {article.edit_count > 0 && (
            <span className="flex items-center gap-1.5 text-warn">
              <AlertTriangle className="w-3 h-3" />
              ادیت
            </span>
          )}
        </div>

        {article.sentiment !== null && article.sentiment !== undefined && (
          <div className="flex items-center gap-2 font-mono text-[11px] text-ink-3">
            <span>SENTIMENT</span>
            <div className="w-[60px] h-1 bg-bg-3 rounded-sm overflow-hidden">
              <div className="h-full rounded-sm" style={{
                width: `${sentiment}%`,
                background: positive ? 'linear-gradient(90deg, #d4b87a, #6ee7d4)' : 'linear-gradient(90deg, #f87171, #d4924a)',
              }} />
            </div>
            <span className={cn('font-mono font-semibold', positive ? 'text-cyan' : sentiment > 70 ? 'text-alert' : 'text-warn')}>
              {positive ? '+' : '−'}{toFa(sentiment)}
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
}

function BiasPill({ bias, score }: any) {
  const styles: any = {
    'pro-iran': 'text-cyan border-cyan/30 bg-cyan/[0.06]',
    'pro-us':   'text-neutral2 border-neutral2/30 bg-neutral2/[0.06]',
    'neutral':  'text-ink-2 border-line-2 bg-bg-3',
  };
  const labels: any = { 'pro-iran': 'PRO-IRAN', 'pro-us': 'PRO-US', 'neutral': 'NEUTRAL' };
  return (
    <span className={cn('font-mono text-[9.5px] font-semibold tracking-[0.06em] px-2.5 py-1 rounded-full border', styles[bias] ?? styles.neutral)}>
      {labels[bias] ?? bias.toUpperCase()} · {toFa(score)}%
    </span>
  );
}

function CategoryPill({ cat }: any) {
  const labels: any = { military: 'نظامی', diplomatic: 'دیپلماتیک', economic: 'اقتصادی', cyber: 'سایبری', social: 'اجتماعی' };
  return <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-bg-3 text-ink-2 border border-line">{labels[cat] ?? cat}</span>;
}

export function SectionHeader({ eyebrow, title, actions }: any) {
  return (
    <div className="flex justify-between items-end mb-[18px] gap-3 flex-wrap">
      <div className="flex flex-col gap-1">
        <div className="font-mono text-[10px] tracking-[0.18em] text-violet uppercase font-medium">{eyebrow}</div>
        {title && <h2 className="text-[22px] font-bold tracking-tight">{title}</h2>}
      </div>
      <div className="flex gap-2 items-center">{actions}</div>
    </div>
  );
}

function FilterBar({ children }: any) {
  return <div className="flex gap-1.5 mb-[18px] flex-wrap items-center">{children}</div>;
}

function Chip({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-[12.5px] font-medium rounded-lg border transition-all shadow-soft-1',
        active
          ? 'bg-gradient-to-b from-bg-4 to-bg-3 text-ink border-line-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
          : 'bg-bg-2 text-ink-2 border-line-2 hover:bg-bg-3 hover:text-ink hover:border-line-3'
      )}
    >
      {children}
    </button>
  );
}

function Sep() { return <span className="w-px h-5 bg-line-2 mx-1" />; }

export function BtnSoft({ icon: Icon, children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-bg-2 border border-line-2 text-ink-2 px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium hover:bg-bg-3 hover:text-ink hover:border-line-3 transition-all shadow-soft-1 flex items-center gap-2"
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
