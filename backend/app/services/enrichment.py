"""Enrich articles with LLM analysis - parallel processing."""
import asyncio
from datetime import datetime
from loguru import logger
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models.article import Article
from app.models.event import TensionScore
from app.services.llm import ollama
from app.services.settings_store import get_settings, add_log


async def enrich_article(article_id: int, settings: dict) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Article).where(Article.id == article_id))
        article = result.scalar_one_or_none()
        if not article or article.is_processed:
            return

        # Persian translation
        if settings.get("translate_fa", True):
            if article.language != "fa" and not article.title_fa:
                article.title_fa = await ollama.translate(article.title_original, "fa")
            elif article.language == "fa":
                article.title_fa = article.title_original

        # English translation (always)
        if settings.get("translate_en", False):
            if article.language != "en" and not article.title_en:
                article.title_en = await ollama.translate(article.title_original, "en")
            elif article.language == "en":
                article.title_en = article.title_original

        # default English fallback
        if article.language == "en" and not article.title_en:
            article.title_en = article.title_original

        # Persian summary
        if settings.get("translate_fa", True) and article.body_original and not article.summary_fa:
            article.summary_fa = await ollama.summarize_persian(article.body_original)

        # Analysis (sentiment + category + bias + NER)
        if (settings.get("auto_categorize", True) or settings.get("detect_bias", True)
                or settings.get("extract_entities", True) or settings.get("sentiment", True)):
            try:
                analysis = await ollama.analyze(article.title_original, article.body_original or "")
                if settings.get("sentiment", True):
                    article.sentiment = float(analysis.get("sentiment", 0))
                if settings.get("auto_categorize", True):
                    article.category = analysis.get("category", "social")
                if settings.get("detect_bias", True):
                    article.bias_detected = analysis.get("bias_detected", "neutral")
                if settings.get("extract_entities", True):
                    article.entities = analysis.get("entities", [])
                article.tags = analysis.get("tags", [])
                article.is_breaking = bool(analysis.get("is_breaking", False))
            except Exception as e:
                logger.warning(f"analysis fail {article_id}: {e}")

        article.is_processed = True
        await db.commit()
        add_log("LLM", f"enriched article #{article_id}: {article.title_original[:60]}...")


async def enrich_pending(batch_size: int | None = None) -> int:
    """Process unprocessed articles in parallel."""
    settings = await get_settings()
    instances = max(1, int(settings.get("llm_instances", 1)))
    batch = batch_size or int(settings.get("enrich_batch", 8))

    # configure pool
    ollama.configure(instances, model=settings.get("ollama_model"))

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Article).where(Article.is_processed == False).limit(batch)  # noqa
        )
        articles = result.scalars().all()

    if not articles:
        return 0

    # process in parallel up to `instances`
    sem = asyncio.Semaphore(instances)

    async def one(art_id: int):
        async with sem:
            try:
                await enrich_article(art_id, settings)
            except Exception as e:
                logger.error(f"enrich error {art_id}: {e}")

    await asyncio.gather(*[one(a.id) for a in articles])
    return len(articles)


async def update_tension_score() -> float:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Article)
            .where(Article.is_processed == True)  # noqa
            .order_by(Article.crawled_at.desc())
            .limit(60)
        )
        articles = result.scalars().all()
        titles = [a.title_original for a in articles]

        score = await ollama.calculate_tension(titles)
        ts = TensionScore(timestamp=datetime.utcnow(), score=score, article_volume=len(titles))
        db.add(ts)
        await db.commit()

    add_log("OK", f"tension score = {score}")
    return score
