"""Seed default news sources."""
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models.source import Source


DEFAULT_SOURCES = [
    # Western
    {"name": "Reuters", "slug": "reuters", "url": "https://www.reuters.com",
     "rss_url": "https://feeds.reuters.com/reuters/topNews",
     "language": "en", "region": "western", "bias": "neutral", "bias_score": 50, "color": "#ff8000"},
    {"name": "BBC", "slug": "bbc", "url": "https://www.bbc.com",
     "rss_url": "https://feeds.bbci.co.uk/news/world/rss.xml",
     "language": "en", "region": "western", "bias": "neutral", "bias_score": 52, "color": "#bb1919"},
    {"name": "CNN", "slug": "cnn", "url": "https://www.cnn.com",
     "rss_url": "http://rss.cnn.com/rss/edition_world.rss",
     "language": "en", "region": "western", "bias": "neutral", "bias_score": 55, "color": "#cc0000"},
    {"name": "Associated Press", "slug": "ap", "url": "https://apnews.com",
     "rss_url": "https://feeds.apnews.com/rss/apf-topnews",
     "language": "en", "region": "western", "bias": "neutral", "bias_score": 50, "color": "#000000"},
    {"name": "The Guardian", "slug": "guardian", "url": "https://www.theguardian.com",
     "rss_url": "https://www.theguardian.com/world/rss",
     "language": "en", "region": "western", "bias": "neutral", "bias_score": 48, "color": "#052962"},
    # Iranian
    {"name": "IRNA", "slug": "irna", "url": "https://en.irna.ir",
     "rss_url": "https://en.irna.ir/rss",
     "language": "en", "region": "iranian", "bias": "pro-iran", "bias_score": 78, "color": "#6ee7d4"},
    {"name": "Tasnim", "slug": "tasnim", "url": "https://www.tasnimnews.com",
     "rss_url": "https://www.tasnimnews.com/en/rss/feed/0/8/political",
     "language": "en", "region": "iranian", "bias": "pro-iran", "bias_score": 82, "color": "#5fc788"},
    {"name": "Press TV", "slug": "presstv", "url": "https://www.presstv.ir",
     "rss_url": "https://www.presstv.ir/rss.xml",
     "language": "en", "region": "iranian", "bias": "pro-iran", "bias_score": 80, "color": "#a4f3e2"},
    # Russian / Chinese
    {"name": "TASS", "slug": "tass", "url": "https://tass.com",
     "rss_url": "https://tass.com/rss/v2.xml",
     "language": "en", "region": "russian-chinese", "bias": "pro-iran", "bias_score": 65, "color": "#003580"},
    {"name": "RT", "slug": "rt", "url": "https://www.rt.com",
     "rss_url": "https://www.rt.com/rss/news/",
     "language": "en", "region": "russian-chinese", "bias": "pro-iran", "bias_score": 68, "color": "#7aa8ff"},
    # Arab
    {"name": "Al Jazeera", "slug": "aljazeera", "url": "https://www.aljazeera.com",
     "rss_url": "https://www.aljazeera.com/xml/rss/all.xml",
     "language": "en", "region": "arab", "bias": "neutral", "bias_score": 55, "color": "#f5a623"},
    {"name": "Al Arabiya", "slug": "alarabiya", "url": "https://english.alarabiya.net",
     "rss_url": "https://english.alarabiya.net/.mrss/en.xml",
     "language": "en", "region": "arab", "bias": "neutral", "bias_score": 60, "color": "#d4b87a"},
    # Israeli
    {"name": "Times of Israel", "slug": "times-of-israel", "url": "https://www.timesofisrael.com",
     "rss_url": "https://www.timesofisrael.com/feed/",
     "language": "en", "region": "israeli", "bias": "pro-us", "bias_score": 75, "color": "#9b97e8"},
    {"name": "Haaretz", "slug": "haaretz", "url": "https://www.haaretz.com",
     "rss_url": "https://www.haaretz.com/cmlink/1.628752",
     "language": "en", "region": "israeli", "bias": "pro-us", "bias_score": 65, "color": "#4a4a4a"},
    # Think tanks
    {"name": "Atlantic Council", "slug": "atlanticcouncil", "url": "https://www.atlanticcouncil.org",
     "rss_url": "https://www.atlanticcouncil.org/feed/",
     "language": "en", "region": "thinktank", "bias": "pro-us", "bias_score": 70, "color": "#888888"},
    {"name": "ISW", "slug": "isw", "url": "https://www.understandingwar.org",
     "rss_url": "https://www.understandingwar.org/rss.xml",
     "language": "en", "region": "thinktank", "bias": "pro-us", "bias_score": 72, "color": "#666666"},
]


async def seed_sources():
    """Seed sources, update mutable fields (language, bias, color) on existing rows."""
    async with AsyncSessionLocal() as db:
        for s in DEFAULT_SOURCES:
            existing = await db.execute(select(Source).where(Source.slug == s["slug"]))
            row = existing.scalar_one_or_none()
            if row:
                # update fields that may have been corrected
                row.language = s["language"]
                row.bias = s["bias"]
                row.bias_score = s["bias_score"]
                row.color = s["color"]
                row.region = s["region"]
                row.rss_url = s["rss_url"]
            else:
                db.add(Source(**s))
        await db.commit()
