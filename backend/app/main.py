"""
AURESTATE – FastAPI application entry point.

Initialise:
- Lifespan context (DB pool, Redis pool)
- CORS middleware
- Request-ID middleware (UUID par requête → audit trail)
- Structured logging via structlog
- Prometheus metrics
- Routers: estimation, comparables, health
- Exception handlers (404, 422, 500)
"""
from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import close_redis, engine, get_redis

# ── Logging configuration ─────────────────────────────────────────────────────

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(
        __import__("logging").getLevelName(settings.log_level.upper())
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

log = structlog.get_logger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Start-up and tear-down logic for the FastAPI application."""
    log.info("aurestate.startup", environment=settings.environment, version=settings.app_version)

    # Warm-up: verify DB connectivity
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        log.info("db.connected")
    except Exception as exc:
        log.error("db.connection_failed", error=str(exc))

    # Warm-up: verify Redis connectivity
    try:
        redis = await get_redis()
        await redis.ping()
        log.info("redis.connected")
    except Exception as exc:
        log.error("redis.connection_failed", error=str(exc))

    yield  # ← application is running

    # Tear-down
    log.info("aurestate.shutdown")
    await close_redis()
    await engine.dispose()


# ── FastAPI instance ──────────────────────────────────────────────────────────

app = FastAPI(
    title="AURESTATE API",
    description=(
        "API d'estimation immobilière pour le marché français. "
        "Données DVF, géocodage, scoring 4D."
    ),
    version=settings.app_version,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
)


# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request-ID middleware (audit trail) ───────────────────────────────────────

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """
    Attache un UUID à chaque requête.
    Injecté dans request.state.request_id et les headers de réponse.
    """
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id

    # Bind le request_id dans le contexte structlog pour tous les logs du handler
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = str(elapsed_ms)

    log.info(
        "http.request",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        elapsed_ms=elapsed_ms,
    )
    return response


# ── Prometheus metrics ────────────────────────────────────────────────────────

Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_respect_env_var=False,
    excluded_handlers=["/metrics", "/api/v1/health"],
).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = getattr(request.state, "request_id", None)
    if exc.status_code == status.HTTP_404_NOT_FOUND:
        log.warning("http.404", path=request.url.path, request_id=request_id)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "request_id": request_id,
        },
        headers={"X-Request-ID": request_id or ""},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", None)
    log.warning(
        "http.422",
        path=request.url.path,
        errors=exc.errors(),
        request_id=request_id,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation error",
            "detail": exc.errors(),
            "request_id": request_id,
        },
        headers={"X-Request-ID": request_id or ""},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", None)
    log.error(
        "http.500",
        path=request.url.path,
        error=str(exc),
        request_id=request_id,
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "request_id": request_id,
        },
        headers={"X-Request-ID": request_id or ""},
    )


# ── Routers ───────────────────────────────────────────────────────────────────

from app.routers import comparables, estimation, health  # noqa: E402

app.include_router(health.router)
app.include_router(estimation.router)
app.include_router(comparables.router)
