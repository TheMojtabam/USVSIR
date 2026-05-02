"""Admin/system status API."""
from datetime import datetime, timedelta
import psutil
import os
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
from app.core.db import get_db
from app.models.article import Article
from app.models.source import Source
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/status")
async def system_status(db: AsyncSession = Depends(get_db)):
    """Live system status: CPU, RAM, DB, Ollama, crawlers."""
    # process stats
    try:
        cpu = psutil.cpu_percent(interval=0.5)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        ram = {"used_gb": round(mem.used / 1e9, 1), "total_gb": round(mem.total / 1e9, 1), "pct": mem.percent}
        cpu_count = psutil.cpu_count()
        disk_info = {"used_gb": round(disk.used / 1e9, 1), "total_gb": round(disk.total / 1e9, 1), "pct": disk.percent}
    except Exception:
        cpu, ram, cpu_count, disk_info = 0, {}, 0, {}

    # ollama check
    ollama_ok = False
    ollama_model_loaded = False
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            r = await c.get(f"{settings.OLLAMA_URL}/api/tags")
            if r.status_code == 200:
                ollama_ok = True
                models = [m["name"] for m in r.json().get("models", [])]
                ollama_model_loaded = settings.OLLAMA_MODEL in models or any(settings.OLLAMA_MODEL.split(":")[0] in m for m in models)
    except Exception:
        pass

    # DB stats
    total = await db.scalar(select(func.count(Article.id)))
    processed = await db.scalar(select(func.count(Article.id)).where(Article.is_processed == True))  # noqa
    backlog = (total or 0) - (processed or 0)
    last_hour = datetime.utcnow() - timedelta(hours=1)
    last_5min = datetime.utcnow() - timedelta(minutes=5)
    new_hour = await db.scalar(select(func.count(Article.id)).where(Article.crawled_at >= last_hour))
    new_5min = await db.scalar(select(func.count(Article.id)).where(Article.crawled_at >= last_5min))

    # source stats
    src_total = await db.scalar(select(func.count(Source.id)))
    src_active = await db.scalar(select(func.count(Source.id)).where(Source.enabled == True))  # noqa

    # recent activity
    last_article = await db.execute(select(Article).order_by(desc(Article.crawled_at)).limit(1))
    last = last_article.scalar_one_or_none()

    return {
        "cpu_pct": cpu,
        "cpu_count": cpu_count,
        "ram": ram,
        "disk": disk_info,
        "ollama": {
            "running": ollama_ok,
            "model": settings.OLLAMA_MODEL,
            "model_loaded": ollama_model_loaded,
            "url": settings.OLLAMA_URL,
        },
        "articles": {
            "total": total or 0,
            "processed": processed or 0,
            "backlog": backlog,
            "new_5min": new_5min or 0,
            "new_hour": new_hour or 0,
            "last_crawl": last.crawled_at.isoformat() if last else None,
        },
        "sources": {"total": src_total or 0, "active": src_active or 0},
    }


@router.get("/sources")
async def admin_sources(db: AsyncSession = Depends(get_db)):
    """All sources with last crawl time."""
    result = await db.execute(select(Source).order_by(Source.region, Source.name))
    return [
        {
            "id": s.id, "name": s.name, "slug": s.slug,
            "region": s.region, "language": s.language,
            "enabled": s.enabled, "rss_url": s.rss_url,
            "last_crawled": s.last_crawled.isoformat() if s.last_crawled else None,
            "color": s.color,
        }
        for s in result.scalars().all()
    ]


@router.post("/sources/{source_id}/toggle")
async def toggle_source(source_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Source).where(Source.id == source_id))
    s = result.scalar_one_or_none()
    if not s:
        return {"error": "not found"}
    s.enabled = not s.enabled
    await db.commit()
    return {"id": s.id, "enabled": s.enabled}
