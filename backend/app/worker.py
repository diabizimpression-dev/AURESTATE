from __future__ import annotations

import asyncio
import logging

import structlog

from app.config import settings
from app.pipeline.run_pipeline import run_full_pipeline

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
        logging.getLevelName(settings.log_level.upper())
    ),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

log = structlog.get_logger(__name__)


async def main() -> None:
    log.info("worker.start", environment=settings.environment)
    try:
        await run_full_pipeline(departement="75", annee=2024)
    except Exception as exc:
        log.error("worker.pipeline_failed", error=str(exc), exc_info=True)

    log.info("worker.idle")
    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
