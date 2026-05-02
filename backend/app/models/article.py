"""Article model - aggregated news items."""
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, Float, JSON, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base


class Article(Base):
    __tablename__ = "articles"
    __table_args__ = (UniqueConstraint("source_id", "url", name="uq_source_url"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), index=True)

    url: Mapped[str] = mapped_column(String(1000))
    url_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title_original: Mapped[str] = mapped_column(Text)
    title_fa: Mapped[str | None] = mapped_column(Text, nullable=True)
    title_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_fa: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_original: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="en")
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    published_at: Mapped[datetime | None] = mapped_column(DateTime, index=True, nullable=True)
    crawled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # AI enrichment
    sentiment: Mapped[float | None] = mapped_column(Float, nullable=True)  # negative one to one
    category: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    bias_detected: Mapped[str | None] = mapped_column(String(40), nullable=True)
    entities: Mapped[list | None] = mapped_column(JSON, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)

    is_breaking: Mapped[bool] = mapped_column(Boolean, default=False)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    edit_count: Mapped[int] = mapped_column(Integer, default=0)
    cross_refs: Mapped[int] = mapped_column(Integer, default=0)

    source = relationship("Source", lazy="joined")
