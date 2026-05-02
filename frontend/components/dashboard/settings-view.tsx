'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, toFa, formatTimeIR, API } from '@/lib/utils';
import { Cpu, Database, Globe, Activity, Terminal, ChevronDown, Loader2, Check, AlertCircle } from 'lucide-react';

const SECTIONS = [
  { id: 'performance', label: 'سرعت و کارایی', icon: Cpu },
  { id: 'translation', label: 'ترجمه و تحلیل',   icon: Globe },
  { id: 'sources',     label: 'منابع خبری',     icon: Database },
  { id: 'monitoring',  label: 'مانیتورینگ',     icon: Activity },
  { id: 'logs',        label: 'لاگ‌ها',          icon: Terminal },
];

export function SettingsView() {
  const [section, setSection] = useState('performance');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 max-w-[1100px] mx-auto">
      <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-[80px] lg:self-start">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-3.5 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-colors whitespace-nowrap ${
              section === s.id
                ? 'bg-bg-3 text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                : 'text-ink-2 hover:bg-bg-2 hover:text-ink'
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </nav>

      <div>
        {section === 'performance' && <PerformanceSection />}
        {section === 'translation' && <TranslationSection />}
        {section === 'sources'     && <SourcesSection />}
        {section === 'monitoring'  && <MonitoringSection />}
        {section === 'logs'        && <LogsSection />}
      </div>
    </div>
  );
}

// ───── Settings save helper ─────
async function saveSetting(key: string, value: any) {
  const r = await fetch(`${API}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value }),
  });
  if (r.ok) mutate(`${API}/settings`);
  return r.ok;
}

function Card({ title, desc, children }: any) {
  return (
    <div className="bg-bg-2 border border-line rounded-2xl p-6 mb-4 shadow-soft-1">
      <div className="text-[16px] font-bold tracking-tight mb-1">{title}</div>
      {desc && <div className="text-[12.5px] text-ink-3 mb-4">{desc}</div>}
      {children}
    </div>
  );
}

function Row({ label, desc, children }: any) {
  return (
    <div className="flex justify-between items-center gap-4 py-3.5 border-b border-line last:border-0">
      <div className="flex-1">
        <div className="text-[13.5px] font-semibold mb-0.5">{label}</div>
        {desc && <div className="text-[12px] text-ink-3 leading-relaxed">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: any) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-[38px] h-[22px] rounded-full relative transition-colors border ${
        value ? 'bg-gradient-violet border-transparent' : 'bg-bg-4 border-line-2'
      }`}
    >
      <span
        className={`absolute top-0.5 w-[16px] h-[16px] rounded-full bg-white shadow-md transition-all ${
          value ? 'right-[calc(100%-18px)]' : 'right-0.5'
        }`}
      />
    </button>
  );
}

function Select({ value, options, onChange }: any) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-bg-3 border border-line-2 rounded-lg px-3 py-1.5 pl-7 font-mono text-[12px] text-ink-2 cursor-pointer appearance-none hover:bg-bg-4 transition-colors min-w-[140px]"
      >
        {options.map((o: any) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
      <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 pointer-events-none" />
    </div>
  );
}

function StatusPill({ ok, label }: any) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
      ok ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'bg-alert/10 text-alert border border-alert/30'
    }`}>
      {ok ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ───── Performance ─────
function PerformanceSection() {
  const { data: settings, isLoading } = useSWR<any>(`${API}/settings`, fetcher);

  if (isLoading || !settings) {
    return <Card title="در حال بارگذاری..."><Loader2 className="w-5 h-5 animate-spin text-ink-3" /></Card>;
  }

  return (
    <>
      <Card
        title="سرعت LLM"
        desc="کنترل تعداد instance های Qwen که موازی اجرا می‌شوند"
      >
        <Row
          label="تعداد نمونه‌های هم‌زمان"
          desc={`فعلی: ${toFa(settings.llm_instances || 1)} نمونه. هرچه بیشتر، تحلیل سریع‌تر اما RAM/CPU بیشتر مصرف می‌شود (هر instance ~9GB).`}
        >
          <Select
            value={settings.llm_instances || 1}
            onChange={(v: any) => saveSetting('llm_instances', Number(v))}
            options={[
              { v: 1, l: '۱ نمونه' },
              { v: 2, l: '۲ نمونه' },
              { v: 3, l: '۳ نمونه' },
              { v: 4, l: '۴ نمونه' },
              { v: 6, l: '۶ نمونه' },
              { v: 8, l: '۸ نمونه' },
            ]}
          />
        </Row>

        <Row
          label="مدل LLM"
          desc="انتخاب مدل برای ترجمه و تحلیل"
        >
          <Select
            value={settings.ollama_model || 'qwen2.5:14b'}
            onChange={(v: any) => saveSetting('ollama_model', v)}
            options={[
              { v: 'qwen2.5:7b',  l: 'Qwen 2.5 7B (سبک)' },
              { v: 'qwen2.5:14b', l: 'Qwen 2.5 14B (پیشنهادی)' },
              { v: 'qwen2.5:32b', l: 'Qwen 2.5 32B (دقیق)' },
              { v: 'llama3.1:8b', l: 'Llama 3.1 8B' },
            ]}
          />
        </Row>

        <Row
          label="حجم batch enrichment"
          desc="تعداد خبرهایی که هم‌زمان به LLM داده می‌شود"
        >
          <Select
            value={settings.enrich_batch || 8}
            onChange={(v: any) => saveSetting('enrich_batch', Number(v))}
            options={[
              { v: 4,  l: '۴' },
              { v: 8,  l: '۸' },
              { v: 16, l: '۱۶' },
              { v: 32, l: '۳۲' },
            ]}
          />
        </Row>
      </Card>

      <Card
        title="کرالر"
        desc="تنظیمات جمع‌آوری اخبار"
      >
        <Row
          label="فاصله crawl"
          desc="هر چند دقیقه RSS ها چک شوند"
        >
          <Select
            value={settings.crawl_interval || 5}
            onChange={(v: any) => saveSetting('crawl_interval', Number(v))}
            options={[
              { v: 2,  l: '۲ دقیقه' },
              { v: 5,  l: '۵ دقیقه' },
              { v: 10, l: '۱۰ دقیقه' },
              { v: 15, l: '۱۵ دقیقه' },
              { v: 30, l: '۳۰ دقیقه' },
            ]}
          />
        </Row>

        <Row
          label="عمق crawl"
          desc="چند مقاله اخیر از هر RSS بررسی شود"
        >
          <Select
            value={settings.crawl_depth || 30}
            onChange={(v: any) => saveSetting('crawl_depth', Number(v))}
            options={[
              { v: 20,  l: '۲۰' },
              { v: 30,  l: '۳۰' },
              { v: 50,  l: '۵۰' },
              { v: 100, l: '۱۰۰' },
            ]}
          />
        </Row>

        <Row
          label="Backfill عمیق"
          desc="در ساعات بیکاری، اخبار قدیمی‌تر هم جمع‌آوری شود"
        >
          <Toggle
            value={!!settings.deep_backfill}
            onChange={(v: any) => saveSetting('deep_backfill', v)}
          />
        </Row>
      </Card>
    </>
  );
}

// ───── Translation ─────
function TranslationSection() {
  const { data: settings, isLoading } = useSWR<any>(`${API}/settings`, fetcher);
  if (isLoading || !settings) return <Card title="..."><Loader2 className="w-5 h-5 animate-spin" /></Card>;

  return (
    <Card title="ترجمه و تحلیل" desc="تنظیمات نحوه پردازش اخبار توسط هوش مصنوعی">
      <Row
        label="ترجمه فارسی همه اخبار"
        desc="اخبار غیرفارسی به فارسی ترجمه می‌شوند"
      >
        <Toggle
          value={settings.translate_fa !== false}
          onChange={(v: any) => saveSetting('translate_fa', v)}
        />
      </Row>

      <Row
        label="ترجمه انگلیسی همه اخبار"
        desc="حتی اخبار فارسی هم به انگلیسی ترجمه شوند"
      >
        <Toggle
          value={!!settings.translate_en}
          onChange={(v: any) => saveSetting('translate_en', v)}
        />
      </Row>

      <Row
        label="دسته‌بندی خودکار"
        desc="نظامی، دیپلماتیک، اقتصادی، سایبری، اجتماعی"
      >
        <Toggle
          value={settings.auto_categorize !== false}
          onChange={(v: any) => saveSetting('auto_categorize', v)}
        />
      </Row>

      <Row
        label="تشخیص جهت‌گیری (Bias)"
        desc="تشخیص طرفدار ایران/آمریکا/بی‌طرف"
      >
        <Toggle
          value={settings.detect_bias !== false}
          onChange={(v: any) => saveSetting('detect_bias', v)}
        />
      </Row>

      <Row
        label="استخراج اشخاص (NER)"
        desc="پیدا کردن نام افراد، سازمان‌ها و مکان‌ها"
      >
        <Toggle
          value={settings.extract_entities !== false}
          onChange={(v: any) => saveSetting('extract_entities', v)}
        />
      </Row>

      <Row
        label="تحلیل احساس (Sentiment)"
        desc="نمره منفی/مثبت برای هر خبر"
      >
        <Toggle
          value={settings.sentiment !== false}
          onChange={(v: any) => saveSetting('sentiment', v)}
        />
      </Row>
    </Card>
  );
}

// ───── Sources ─────
function SourcesSection() {
  const { data: sources } = useSWR<any[]>(`${API}/sources`, fetcher);
  const list: any[] = Array.isArray(sources) ? sources : [];

  return (
    <Card title={`منابع خبری (${toFa(list.length)})`} desc="فعال/غیرفعال کردن منابع">
      {list.length === 0 ? (
        <div className="text-center py-6 text-ink-3 font-mono text-[11px] tracking-[0.18em] uppercase">LOADING SOURCES...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {list.map(s => (
            <SourceItem key={s.id} source={s} />
          ))}
        </div>
      )}
    </Card>
  );
}

function SourceItem({ source }: any) {
  const [enabled, setEnabled] = useState(source.enabled);
  const lastCrawl = source.last_crawled ? formatTimeIR(source.last_crawled) : '—';
  const isOk = enabled && source.last_crawled;

  return (
    <div className="bg-bg-3 border border-line rounded-xl p-3 flex items-center gap-3">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: source.color, boxShadow: `0 0 6px ${source.color}` }} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13px] truncate">{source.name}</div>
        <div className="font-mono text-[10px] text-ink-3 mt-0.5">آخرین: {lastCrawl}</div>
      </div>
      <Toggle
        value={enabled}
        onChange={async (v: any) => {
          setEnabled(v);
          const r = await fetch(`${API}/sources/${source.id}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: v }),
          });
          if (!r.ok) setEnabled(!v); // revert
          mutate(`${API}/sources`);
        }}
      />
    </div>
  );
}

// ───── Monitoring ─────
function MonitoringSection() {
  const { data: stats } = useSWR<any>(`${API}/monitoring`, fetcher, { refreshInterval: 5000 });

  if (!stats) return <Card title="..."><Loader2 className="w-5 h-5 animate-spin" /></Card>;

  return (
    <>
      <Card title="پراسس‌های زنده" desc="وضعیت سرویس‌های در حال اجرا">
        {(stats.processes || []).map((p: any, i: number) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_100px_100px_120px] items-center gap-4 px-4 py-3 bg-bg-3 border border-line rounded-xl mb-2">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-violet shrink-0" />
              <div>
                <div className="font-semibold text-[13px]">{p.name}</div>
                <div className="font-mono text-[10.5px] text-ink-3 mt-0.5">CPU: {p.cpu}% · RAM: {p.ram}</div>
              </div>
            </div>
            <ProcessStat label="پردازش" value={toFa(p.processed)} />
            <ProcessStat label="صف" value={toFa(p.queue)} />
            <StatusPill ok={p.status === 'running'} label={p.status === 'running' ? 'RUNNING' : 'STOPPED'} />
          </div>
        ))}
      </Card>

      <Card title="منابع سیستم" desc="استفاده از RAM، CPU و دیتابیس">
        <Row label="حافظه" desc="استفاده از RAM">
          <span className="font-mono text-[12px]">{stats.memory?.used || '—'} / {stats.memory?.total || '—'}</span>
        </Row>
        <Row label="CPU" desc={`${toFa(stats.cpu?.cores || 0)} هسته`}>
          <span className="font-mono text-[12px]">{stats.cpu?.usage || 0}%</span>
        </Row>
        <Row label="دیتابیس" desc="کل خبرها در Postgres">
          <span className="font-mono text-[12px]">{toFa(stats.db?.articles || 0)} مقاله</span>
        </Row>
        <Row label="Ollama" desc={stats.ollama?.model || '—'}>
          <StatusPill ok={stats.ollama?.up} label={stats.ollama?.up ? 'UP' : 'DOWN'} />
        </Row>
      </Card>
    </>
  );
}

function ProcessStat({ label, value }: any) {
  return (
    <div className="font-mono text-[12px] text-ink-2">
      <div className="text-[9.5px] text-ink-3 tracking-[0.14em] uppercase mb-0.5">{label}</div>
      {value}
    </div>
  );
}

// ───── Logs ─────
function LogsSection() {
  const { data: logs } = useSWR<any>(`${API}/monitoring/logs`, fetcher, { refreshInterval: 3000 });
  const lines: any[] = Array.isArray(logs?.lines) ? logs.lines : [];

  return (
    <Card title="لاگ زنده" desc="آخرین فعالیت‌ها (به‌روزرسانی هر 3 ثانیه)">
      <div className="bg-[#04050a] border border-line rounded-xl p-4 font-mono text-[11px] leading-relaxed text-ink-2 max-h-[480px] overflow-y-auto">
        {lines.length === 0 ? (
          <div className="text-ink-3 text-center py-4">هنوز لاگی ثبت نشده</div>
        ) : (
          lines.map((l: any, i: number) => (
            <div key={i} className="grid grid-cols-[64px_60px_1fr] gap-2 py-0.5">
              <span className="text-ink-3">{l.time}</span>
              <span className={`font-bold ${
                l.level === 'INFO' ? 'text-cyan' :
                l.level === 'WARN' ? 'text-warn' :
                l.level === 'ERROR' ? 'text-alert' :
                l.level === 'LLM' ? 'text-violet' :
                'text-ink-3'
              }`}>
                {l.level}
              </span>
              <span>{l.msg}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
