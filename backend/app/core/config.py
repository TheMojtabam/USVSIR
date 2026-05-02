"""Application configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://observatory:observatory@localhost/observatory"
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:14b"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # one week

    # App
    PROJECT_NAME: str = "Observatory"
    API_V1_PREFIX: str = "/api/v1"
    PUBLIC_IP: str = "127.0.0.1"
    ENVIRONMENT: str = "development"

    # Crawler
    CRAWL_INTERVAL_SECONDS: int = 300  # five minutes
    USER_AGENT: str = "ObservatoryBot/1.0 (OSINT Research)"
    MAX_CONCURRENT_REQUESTS: int = 10

    # CORS
    CORS_ORIGINS: list[str] = ["*"]


settings = Settings()
