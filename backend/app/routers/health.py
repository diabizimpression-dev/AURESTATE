from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.database import check_db_health, check_redis_health
from app.schemas import HealthResponse

router = APIRouter(prefix="/api/v1/health", tags=["health"])


@router.get("", response_model=HealthResponse, summary="Vérification de l'état des services")
async def health_check() -> HealthResponse:
    """
    Vérifie la disponibilité de l'API, de la base de données PostgreSQL
    et du cache Redis.
    """
    db_ok = await check_db_health()
    redis_ok = await check_redis_health()

    return HealthResponse(
        status="ok" if (db_ok and redis_ok) else "degraded",
        db="ok" if db_ok else "error",
        redis="ok" if redis_ok else "error",
        version=settings.app_version,
    )
