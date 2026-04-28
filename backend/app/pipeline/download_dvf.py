from __future__ import annotations

import gzip
import shutil
from pathlib import Path

import httpx
import structlog

log = structlog.get_logger(__name__)

_DVF_BASE_URL = "https://files.data.gouv.fr/geo-dvf/latest/csv"
_CHUNK_SIZE = 1 << 16
_HTTP_TIMEOUT = httpx.Timeout(connect=10.0, read=300.0, write=30.0, pool=10.0)


async def download_dvf(departement: str, annee: int) -> Path:
    url = f"{_DVF_BASE_URL}/{annee}/departements/{departement}.csv.gz"
    tmp_dir = Path("/tmp")
    tmp_dir.mkdir(parents=True, exist_ok=True)

    gz_path = tmp_dir / f"dvf_{departement}_{annee}.csv.gz"
    csv_path = tmp_dir / f"dvf_{departement}_{annee}.csv"

    log.info("dvf.download.start", url=url, dest=str(gz_path))

    bytes_written = 0
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT, follow_redirects=True) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            with gz_path.open("wb") as fh:
                async for chunk in response.aiter_bytes(_CHUNK_SIZE):
                    fh.write(chunk)
                    bytes_written += len(chunk)

    log.info("dvf.download.complete", bytes=bytes_written, path=str(gz_path))

    log.info("dvf.decompress.start", source=str(gz_path), dest=str(csv_path))
    with gzip.open(gz_path, "rb") as src, csv_path.open("wb") as dst:
        shutil.copyfileobj(src, dst, length=_CHUNK_SIZE)
    log.info("dvf.decompress.complete", path=str(csv_path), size=csv_path.stat().st_size)

    return csv_path
