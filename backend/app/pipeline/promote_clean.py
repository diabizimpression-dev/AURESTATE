from __future__ import annotations

from typing import Any

import asyncpg
import structlog

from app.config import settings
from app.services.geocoding import geocode_address

log = structlog.get_logger(__name__)

_PROGRESS_EVERY = 5000

_SELECT_NEW_RAW_SQL = """
    SELECT
        r.id,
        r.date_mutation,
        r.nature_mutation,
        r.valeur_fonciere,
        r.adresse_numero,
        r.adresse_suffixe,
        r.adresse_nom_voie,
        r.code_postal,
        r.code_commune,
        r.nom_commune,
        r.code_departement,
        r.type_local,
        r.surface_reelle_bati,
        r.nombre_pieces_principales,
        r.longitude,
        r.latitude
    FROM raw_dvf r
    LEFT JOIN transactions t ON t.raw_dvf_id = r.id
    WHERE t.id IS NULL
      AND r.nature_mutation = 'Vente'
      AND r.valeur_fonciere > 1000
      AND r.surface_reelle_bati > 9
      AND r.type_local IN ('Appartement', 'Maison')
      AND (r.valeur_fonciere / NULLIF(r.surface_reelle_bati, 0)) BETWEEN 500 AND 50000
"""

_INSERT_TRANSACTION_SQL = """
    INSERT INTO transactions (
        raw_dvf_id,
        date_mutation,
        type_local,
        adresse_complete,
        code_postal,
        code_commune,
        nom_commune,
        code_departement,
        surface_bati,
        nombre_pieces,
        valeur_fonciere,
        geom,
        geocodage_score,
        geocodage_source,
        is_outlier,
        outlier_reason
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        CASE WHEN $12::float8 IS NOT NULL AND $13::float8 IS NOT NULL
             THEN ST_SetSRID(ST_MakePoint($12::float8, $13::float8), 4326)
             ELSE NULL
        END,
        $14, $15, $16, $17
    )
"""


def _to_asyncpg_dsn(database_url: str) -> str:
    return database_url.replace("postgresql+asyncpg://", "postgresql://", 1)


def _build_adresse_complete(row: dict[str, Any]) -> str | None:
    parts: list[str] = []
    numero = row.get("adresse_numero")
    suffixe = row.get("adresse_suffixe")
    voie = row.get("adresse_nom_voie")
    code_postal = row.get("code_postal")
    nom_commune = row.get("nom_commune")

    head = " ".join(p for p in (numero, suffixe, voie) if p)
    tail = " ".join(p for p in (code_postal, nom_commune) if p)

    if head:
        parts.append(head)
    if tail:
        parts.append(tail)

    if not parts:
        return None
    return ", ".join(parts)


async def _resolve_geocoding(
    row: dict[str, Any],
    adresse_complete: str | None,
) -> tuple[float | None, float | None, float | None, str | None]:
    longitude = row.get("longitude")
    latitude = row.get("latitude")
    if longitude is not None and latitude is not None:
        return float(longitude), float(latitude), 1.0, "dvf-native"

    if not adresse_complete:
        return None, None, None, None

    try:
        result = await geocode_address(adresse_complete)
    except Exception as exc:
        log.warning("promote.geocode_error", adresse=adresse_complete, error=str(exc))
        return None, None, None, None

    if result is None:
        return None, None, None, None

    lat, lng, score = result
    return float(lng), float(lat), float(score), "api-adresse"


async def promote_to_clean(batch_size: int = 1000) -> dict[str, int]:
    log.info("promote.clean.start", batch_size=batch_size)

    dsn = _to_asyncpg_dsn(settings.database_url)
    read_conn = await asyncpg.connect(dsn)
    write_conn = await asyncpg.connect(dsn)

    inserted = 0
    outliers = 0
    errors = 0
    processed = 0

    try:
        rows = await read_conn.fetch(_SELECT_NEW_RAW_SQL)
        total = len(rows)
        log.info("promote.clean.candidates", total=total)

        batch: list[tuple[Any, ...]] = []

        for row in rows:
            processed += 1
            try:
                row_dict = dict(row)
                adresse_complete = _build_adresse_complete(row_dict)
                lng, lat, score, source = await _resolve_geocoding(row_dict, adresse_complete)

                is_outlier = lng is None or lat is None
                outlier_reason = "no_geocoding" if is_outlier else None
                if is_outlier:
                    outliers += 1

                surface_bati = row_dict.get("surface_reelle_bati")
                nombre_pieces = row_dict.get("nombre_pieces_principales")

                record = (
                    row_dict["id"],
                    row_dict["date_mutation"],
                    row_dict["type_local"],
                    adresse_complete,
                    row_dict.get("code_postal"),
                    row_dict.get("code_commune"),
                    row_dict.get("nom_commune"),
                    row_dict.get("code_departement"),
                    float(surface_bati) if surface_bati is not None else None,
                    int(nombre_pieces) if nombre_pieces is not None else None,
                    float(row_dict["valeur_fonciere"]),
                    lng,
                    lat,
                    score,
                    source,
                    is_outlier,
                    outlier_reason,
                )
                batch.append(record)
            except Exception as exc:
                errors += 1
                log.warning("promote.clean.row_error", error=str(exc))
                continue

            if len(batch) >= batch_size:
                try:
                    async with write_conn.transaction():
                        await write_conn.executemany(_INSERT_TRANSACTION_SQL, batch)
                    inserted += len(batch)
                except Exception as exc:
                    errors += len(batch)
                    log.error("promote.clean.batch_error", error=str(exc), batch_size=len(batch))
                batch = []

            if processed % _PROGRESS_EVERY == 0:
                log.info(
                    "promote.clean.progress",
                    processed=processed,
                    total=total,
                    inserted=inserted,
                    outliers=outliers,
                    errors=errors,
                )

        if batch:
            try:
                async with write_conn.transaction():
                    await write_conn.executemany(_INSERT_TRANSACTION_SQL, batch)
                inserted += len(batch)
            except Exception as exc:
                errors += len(batch)
                log.error("promote.clean.batch_error", error=str(exc), batch_size=len(batch))
    finally:
        await read_conn.close()
        await write_conn.close()

    stats = {
        "inserted": inserted,
        "outliers": outliers,
        "errors": errors,
        "processed": processed,
    }
    log.info("promote.clean.complete", **stats)
    return stats
