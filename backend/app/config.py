from __future__ import annotations

from typing import List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ──────────────────────────────────────────────────────────────
    postgres_host: str = "db"
    postgres_port: int = 5432
    postgres_db: str = "aurestate"
    postgres_user: str = "aurestate_user"
    postgres_password: str = "changeme_in_prod"
    database_url: str = (
        "postgresql+asyncpg://aurestate_user:changeme_in_prod@db:5432/aurestate"
    )

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://redis:6379/0"
    redis_cache_ttl: int = 3600

    # ── Sécurité / Auth ───────────────────────────────────────────────────────
    api_key_secret: str = "changeme_in_prod"
    jwt_secret: str = "changeme_in_prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # ── APIs externes ─────────────────────────────────────────────────────────
    api_adresse_url: str = "https://api-adresse.data.gouv.fr"
    dvf_api_url: str = "https://apidf-preprod.cerema.fr"
    dpe_api_url: str = "https://data.ademe.fr/data-fair/api/v1/datasets"

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000"

    # ── Application ───────────────────────────────────────────────────────────
    log_level: str = "INFO"
    environment: str = "development"
    app_version: str = "1.0.0"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"


settings = Settings()
