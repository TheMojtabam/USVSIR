"""Ollama LLM with parallel instance pool support."""
import asyncio
import json
from typing import Any
import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings as cfg


class OllamaPool:
    """Pool of N parallel Ollama instances. Ollama itself handles concurrency,
    we just multiply the semaphore to allow N concurrent requests."""

    def __init__(self):
        self.base_url = cfg.OLLAMA_URL
        self.model = cfg.OLLAMA_MODEL
        self.client = httpx.AsyncClient(timeout=180.0)
        self._sem: asyncio.Semaphore | None = None
        self._sem_size = 1

    def configure(self, instances: int, model: str | None = None):
        if model:
            self.model = model
        if instances != self._sem_size:
            self._sem = asyncio.Semaphore(max(1, instances))
            self._sem_size = instances
            logger.info(f"LLM pool resized to {instances}, model={self.model}")

    @property
    def sem(self):
        if self._sem is None:
            self._sem = asyncio.Semaphore(1)
        return self._sem

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=8))
    async def _generate(self, prompt: str, system: str = "", json_mode: bool = False) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"temperature": 0.3, "top_p": 0.9, "num_ctx": 4096},
        }
        if json_mode:
            payload["format"] = "json"
        async with self.sem:
            r = await self.client.post(f"{self.base_url}/api/generate", json=payload)
            r.raise_for_status()
            return r.json().get("response", "").strip()

    async def translate(self, text: str, target: str) -> str:
        if not text:
            return ""
        if target == "fa":
            system = (
                "شما یک مترجم حرفه‌ای زبان فارسی هستید که در ترجمه اخبار سیاسی و ژئوپلیتیک تخصص دارید. "
                "متن داده شده را به فارسی روان و دقیق ترجمه کنید. اسامی خاص، اصطلاحات فنی و شخصیت‌ها را دقیق منتقل کنید. "
                "فقط متن ترجمه شده را خروجی دهید، بدون توضیح اضافی."
            )
        else:  # en
            system = (
                "You are a professional translator. Translate to natural English. "
                "Keep proper nouns and technical terms accurate. "
                "Output ONLY the translation."
            )
        try:
            return await self._generate(text[:3000], system=system)
        except Exception as e:
            logger.warning(f"translate fail: {e}")
            return ""

    async def summarize_persian(self, text: str) -> str:
        if not text:
            return ""
        system = (
            "شما یک خلاصه‌نویس حرفه‌ای اخبار هستید. متن خبر را بخوانید و یک خلاصه دقیق فارسی "
            "در ۲ تا ۳ جمله بنویسید (حداکثر ۴۰۰ کاراکتر). فقط خلاصه فارسی را خروجی دهید."
        )
        try:
            return await self._generate(text[:5000], system=system)
        except Exception:
            return ""

    async def analyze(self, title: str, body: str) -> dict[str, Any]:
        system = """You are an OSINT analyst. Analyze the news article and respond with JSON only:
{
  "sentiment": <float -1 to 1>,
  "category": "military"|"diplomatic"|"economic"|"cyber"|"social",
  "bias_detected": "pro-iran"|"pro-us"|"neutral",
  "entities": [{"name": str, "type": "person"|"org"|"location"}],
  "tags": [str],
  "is_breaking": <bool>
}
Output ONLY valid JSON, no markdown, no explanation."""
        prompt = f"TITLE: {title}\n\nBODY: {body[:3000]}"
        try:
            raw = await self._generate(prompt, system=system, json_mode=True)
            return json.loads(raw)
        except Exception as e:
            logger.warning(f"analyze fail: {e}")
            return {
                "sentiment": 0.0, "category": "social", "bias_detected": "neutral",
                "entities": [], "tags": [], "is_breaking": False,
            }

    async def calculate_tension(self, titles: list[str]) -> float:
        if not titles:
            return 0.0
        system = (
            "Assess geopolitical tension between Iran and the US on a scale of 0-100. "
            "0 = peaceful relations, 100 = open war. Reply with ONLY a number."
        )
        prompt = "Recent headlines:\n" + "\n".join(f"- {t}" for t in titles[:50])
        try:
            raw = await self._generate(prompt, system=system)
            score = float("".join(c for c in raw if c.isdigit() or c == "."))
            return max(0.0, min(100.0, score))
        except Exception:
            return 50.0

    async def daily_brief(self, titles: list[str]) -> str:
        system = (
            "شما یک تحلیل‌گر ارشد اطلاعات هستید. یک گزارش روایی فارسی در ۳ تا ۴ جمله بنویسید "
            "که مهم‌ترین تحولات امروز را خلاصه کند. لحن حرفه‌ای و گزارشی داشته باشید."
        )
        prompt = "Today's headlines:\n" + "\n".join(f"- {t}" for t in titles[:60])
        try:
            return await self._generate(prompt, system=system)
        except Exception:
            return ""

    async def chat_rag(self, question: str, context_articles: list[dict]) -> str:
        ctx_text = "\n\n".join([
            f"[{i+1}] منبع: {a.get('source', '')} | تاریخ: {a.get('time', '')}\n"
            f"تیتر: {a.get('title', '')}\n"
            f"خلاصه: {a.get('summary', '')[:500]}"
            for i, a in enumerate(context_articles)
        ])
        system = (
            "شما یک تحلیلگر اطلاعاتی هستید که فقط بر اساس اخبار داده شده پاسخ می‌دهید. "
            "اگر پاسخ در منابع موجود نیست، صادقانه اعلام کنید. هرگز اطلاعات اضافه از خود نگویید. "
            "پاسخ را به فارسی و در حداکثر ۵ جمله بدهید."
        )
        prompt = f"اخبار موجود:\n\n{ctx_text}\n\nسوال: {question}"
        try:
            return await self._generate(prompt, system=system)
        except Exception as e:
            logger.warning(f"chat fail: {e}")
            return "خطا در تولید پاسخ."


ollama = OllamaPool()
