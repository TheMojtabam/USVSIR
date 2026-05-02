"""Background scheduler with dynamic settings."""
import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger
from sqlalchemy import select, func
from app.core.db import AsyncSessionLocal, init_db
from app.models.source import Source
from app.models.article import Article
from app.crawlers.rss_crawler import crawl_rss_source
from app.services.enrichment import enrich_pending, update_tension_score
from app.services.seed import seed_sources
from app.services.settings_store import get_settings, add_log
from app.api.dashboard import regenerate_brief


async def run_crawlers():
    settings = await get_settings()
    depth = int(settings.get("crawl_depth", 30))

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Source).where(Source.enabled == True))  # noqa
        sources = result.scalars().all()

    add_log("INFO", f"crawling {len(sources)} sources (depth={depth})...")
    sem = asyncio.Semaphore(8)

    async def crawl_one(s: Source):
        async with sem:
            try:
                n = await crawl_rss_source(s, limit=depth)
                if n:
                    add_log("INFO", f"[{s.name}] +{n} new articles")
            except Exception as e:
                add_log("WARN", f"[{s.name}] {str(e)[:80]}")

    await asyncio.gather(*[crawl_one(s) for s in sources])


async def run_enrichment():
    async with AsyncSessionLocal() as db:
        backlog = await db.scalar(
            select(func.count(Article.id)).where(Article.is_processed == False)  # noqa
        ) or 0

    if backlog == 0:
        return

    settings = await get_settings()
    batch = int(settings.get("enrich_batch", 8))
    if backlog < batch // 2:
        batch = backlog

    processed = await enrich_pending(batch_size=batch)
    if processed:
        add_log("INFO", f"enriched {processed} articles (backlog: {backlog})")


async def run_tension():
    try:
        await update_tension_score()
    except Exception as e:
        add_log("WARN", f"tension calc failed: {e}")


async def run_brief():
    try:
        await regenerate_brief()
        add_log("OK", "daily brief regenerated")
    except Exception as e:
        add_log("WARN", f"brief gen failed: {e}")


async def deep_crawl_loop():
    """Backfill historical articles when system is idle."""
    while True:
        await asyncio.sleep(900)  # every 15 min
        try:
            settings = await get_settings()
            if not settings.get("deep_backfill", True):
                continue

            async with AsyncSessionLocal() as db:
                backlog = await db.scalar(
                    select(func.count(Article.id)).where(Article.is_processed == False)  # noqa
                ) or 0

            if backlog and backlog > 5:
                continue  # busy

            add_log("INFO", "deep-crawl: backfilling historical articles")
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Source).where(Source.enabled == True))  # noqa
                sources = result.scalars().all()

            sem = asyncio.Semaphore(3)

            async def deep_one(s):
                async with sem:
                    try:
                        await crawl_rss_source(s, limit=80)
                    except Exception as e:
                        add_log("WARN", f"deep-crawl {s.name}: {str(e)[:60]}")

            await asyncio.gather(*[deep_one(s) for s in sources])
        except Exception as e:
            logger.error(f"deep_crawl_loop: {e}")


async def reschedule_loop(scheduler: AsyncIOScheduler):
    """Re-read settings every minute and update job intervals if changed."""
    last_interval = None
    while True:
        try:
            settings = await get_settings()
            interval = int(settings.get("crawl_interval", 5))
            if interval != last_interval:
                scheduler.reschedule_job("crawl", trigger="interval", minutes=interval)
                add_log("OK", f"crawl interval set to {interval} min")
                last_interval = interval
        except Exception as e:
            logger.error(f"reschedule: {e}")
        await asyncio.sleep(60)


async def main():
    await init_db()
    await seed_sources()

    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_crawlers,   "interval", minutes=5,  max_instances=1, id="crawl")
    scheduler.add_job(run_enrichment, "interval", seconds=20, max_instances=1, id="enrich")
    scheduler.add_job(run_tension,    "interval", minutes=10, max_instances=1, id="tension")
    scheduler.add_job(run_brief,      "interval", minutes=30, max_instances=1, id="brief")
    scheduler.start()

    add_log("OK", "scheduler started")

    # initial run
    asyncio.create_task(run_crawlers())
    asyncio.create_task(run_enrichment())

    # background loops
    asyncio.create_task(deep_crawl_loop())
    asyncio.create_task(reschedule_loop(scheduler))

    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
