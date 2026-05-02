"""RSS-based crawler for news sources."""
import hashlib
from datetime import datetime
import feedparser
import httpx
import trafilatura
from langdetect import detect, LangDetectException
from loguru import logger
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.core.config import settings
from app.models.source import Source
from app.models.article import Article


HEADERS = {"User-Agent": settings.USER_AGENT}


async def fetch_full_text(url: str) -> str:
    """Try to extract full article body."""
    try:
        async with httpx.AsyncClient(timeout=20, headers=HEADERS, follow_redirects=True) as c:
            r = await c.get(url)
            if r.status_code == 200:
                extracted = trafilatura.extract(r.text, include_comments=False)
                return extracted or ""
    except Exception as e:
        logger.debug(f"fetch_full_text failed for {url}: {e}")
    return ""


def detect_lang(text: str) -> str:
    try:
        return detect(text)
    except LangDetectException:
        return "en"


def url_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:32]


async def crawl_rss_source(source: Source, limit: int = 30) -> int:
    """Crawl an RSS source. Returns number of new articles."""
    if not source.rss_url:
        return 0
    new_count = 0
    try:
        async with httpx.AsyncClient(timeout=30, headers=HEADERS) as c:
            r = await c.get(source.rss_url)
            feed = feedparser.parse(r.text)
    except Exception as e:
        logger.error(f"RSS error for {source.name}: {e}")
        return 0

    async with AsyncSessionLocal() as db:
        for entry in feed.entries[:limit]:
            url = entry.get("link", "")
            if not url:
                continue
            h = url_hash(url)
            existing = await db.execute(select(Article).where(Article.url_hash == h))
            if existing.scalar_one_or_none():
                continue

            title = entry.get("title", "").strip()
            if not _is_relevant(title, entry.get("summary", "")):
                continue

            published = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    published = datetime(*entry.published_parsed[:6])
                except Exception:
                    pass

            full_body = await fetch_full_text(url)
            body = full_body or entry.get("summary", "")
            lang = detect_lang(title + " " + body[:500]) if body else source.language

            article = Article(
                source_id=source.id,
                url=url,
                url_hash=h,
                title_original=title,
                body_original=body[:8000],
                language=lang,
                published_at=published,
                image_url=_extract_image(entry),
            )
            db.add(article)
            new_count += 1

        source.last_crawled = datetime.utcnow()
        await db.merge(source)
        await db.commit()

    if new_count:
        logger.info(f"[{source.name}] +{new_count} new articles")
    return new_count


def _extract_image(entry) -> str | None:
    if hasattr(entry, "media_content") and entry.media_content:
        return entry.media_content[0].get("url")
    if hasattr(entry, "links"):
        for link in entry.links:
            if link.get("type", "").startswith("image"):
                return link.get("href")
    return None


KEYWORDS = [
    # English
    "iran", "iranian", "tehran", "khamenei", "irgc", "revolutionary guard",
    "us-iran", "iran-us", "persian gulf", "hormuz", "nuclear deal", "jcpoa",
    "sanctions", "trump iran", "biden iran", "pentagon iran", "israel iran",
    # Persian
    "ایران", "آمریکا", "تهران", "واشنگتن", "خامنه‌ای", "سپاه", "تحریم",
    "هرمز", "خلیج فارس", "هسته‌ای", "برجام", "ترامپ", "بایدن",
    # Arabic
    "إيران", "أمريكا", "طهران", "واشنطن",
]


def _is_relevant(*texts: str) -> bool:
    blob = " ".join(texts).lower()
    return any(kw in blob for kw in KEYWORDS)
