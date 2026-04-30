from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import asyncpg
import pandas as pd
import structlog

from app.config import settings

log = structlog.get_logger(__name__)

_BATCH_SIZE = 1000
_PROGRESS_EVERY = 5000

_COLUMNS: tuple[str, ...] = (
    "id_mutation",
    "date_mutation",
    "nature_mutation",
    "valeur_fonciere",
    "adresse_numero",
    "adresse_suffixe",
    "adresse_nom_voie",
    "adresse_code_voie",
    "code_postal",
    "code_commune",
    "nom_commune",
    "code_departement",
    "ancien_code_commune",
    "ancien_nom_commune",
    "id_parcelle",
    "ancien_id_parcelle",
    "numero_volume",
    "lot1_numero",
    "lot1_surface_carrez",
    "lot2_numero",
    "lot2_surface_carrez",
    "lot3_numero",
    "lot3_surface_carrez",
    "lot4_numero",
    "lot4_surface_carrez",
    "lot5_numero",
    "lot5_surface_carrez",
    "nombre_lots",
    "code_type_local",
    "type_local",
    "surface_reelle_bati",
    "nombre_pieces_principales",
    "code_nature_culture",
    "nature_culture",
    "code_nature_culture_speciale",
    "nature_culture_speciale",
    "surface_terrain",
    "longitude",
    "latitude",
    "source_version",
    "hash_dedup",
)

_TEXT_COLUMNS: frozenset[str] = frozenset(
    {
        "id_mutation",
        "nature_mutation",
        "adresse_numero",
        "adresse_suffixe",
        "adresse_nom_voie",
        "adresse_code_voie",
        "code_postal",
        "code_commune",
        "nom_commune",
        "code_departement",
        "ancien_code_commune",
        "ancien_nom_commune",
        "id_parcelle",
        "ancien_id_parcelle",
        "numero_volume",
        "lot1_numero",
        "lot2_numero",
        "lot3_numero",
        "lot4_numero",
        "lot5_numero",
        "code_type_local",
        "type_local",
        "code_nature_culture",
        "nature_culture",
        "code_nature_culture_speciale",
        "nature_culture_speciale",
        "source_version",
        "hash_dedup",
    }
)

_NUMERIC_COLUMNS: frozenset[str] = frozenset(
    {
        "valeur_fonciere",
        "lot1_surface_carrez",
        "lot2_surface_carrez",
        "lot3_surface_carrez",
        "lot4_surface_carrez",
        "lot5_surface_carrez",
        "surface_reelle_bati",
        "surface_terrain",
        "longitude",
        "latitude",
    }
)

_INTEGER_COLUMNS: frozenset[str] = frozenset({"nombre_lots", "nombre_pieces_principales"})

_INSERT_SQL = f"""
    INSERT INTO raw_dvf ({', '.join(_COLUMNS)})
    VALUES ({', '.join(f'${i + 1}' for i in range(len(_COLUMNS)))})
    ON CONFLICT (hash_dedup) DO NOTHING
"""


def _to_asyncpg_dsn(database_url: str) -> str:
    return database_url.replace("postgresql+asyncpg://", "postgresql://", 1)


def _compute_hash_dedup(id_mutation: Any, id_parcelle: Any, valeur_fonciere: Any) -> str:
    payload = f"{id_mutation or ''}|{id_parcelle or ''}|{valeur_fonciere or ''}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _clean_value(column: str, value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    if column in _TEXT_COLUMNS:
        text = str(value).strip()
        return text or None

    if column in _NUMERIC_COLUMNS:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    if column in _INTEGER_COLUMNS:
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None

    if column == "date_mutation":
        try:
            return pd.to_datetime(value).date()
        except (TypeError, ValueError):
            return None

    return value


def _build_record(row: dict[str, Any], source_version: str) -> tuple[Any, ...] | None:
    id_mutation = row.get("id_mutation")
    if id_mutation is None or (isinstance(id_mutation, float) and pd.isna(id_mutation)):
        return None

    hash_dedup = _compute_hash_dedup(
        row.get("id_mutation"),
        row.get("id_parcelle"),
        row.get("valeur_fonciere"),
    )

    record: list[Any] = []
    for column in _COLUMNS:
        if column == "source_version":
            record.append(source_version)
        elif column == "hash_dedup":
            record.append(hash_dedup)
        else:
            record.append(_clean_value(column, row.get(column)))
    return tuple(record)


async def _flush_batch(
    conn: asyncpg.Connection,
    batch: list[tuple[Any, ...]],
) -> tuple[int, int]:
    if not batch:
        return 0, 0

    inserted = 0
    skipped = 0
    async with conn.transaction():
        for record in batch:
            status = await conn.execute(_INSERT_SQL, *record)
            if status.endswith(" 1"):
                inserted += 1
            else:
                skipped += 1
    return inserted, skipped


async def ingest_raw_dvf(csv_path: Path, source_version: str) -> dict[str, int]:
    log.info("ingest.raw.start", csv=str(csv_path), source_version=source_version)

    df = pd.read_csv(
        csv_path,
        dtype=str,
        keep_default_na=True,
        na_values=["", "NA", "NaN"],
        low_memory=False,
    )
    total_rows = len(df)
    log.info("ingest.raw.loaded", rows=total_rows)

    dsn = _to_asyncpg_dsn(settings.database_url)
    conn = await asyncpg.connect(dsn)

    inserted = 0
    skipped = 0
    errors = 0
    batch: list[tuple[Any, ...]] = []

    try:
        for idx, raw_row in enumerate(df.to_dict(orient="records"), start=1):
            try:
                record = _build_record(raw_row, source_version)
                if record is None:
                    errors += 1
                    continue
                batch.append(record)
            except Exception as exc:
                errors += 1
                log.warning("ingest.raw.row_error", row=idx, error=str(exc))
                continue

            if len(batch) >= _BATCH_SIZE:
                try:
                    ins, skp = await _flush_batch(conn, batch)
                    inserted += ins
                    skipped += skp
                except Exception as exc:
                    errors += len(batch)
                    log.error("ingest.raw.batch_error", error=str(exc), batch_size=len(batch))
                batch = []

            if idx % _PROGRESS_EVERY == 0:
                log.info(
                    "ingest.raw.progress",
                    processed=idx,
                    total=total_rows,
                    inserted=inserted,
                    skipped=skipped,
                    errors=errors,
                )

        if batch:
            try:
                ins, skp = await _flush_batch(conn, batch)
                inserted += ins
                skipped += skp
            except Exception as exc:
                errors += len(batch)
                log.error("ingest.raw.batch_error", error=str(exc), batch_size=len(batch))
    finally:
        await conn.close()

    stats = {"inserted": inserted, "skipped": skipped, "errors": errors}
    log.info("ingest.raw.complete", **stats, total=total_rows)
    return stats
