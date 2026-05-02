"""Sources API - list + toggle."""
from fastapi import APIRouter, Body, HTTPException
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models.source import Source

router = APIRouter(tags=["sources"])


@router.post("/sources/{source_id}/toggle")
async def toggle_source(source_id: int, payload: dict = Body(...)):
    enabled = bool(payload.get("enabled", True))
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Source).where(Source.id == source_id))
        source = result.scalar_one_or_none()
        if not source:
            raise HTTPException(404, "source not found")
        source.enabled = enabled
        await db.commit()
        return {"id": source_id, "enabled": enabled}
