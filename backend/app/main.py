"""FastAPI application entry."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from app.core.config import settings as cfg
from app.core.db import init_db
from app.api import articles, dashboard, settings as settings_api, monitoring, chat, analytics, sources
from app.services.seed import seed_sources


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_sources()
    logger.info(f"{cfg.PROJECT_NAME} started")
    yield


app = FastAPI(title=cfg.PROJECT_NAME, lifespan=lifespan, docs_url="/docs")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# all under /v1 — nginx rewrites /api/* → /v1/*
for r in [articles.router, dashboard.router, settings_api.router,
          monitoring.router, chat.router, analytics.router, sources.router]:
    app.include_router(r, prefix="/v1")


@app.get("/")
async def root():
    return {"service": cfg.PROJECT_NAME, "version": "1.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
