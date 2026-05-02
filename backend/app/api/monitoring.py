"""Monitoring API: process status, system stats, logs."""
import os
import shutil
from datetime import datetime, timedelta
from fastapi import APIRouter
from sqlalchemy import select, func
import httpx
from app.core.db import AsyncSessionLocal
from app.models.article import Article
from app.services.settings_store import get_settings, LOG_BUFFER

router = APIRouter(tags=["monitoring"])


def get_memory():
    """Return memory in human format."""
    try:
        with open("/proc/meminfo") as f:
            lines = f.read().split("\n")
        mem_total = int(lines[0].split()[1]) * 1024
        mem_avail = int(lines[2].split()[1]) * 1024
        used = mem_total - mem_avail
        return {
            "total": f"{mem_total / 1024**3:.1f}GB",
            "used":  f"{used / 1024**3:.1f}GB",
            "pct":   round(used / mem_total * 100, 1),
        }
    except Exception:
        return {"total": "—", "used": "—", "pct": 0}


def get_cpu():
    try:
        cores = os.cpu_count() or 1
        with open("/proc/loadavg") as f:
            load = float(f.read().split()[0])
        usage = round(min(100, load / cores * 100), 1)
        return {"cores": cores, "usage": usage}
    except Exception:
        return {"cores": 0, "usage": 0}


async def check_ollama():
    settings = await get_settings()
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            r = await c.get("http://localhost:11434/api/tags")
            return r.status_code == 200, settings.get("ollama_model", "—")
    except Exception:
        return False, settings.get("ollama_model", "—")


@router.get("/monitoring")
async def monitoring():
    settings = await get_settings()
    instances = int(settings.get("llm_instances", 1))

    # processed counts
    async with AsyncSessionLocal() as db:
        cutoff = datetime.utcnow() - timedelta(hours=24)
        processed_24h = await db.scalar(
            select(func.count(Article.id))
            .where(Article.is_processed == True)  # noqa
            .where(Article.crawled_at >= cutoff)
        ) or 0
        queue = await db.scalar(
            select(func.count(Article.id)).where(Article.is_processed == False)  # noqa
        ) or 0
        total = await db.scalar(select(func.count(Article.id))) or 0

    ollama_up, model = await check_ollama()
    mem = get_memory()
    cpu = get_cpu()

    # synthesize per-instance stats (Ollama doesn't expose per-request, so we estimate)
    per_instance_processed = processed_24h // max(1, instances)
    per_instance_queue = queue // max(1, instances)

    processes = [
        {
            "name": "RSS Crawler",
            "cpu": min(15, cpu["usage"] // 4),
            "ram": "120MB",
            "processed": total,
            "queue": 0,
            "status": "running",
        }
    ]
    for i in range(instances):
        processes.append({
            "name": f"Qwen 2.5 #{i+1}",
            "cpu": cpu["usage"] // instances if ollama_up else 0,
            "ram": "9.0GB" if ollama_up else "0",
            "processed": per_instance_processed,
            "queue": per_instance_queue if i == 0 else 0,
            "status": "running" if ollama_up else "stopped",
        })

    return {
        "memory": mem,
        "cpu": cpu,
        "db": {"articles": total},
        "ollama": {"up": ollama_up, "model": model},
        "processes": processes,
    }


@router.get("/monitoring/logs")
async def logs():
    return {"lines": list(LOG_BUFFER)[-80:][::-1]}
