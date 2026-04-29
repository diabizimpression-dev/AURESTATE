"""
Ingestion DPE ADEME — logements existants Paris (code postal 75*).

Source : https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants
Pagination : curseur « after » renvoyé dans chaque réponse.
Filtre     : Date_fin_validité_DPE >= aujourd'hui (DPE non expirés).
Géométrie  : _geopoint (lat,lng) en priorité ; fallback geocode_address().
Conflict   : ON CONFLICT (numero_dpe) DO UPDATE sur les colonnes évolutives.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import date, datetime, timezone
from typing import Any, Optional

import asyncpg
import httpx
import structlog

from app.config import settings
from app.services.geocoding import geocode_address

log = structlog.get_logger(__name__)

_DATASET = "dpe-v2-logements-existants"
_BASE_URL = f"{settings.dpe_api_url}/{_DATASET}/lines"
_PAGE_SIZE = 10_000
_BATCH_SIZE = 500
_HTTP_TIMEOUT = 30.0

_SELECT_FIELDS = ",".join([
    "N°DPE",
    "Adresse_(BAN)",
    "Code_postal_(BAN)",
    "Code_INSEE_(BAN)",
    "Etiquette_DPE",
    "Etiquette_GES",
    "Conso_5_usages_é_finale",
    "Date_établissement_DPE",
    "Date_fin_validité_DPE",
    "Surface_habitable_logement",
    "Type_bâtiment",
    "_geopoint",
])

_INSERT_SQL = """
    INSERT INTO dpe (
        id,
        numero_dpe,
        adresse,
        code_postal,
        code_commune,
        geom,
        classe_energie,
        classe_ges,
        valeur_conso_ep,
        date_etablissement,
        date_expiration,
        surface_habitable,
        type_batiment,
        source_version,
        ingested_at
    )
    VALUES (
        $1, $2, $3, $4, $5,
        ST_SetSRID(ST_MakePoint($6, $7), 4326),
        $8, $9, $10, $11, $12, $13, $14, $15, $16
    )
    ON CONFLICT (numero_dpe) DO UPDATE SET
        classe_energie  = EXCLUDED.classe_energie,
        date_expiration = EXCLUDED.date_expiration,
        source_version  = EXCLUDED.source_version,
        ingested_at     = EXCLUDED.ingested_at
"""

_INSERT_SQL_NO_GEOM = """
    INSERT INTO dpe (
        id,
        numero_dpe,
        adresse,
        code_postal,
        code_commune,
        geom,
        classe_energie,
        classe_ges,
        valeur_conso_ep,
        date_etablissement,
        date_expiration,
        surface_habitable,
        type_batiment,
        source_version,
        ingested_at
    )
    VALUES (
        $1, $2, $3, $4, $5,
        NULL,
        $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    ON CONFLICT (numero_dpe) DO UPDATE SET
        classe_energie  = EXCLUDED.classe_energie,
        date_expiration = EXCLUDED.date_expiration,
        source_version  = EXCLUDED.source_version,
        ingested_at     = EXCLUDED.ingested_at
"""


def _to_asyncpg_dsn(database_url: str) -> str:
    return database_url.replace("postgresql+asyncpg://", "postgresql://", 1)


def _parse_date(value: Any) -> Optional[date]:
    if not value:
        return None
    raw = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


def _parse_geopoint(value: Any) -> Optional[tuple[float, float]]:
    """Parse '_geopoint' field formatted as 'lat,lng' → (lat, lng)."""
    if not value:
        return None
    try:
        parts = str(value).split(",")
        if len(parts) != 2:
            return None
        lat = float(parts[0].strip())
        lng = float(parts[1].strip())
        if -90 <= lat <= 90 and -180 <= lng <= 180:
            return lat, lng
    except (ValueError, AttributeError):
        pass
    return None


def _map_record(row: dict[str, Any]) -> Optional[dict[str, Any]]:
    """Map an ADEME API row to the dpe table columns. Returns None if invalid."""
    numero_dpe = str(row.get("N°DPE") or "").strip()
    if not numero_dpe:
        return None

    etiquette_dpe = str(row.get("Etiquette_DPE") or "").strip()
    classe_energie: Optional[str] = etiquette_dpe[0].upper() if etiquette_dpe else None

    etiquette_ges = str(row.get("Etiquette_GES") or "").strip()
    classe_ges: Optional[str] = etiquette_ges[0].upper() if etiquette_ges else None

    try:
        valeur_conso_ep: Optional[float] = float(row["Conso_5_usages_é_finale"]) if row.get("Conso_5_usages_é_finale") is not None else None
    except (ValueError, TypeError):
        valeur_conso_ep = None

    date_etablissement = _parse_date(row.get("Date_établissement_DPE"))
    date_expiration = _parse_date(row.get("Date_fin_validité_DPE"))

    try:
        surface_habitable: Optional[float] = float(row["Surface_habitable_logement"]) if row.get("Surface_habitable_logement") is not None else None
    except (ValueError, TypeError):
        surface_habitable = None

    geopoint = _parse_geopoint(row.get("_geopoint"))

    return {
        "id": str(uuid.uuid4()),
        "numero_dpe": numero_dpe,
        "adresse": str(row.get("Adresse_(BAN)") or "").strip() or None,
        "code_postal": str(row.get("Code_postal_(BAN)") or "").strip()[:5] or None,
        "code_commune": str(row.get("Code_INSEE_(BAN)") or "").strip()[:5] or None,
        "classe_energie": classe_energie,
        "classe_ges": classe_ges,
        "valeur_conso_ep": valeur_conso_ep,
        "date_etablissement": date_etablissement,
        "date_expiration": date_expiration,
        "surface_habitable": surface_habitable,
        "type_batiment": str(row.get("Type_bâtiment") or "").strip() or None,
        "geopoint": geopoint,
        "raw_adresse": str(row.get("Adresse_(BAN)") or "").strip() or None,
    }


async def _fetch_page(
    client: httpx.AsyncClient,
    after: Optional[str],
    annee: int,
) -> tuple[list[dict[str, Any]], Optional[str]]:
    """Fetch one page from the ADEME API. Returns (rows, next_after_token)."""
    params: dict[str, Any] = {
        "size": _PAGE_SIZE,
        "q_fields": "Code_postal_(BAN)",
        "q": "75*",
        "select": _SELECT_FIELDS,
    }
    if after:
        params["after"] = after

    for attempt in (1, 2):
        try:
            resp = await client.get(_BASE_URL, params=params, timeout=_HTTP_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
            rows: list[dict[str, Any]] = data.get("results", [])
            next_after: Optional[str] = data.get("after")
            return rows, next_after
        except httpx.TimeoutException:
            if attempt == 1:
                log.warning("dpe.fetch.timeout_retry", after=after)
                await asyncio.sleep(2)
                continue
            log.error("dpe.fetch.timeout_final", after=after)
            raise
        except httpx.HTTPStatusError as exc:
            log.error(
                "dpe.fetch.http_error",
                status=exc.response.status_code,
                after=after,
            )
            raise

    return [], None  # unreachable — keeps type-checker happy


async def _flush_batch(
    conn: asyncpg.Connection,
    batch: list[dict[str, Any]],
    source_version: str,
    today: date,
) -> tuple[int, int, int]:
    """Insert/update a batch of DPE records. Returns (inserted, updated, skipped)."""
    if not batch:
        return 0, 0, 0

    inserted = updated = skipped = 0
    ingested_at = datetime.now(timezone.utc)

    async with conn.transaction():
        for rec in batch:
            date_expiration: Optional[date] = rec["date_expiration"]
            # Filtre DPE non expirés
            if date_expiration is not None and date_expiration < today:
                skipped += 1
                continue

            geopoint: Optional[tuple[float, float]] = rec["geopoint"]

            # Fallback géocodage si pas de coordonnées
            if geopoint is None and rec["raw_adresse"]:
                geo_result = await geocode_address(rec["raw_adresse"])
                if geo_result:
                    lat_geo, lng_geo, _ = geo_result
                    geopoint = (lat_geo, lng_geo)

            if geopoint is not None:
                lat, lng = geopoint
                status = await conn.execute(
                    _INSERT_SQL,
                    rec["id"],
                    rec["numero_dpe"],
                    rec["adresse"],
                    rec["code_postal"],
                    rec["code_commune"],
                    lng,   # ST_MakePoint(lng, lat)
                    lat,
                    rec["classe_energie"],
                    rec["classe_ges"],
                    rec["valeur_conso_ep"],
                    rec["date_etablissement"],
                    date_expiration,
                    rec["surface_habitable"],
                    rec["type_batiment"],
                    source_version,
                    ingested_at,
                )
            else:
                status = await conn.execute(
                    _INSERT_SQL_NO_GEOM,
                    rec["id"],
                    rec["numero_dpe"],
                    rec["adresse"],
                    rec["code_postal"],
                    rec["code_commune"],
                    rec["classe_energie"],
                    rec["classe_ges"],
                    rec["valeur_conso_ep"],
                    rec["date_etablissement"],
                    date_expiration,
                    rec["surface_habitable"],
                    rec["type_batiment"],
                    source_version,
                    ingested_at,
                )

            # asyncpg execute() returns e.g. "INSERT 0 1" or "UPDATE 1"
            if "INSERT 0 1" in status:
                inserted += 1
            elif "UPDATE" in status:
                updated += 1
            else:
                skipped += 1

    return inserted, updated, skipped


async def ingest_dpe_paris(annee: int = 2024) -> dict[str, int]:
    """
    Download and insert DPE data for Paris (code postal 75*) into the dpe table.

    Args:
        annee: Reference year used as source_version tag.

    Returns:
        {"inserted": int, "updated": int, "skipped": int}
    """
    source_version = f"ademe-dpe-v2-{annee}"
    today = date.today()

    log.info("dpe.ingest.start", source_version=source_version, today=str(today))

    dsn = _to_asyncpg_dsn(settings.database_url)
    conn = await asyncpg.connect(dsn)

    total_inserted = total_updated = total_skipped = 0
    page_num = 0
    after: Optional[str] = None

    try:
        async with httpx.AsyncClient() as client:
            while True:
                page_num += 1
                log.info("dpe.ingest.fetch_page", page=page_num, after=after)

                rows, next_after = await _fetch_page(client, after, annee)

                if not rows:
                    log.info("dpe.ingest.no_more_rows", page=page_num)
                    break

                # Map API rows → dpe records
                batch: list[dict[str, Any]] = []
                for row in rows:
                    mapped = _map_record(row)
                    if mapped is None:
                        total_skipped += 1
                        continue
                    batch.append(mapped)

                    if len(batch) >= _BATCH_SIZE:
                        ins, upd, skp = await _flush_batch(conn, batch, source_version, today)
                        total_inserted += ins
                        total_updated += upd
                        total_skipped += skp
                        batch = []

                # Flush remaining records from this page
                if batch:
                    ins, upd, skp = await _flush_batch(conn, batch, source_version, today)
                    total_inserted += ins
                    total_updated += upd
                    total_skipped += skp

                log.info(
                    "dpe.ingest.page_done",
                    page=page_num,
                    rows_fetched=len(rows),
                    inserted=total_inserted,
                    updated=total_updated,
                    skipped=total_skipped,
                )

                if not next_after:
                    break
                after = next_after

    finally:
        await conn.close()

    stats: dict[str, int] = {
        "inserted": total_inserted,
        "updated": total_updated,
        "skipped": total_skipped,
    }
    log.info("dpe.ingest.complete", **stats, pages=page_num)
    return stats
