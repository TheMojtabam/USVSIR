"""Source model - news outlets being crawled."""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    url: Mapped[str] = mapped_column(String(500))
    rss_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="en")
    region: Mapped[str] = mapped_column(String(40))  # western, iranian, russian, arab, israeli, thinktank
    bias: Mapped[str] = mapped_column(String(40), default="neutral")  # pro-iran, pro-us, neutral
    bias_score: Mapped[int] = mapped_column(Integer, default=50)  # zero hundred
    color: Mapped[str] = mapped_column(String(16), default="#888888")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_crawled: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    crawl_interval: Mapped[int] = mapped_column(Integer, default=300)
    selectors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
