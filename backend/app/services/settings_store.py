"""Settings store - persistent key/value config + in-memory log buffer."""
from collections import deque
from datetime import datetime
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models.setting import Setting


DEFAULTS = {
    "llm_instances":      1,
    "ollama_model":       "qwen2.5:14b",
    "enrich_batch":       8,
    "crawl_interval":     5,
    "crawl_depth":        30,
    "deep_backfill":      True,
    "translate_fa":       True,
    "translate_en":       False,
    "auto_categorize":    True,
    "detect_bias":        True,
    "extract_entities":   True,
    "sentiment":          True,
}


# in-memory log buffer (last 200 lines)
LOG_BUFFER: deque = deque(maxlen=200)


def add_log(level: str, msg: str):
    LOG_BUFFER.append({
        "time": datetime.utcnow().strftime("%H:%M:%S"),
        "level": level,
        "msg": msg,
    })


async def get_settings() -> dict:
    out = dict(DEFAULTS)
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Setting))
        for s in result.scalars().all():
            out[s.key] = s.value
    return out


async def update_settings(updates: dict) -> dict:
    async with AsyncSessionLocal() as db:
        for key, value in updates.items():
            if key not in DEFAULTS:
                continue  # unknown key - ignore
            existing = await db.execute(select(Setting).where(Setting.key == key))
            row = existing.scalar_one_or_none()
            if row:
                row.value = value
            else:
                db.add(Setting(key=key, value=value))
        await db.commit()
    return await get_settings()


async def get_setting(key: str, default=None):
    if key not in DEFAULTS and default is None:
        return None
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(Setting).where(Setting.key == key))
        row = existing.scalar_one_or_none()
        if row is not None:
            return row.value
    return DEFAULTS.get(key, default)
