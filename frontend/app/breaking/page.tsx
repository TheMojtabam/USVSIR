import { Shell } from '@/components/dashboard/shell';
import { NewsFeed } from '@/components/news/news-feed';

export default function Page() {
  return (
    <Shell>
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.18em] text-violet uppercase font-medium mb-2">⚡ BREAKING NEWS</div>
        <h1 className="text-[28px] font-bold tracking-tight">اخبار <em className="font-serif italic font-normal gradient-text">فوری</em></h1>
        <p className="text-ink-2 mt-2 text-[14px]">اخبار با اهمیت بالا، تشخیص داده شده توسط AI</p>
      </div>
      <NewsFeed breakingOnly />
    </Shell>
  );
}
