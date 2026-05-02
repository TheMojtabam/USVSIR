"""Chat (RAG) API."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Body
from sqlalchemy import select, desc, or_
from app.core.db import AsyncSessionLocal
from app.models.article import Article
from app.services.llm import ollama
from app.services.settings_store import add_log

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(payload: dict = Body(...)):
    question = (payload.get("message") or "").strip()
    if not question:
        return {"answer": "سوالی وارد نشد.", "citations": {"count": 0, "sources": 0}}

    add_log("INFO", f"chat query: {question[:60]}")

    # naive retrieval - fetch most recent + matches
    async with AsyncSessionLocal() as db:
        # try keyword match first
        keywords = [w for w in question.split() if len(w) > 2][:5]
        cutoff = datetime.utcnow() - timedelta(days=7)
        stmt = select(Article).where(Article.crawled_at >= cutoff)
        if keywords:
            conditions = [Article.title_original.ilike(f"%{k}%") for k in keywords]
            conditions += [Article.title_fa.ilike(f"%{k}%") for k in keywords]
            stmt = stmt.where(or_(*conditions))
        stmt = stmt.order_by(desc(Article.crawled_at)).limit(15)

        result = await db.execute(stmt)
        articles = result.scalars().unique().all()

        # if no keyword matches, fall back to recent
        if not articles:
            r2 = await db.execute(
                select(Article)
                .where(Article.is_processed == True)  # noqa
                .order_by(desc(Article.crawled_at))
                .limit(10)
            )
            articles = r2.scalars().unique().all()

    context = [{
        "source":  a.source.name if a.source else "?",
        "time":    (a.published_at or a.crawled_at).strftime("%Y-%m-%d %H:%M"),
        "title":   a.title_fa or a.title_original,
        "summary": a.summary_fa or a.body_original or "",
    } for a in articles]

    answer = await ollama.chat_rag(question, context)
    sources = len({a.source_id for a in articles})

    return {
        "answer": answer,
        "citations": {"count": len(articles), "sources": sources},
    }
