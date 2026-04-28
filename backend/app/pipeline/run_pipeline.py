from __future__ import annotations

import asyncio

import structlog

from app.pipeline.download_dvf import download_dvf
from app.pipeline.ingest_raw import ingest_raw_dvf
from app.pipeline.promote_clean import promote_to_clean

log = structlog.get_logger(__name__)


async def run_full_pipeline(departement: str = "75", annee: int = 2024) -> dict:
    log.info("pipeline.start", departement=departement, annee=annee)

    csv_path = await download_dvf(departement, annee)
    raw_stats = await ingest_raw_dvf(csv_path, source_version=f"{annee}-full")
    clean_stats = await promote_to_clean()

    log.info("pipeline.complete", raw=raw_stats, clean=clean_stats)
    return {"raw": raw_stats, "clean": clean_stats}


if __name__ == "__main__":
    asyncio.run(run_full_pipeline())
