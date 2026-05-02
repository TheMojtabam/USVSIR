"""Settings API."""
from fastapi import APIRouter, Body
from app.services.settings_store import get_settings, update_settings

router = APIRouter(tags=["settings"])


@router.get("/settings")
async def read_settings():
    return await get_settings()


@router.patch("/settings")
async def patch_settings(updates: dict = Body(...)):
    return await update_settings(updates)
