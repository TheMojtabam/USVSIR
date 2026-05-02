import { Shell } from '@/components/dashboard/shell';
import { Hero } from '@/components/dashboard/hero';
import { StatTiles } from '@/components/dashboard/stat-tiles';
import { AIBrief } from '@/components/dashboard/brief-and-charts';
import { NewsFeed } from '@/components/news/news-feed';
import { NewsAside } from '@/components/dashboard/aside';

export default function Page() {
  return (
    <Shell>
      <Hero />
      <StatTiles />
      <AIBrief />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <NewsFeed />
        <NewsAside />
      </div>
    </Shell>
  );
}
