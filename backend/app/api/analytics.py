"""Analytics API - distributions, stats."""
from datetime import datetime, timedelta
from fastapi import APIRouter
from sqlalchemy import select, func
from app.core.db import AsyncSessionLocal
from app.models.article import Article
from app.models.source import Source

router = APIRouter(tags=["analytics"])


@router.get("/analytics/distribution")
async def distribution(hours: int = 168):
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    async with AsyncSessionLocal() as db:
        # by language
        lang_q = await db.execute(
            select(Article.language, func.count(Article.id))
            .where(Article.crawled_at >= cutoff)
            .group_by(Article.language)
            .order_by(func.count(Article.id).desc())
        )
        languages = [{"key": l or "unknown", "count": c} for l, c in lang_q.all() if l]

        # by category
        cat_q = await db.execute(
            select(Article.category, func.count(Article.id))
            .where(Article.crawled_at >= cutoff)
            .where(Article.category.isnot(None))
            .group_by(Article.category)
            .order_by(func.count(Article.id).desc())
        )
        categories = [{"key": c or "social", "count": cnt} for c, cnt in cat_q.all()]

        # by bias
        bias_q = await db.execute(
            select(Article.bias_detected, func.count(Article.id))
            .where(Article.crawled_at >= cutoff)
            .where(Article.bias_detected.isnot(None))
            .group_by(Article.bias_detected)
        )
        bias = [{"key": b or "neutral", "count": cnt} for b, cnt in bias_q.all()]

        # compass items
        sources_q = await db.execute(select(Source).where(Source.enabled == True))  # noqa
        sources = sources_q.scalars().all()
        compass = [{
            "name": s.name,
            "bias": s.bias,
            "bias_score": s.bias_score,
            "color": s.color,
        } for s in sources]

    return {
        "languages": languages,
        "categories": categories,
        "bias": bias,
        "compass": compass,
        "sources_count": len(compass),
    }
