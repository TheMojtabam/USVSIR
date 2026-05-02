"""News articles API."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.article import Article
from app.models.source import Source

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("/")
async def list_articles(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, le=100),
    offset: int = 0,
    category: str | None = None,
    bias: str | None = None,
    region: str | None = None,
    language: str | None = None,
    breaking: bool | None = None,
    hours: int = 24,
):
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    stmt = (
        select(Article)
        .where(Article.crawled_at >= cutoff)
        .order_by(desc(Article.crawled_at))
        .limit(limit)
        .offset(offset)
    )
    if category:
        stmt = stmt.where(Article.category == category)
    if breaking is True:
        stmt = stmt.where(Article.is_breaking == True)  # noqa
    if bias:
        stmt = stmt.where(Article.bias_detected == bias)
    if language:
        stmt = stmt.where(Article.language == language)
    if region:
        stmt = stmt.join(Source).where(Source.region == region)

    result = await db.execute(stmt)
    articles = result.scalars().unique().all()

    return [
        {
            "id": a.id,
            "title_fa": a.title_fa or a.title_original,
            "title_en": a.title_en or (a.title_original if a.language == "en" else ""),
            "title_original": a.title_original,
            "summary_fa": a.summary_fa,
            "url": a.url,
            "image_url": a.image_url,
            "language": a.language,
            "published_at": a.published_at.isoformat() if a.published_at else None,
            "crawled_at": a.crawled_at.isoformat(),
            "sentiment": a.sentiment,
            "category": a.category,
            "bias_detected": a.bias_detected,
            "entities": a.entities or [],
            "tags": a.tags or [],
            "is_breaking": a.is_breaking,
            "edit_count": a.edit_count,
            "cross_refs": a.cross_refs,
            "source": {
                "id": a.source.id, "name": a.source.name, "slug": a.source.slug,
                "region": a.source.region, "bias": a.source.bias,
                "bias_score": a.source.bias_score, "color": a.source.color,
            } if a.source else None,
        }
        for a in articles
    ]


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    one_hour = datetime.utcnow() - timedelta(hours=1)
    one_day = datetime.utcnow() - timedelta(days=1)

    new_hour = await db.scalar(select(func.count(Article.id)).where(Article.crawled_at >= one_hour))
    new_day = await db.scalar(select(func.count(Article.id)).where(Article.crawled_at >= one_day))
    total = await db.scalar(select(func.count(Article.id)))
    breaking = await db.scalar(
        select(func.count(Article.id)).where(
            and_(Article.is_breaking == True, Article.crawled_at >= one_day)  # noqa
        )
    )
    sources_active = await db.scalar(select(func.count(Source.id)).where(Source.enabled == True))  # noqa
    sources_total = await db.scalar(select(func.count(Source.id)))

    return {
        "new_hour": new_hour or 0, "new_day": new_day or 0,
        "total": total or 0, "breaking": breaking or 0,
        "sources_active": sources_active or 0, "sources_total": sources_total or 0,
    }


@router.get("/entities")
async def trending_entities(db: AsyncSession = Depends(get_db), hours: int = 24, limit: int = 10):
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    result = await db.execute(
        select(Article.entities).where(
            and_(Article.crawled_at >= cutoff, Article.entities.isnot(None))
        )
    )
    counter: dict[str, int] = {}
    for (ents,) in result.all():
        if not ents:
            continue
        for e in ents:
            name = e.get("name") if isinstance(e, dict) else str(e)
            if name:
                counter[name] = counter.get(name, 0) + 1
    top = sorted(counter.items(), key=lambda x: -x[1])[:limit]
    return [{"name": n, "count": c} for n, c in top]
