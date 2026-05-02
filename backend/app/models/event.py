"""Event model - timeline & OSINT signals."""
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(40), index=True)  # military, diplomatic, economic, cyber
    severity: Mapped[str] = mapped_column(String(20), default="minor")  # critical, major, minor
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    lat: Mapped[float | None] = mapped_column(nullable=True)
    lon: Mapped[float | None] = mapped_column(nullable=True)
    source_count: Mapped[int] = mapped_column(Integer, default=1)
    article_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TensionScore(Base):
    __tablename__ = "tension_scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True, default=datetime.utcnow)
    score: Mapped[float] = mapped_column()  # zero hundred
    components: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # breakdown
    article_volume: Mapped[int] = mapped_column(Integer, default=0)
