"""
Router /api/v1/comparables

Retourne les transactions DVF dans un rayon donné autour d'un point géographique,
triées par distance croissante.
Cache Redis TTL = 1800 s.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta
from typing import List, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.config import settings
from app.database import AsyncSession, get_db, get_redis
from app.schemas import ComparableTransaction, ComparablesResponse

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/v1/comparables", tags=["comparables"])

_CACHE_TTL = 1800  # 30 min


def _cache_key(lat: float, lng: float, rayon: int, type_local: Optional[str], mois: int) -> str:
    raw = f"{lat:.5f}:{lng:.5f}:{rayon}:{type_local or ''}:{mois}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:24]
    return f"comparables:{digest}"


@router.get(
    "",
    response_model=ComparablesResponse,
    summary="Liste des transactions DVF proches",
    description=(
        "Retourne les transactions DVF dans un rayon donné autour "
        "des coordonnées fournies, triées par distance croissante."
    ),
)
async def get_comparables(
    request: Request,
    lat: float = Query(..., ge=-90, le=90, description="Latitude WGS84"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude WGS84"),
    rayon: int = Query(500, ge=50, le=10000, description="Rayon de recherche en mètres"),
    type_local: Optional[str] = Query(
        None,
        description="Filtre sur le type de local (Appartement, Maison)",
    ),
    mois: int = Query(24, ge=1, le=120, description="Période en mois en arrière"),
    db: AsyncSession = Depends(get_db),
) -> ComparablesResponse:
    request_id: str = getattr(request.state, "request_id", "unknown")
    log.info(
        "comparables.request",
        request_id=request_id,
        lat=lat,
        lng=lng,
        rayon=rayon,
        type_local=type_local,
        mois=mois,
    )

    cache_key = _cache_key(lat, lng, rayon, type_local, mois)

    # ── Lecture cache ─────────────────────────────────────────────────────────
    try:
        redis = await get_redis()
        cached = await redis.get(cache_key)
        if cached:
            log.debug("comparables.cache_hit", cache_key=cache_key)
            data = json.loads(cached)
            return ComparablesResponse(**data)
    except Exception as exc:
        log.warning("comparables.cache_read_error", error=str(exc))

    # ── Requête base de données ───────────────────────────────────────────────
    date_debut = datetime.utcnow() - timedelta(days=mois * 30)

    try:
        from sqlalchemy import text

        # Requête PostGIS: distance en mètres via ST_DWithin (SRID 4326 → 3857)
        query = text(
            """
            SELECT
                id::text,
                adresse_numero || ' ' || adresse_nom_voie        AS adresse,
                code_postal,
                nom_commune                                       AS commune,
                date_mutation,
                type_local,
                surface_reelle_bati,
                nombre_pieces_principales,
                valeur_fonciere,
                ROUND((valeur_fonciere / NULLIF(surface_reelle_bati, 0))::numeric, 2) AS prix_m2,
                latitude,
                longitude,
                ROUND(
                    ST_Distance(
                        ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857),
                        ST_Transform(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 3857)
                    )::numeric,
                    0
                ) AS distance_metres
            FROM dvf_transactions
            WHERE
                date_mutation >= :date_debut
                AND surface_reelle_bati > 0
                AND valeur_fonciere > 0
                AND ST_DWithin(
                    ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857),
                    ST_Transform(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 3857),
                    :rayon
                )
                AND (:type_local IS NULL OR type_local = :type_local)
            ORDER BY distance_metres ASC
            LIMIT 100
            """
        )

        result = await db.execute(
            query,
            {
                "lat": lat,
                "lng": lng,
                "rayon": rayon,
                "date_debut": date_debut,
                "type_local": type_local,
            },
        )
        rows = result.mappings().all()

    except Exception as exc:
        log.error("comparables.db_error", error=str(exc), request_id=request_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Erreur lors de la récupération des comparables.",
        )

    transactions: List[ComparableTransaction] = [
        ComparableTransaction(**dict(row)) for row in rows
    ]

    response = ComparablesResponse(
        total=len(transactions),
        transactions=transactions,
        rayon_metres=rayon,
        date_debut=date_debut,
        date_fin=datetime.utcnow(),
    )

    # ── Écriture cache ────────────────────────────────────────────────────────
    try:
        redis = await get_redis()
        await redis.setex(cache_key, _CACHE_TTL, response.model_dump_json())
    except Exception as exc:
        log.warning("comparables.cache_write_error", error=str(exc))

    return response
