"""Sources, tension, events and AI brief APIs."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db, AsyncSessionLocal
from app.models.source import Source
from app.models.event import Event, TensionScore
from app.models.article import Article
from loguru import logger

router = APIRouter(tags=["other"])

# in-memory cache for the AI brief (regenerated on a schedule)
_BRIEF_CACHE: dict = {"text": "", "generated_at": None, "sources": 0, "articles": 0}


@router.get("/sources")
async def list_sources(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Source).order_by(Source.region, Source.name))
    return [
        {
            "id": s.id, "name": s.name, "slug": s.slug, "url": s.url,
            "region": s.region, "language": s.language, "bias": s.bias,
            "bias_detected": s.bias,
            "bias_score": s.bias_score, "color": s.color, "enabled": s.enabled,
            "last_crawled": s.last_crawled.isoformat() if s.last_crawled else None,
        }
        for s in result.scalars().all()
    ]


@router.get("/tension")
async def tension(db: AsyncSession = Depends(get_db), hours: int = 72):
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    result = await db.execute(
        select(TensionScore).where(TensionScore.timestamp >= cutoff).order_by(TensionScore.timestamp)
    )
    points = [{"t": p.timestamp.isoformat(), "score": p.score, "vol": p.article_volume}
              for p in result.scalars().all()]
    latest = await db.execute(select(TensionScore).order_by(desc(TensionScore.timestamp)).limit(1))
    cur = latest.scalar_one_or_none()
    return {
        "current": cur.score if cur else 0,
        "current_at": cur.timestamp.isoformat() if cur else None,
        "history": points,
    }


@router.get("/timeline")
async def timeline(db: AsyncSession = Depends(get_db), hours: int = 24):
    """Critical events, derived from breaking articles if no Event records."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)

    # try Event records first
    result = await db.execute(
        select(Event).where(Event.occurred_at >= cutoff).order_by(desc(Event.occurred_at))
    )
    events = result.scalars().all()
    if events:
        return [
            {
                "id": e.id, "occurred_at": e.occurred_at.isoformat(),
                "title": e.title, "description": e.description,
                "category": e.category, "severity": e.severity,
                "source_count": e.source_count, "verified": e.verified,
            }
            for e in events
        ]

    # fallback: synthesize from breaking + high-impact articles
    art_result = await db.execute(
        select(Article)
        .where(Article.crawled_at >= cutoff)
        .where(Article.is_processed == True)  # noqa
        .order_by(desc(Article.crawled_at))
        .limit(50)
    )
    articles = art_result.scalars().unique().all()

    out = []
    for a in articles[:15]:
        sev = "critical" if a.is_breaking else ("major" if (a.sentiment or 0) < -0.5 else "minor")
        out.append({
            "id": f"art-{a.id}",
            "occurred_at": (a.published_at or a.crawled_at).isoformat(),
            "title": a.title_fa or a.title_original,
            "description": a.summary_fa or "",
            "category": a.category or "social",
            "severity": sev,
            "source_count": 1,
            "verified": False,
        })
    return out


@router.get("/brief")
async def brief():
    """Latest AI-generated daily brief from cache."""
    return {
        "text": _BRIEF_CACHE.get("text", ""),
        "generated_at": _BRIEF_CACHE.get("generated_at"),
        "sources": _BRIEF_CACHE.get("sources", 0),
        "articles": _BRIEF_CACHE.get("articles", 0),
    }


async def regenerate_brief():
    """Called by the scheduler. Regenerates the daily brief."""
    from app.services.llm import ollama
    async with AsyncSessionLocal() as db:
        cutoff = datetime.utcnow() - timedelta(hours=24)
        result = await db.execute(
            select(Article)
            .where(Article.is_processed == True)  # noqa
            .where(Article.crawled_at >= cutoff)
            .order_by(desc(Article.crawled_at))
            .limit(60)
        )
        articles = result.scalars().unique().all()
        if not articles:
            return
        titles = [a.title_fa or a.title_original for a in articles]
        sources = len({a.source_id for a in articles})

        try:
            text = await ollama.daily_brief(titles)
        except Exception as e:
            logger.warning(f"brief gen failed: {e}")
            return

        _BRIEF_CACHE.update({
            "text": text,
            "generated_at": datetime.utcnow().isoformat(),
            "sources": sources,
            "articles": len(articles),
        })
    logger.info("daily brief regenerated")
