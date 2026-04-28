from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, get_redis
from app.schemas import (
    ComparableTransaction,
    EstimationRequest,
    EstimationResponse,
    PrixFourchette,
    ScoreBreakdown,
    ScoreDetail,
)
from app.services.geocoding import geocode_address

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/v1", tags=["estimation"])

_CACHE_TTL = 3600  # 1h


def _cache_key(req: EstimationRequest) -> str:
    raw = f"{req.adresse.lower().strip()}|{req.type_local}|{req.surface_bati}"
    return f"estimation:{hashlib.sha256(raw.encode()).hexdigest()[:24]}"


def _compute_scores(
    prix_m2_bien: float,
    prix_m2_median: float,
    nb_comparables: int,
    classe_dpe: Optional[str],
) -> ScoreBreakdown:
    # Valeur: ratio bien vs médiane locale (100 = exactement à la médiane)
    ratio = prix_m2_bien / prix_m2_median if prix_m2_median > 0 else 1.0
    score_valeur = max(0.0, min(100.0, 100.0 / ratio))

    # Tension: proxy via nb_comparables (plus de ventes = marché tendu)
    score_tension = min(100.0, nb_comparables * 2.5)

    # Liquidité: simplifié MVP — bon si médiane disponible et comparables >= 5
    score_liquidite = 80.0 if nb_comparables >= 5 else max(20.0, nb_comparables * 16.0)

    # Énergie: pénalité DPE
    dpe_penalty = {"A": 0, "B": 0, "C": 5, "D": 15, "E": 25, "F": 40, "G": 60}
    penalty = dpe_penalty.get(classe_dpe or "D", 15)
    score_energie = max(0.0, 100.0 - penalty)

    score_global = (
        score_valeur * 0.40
        + score_tension * 0.30
        + score_liquidite * 0.20
        + score_energie * 0.10
    )

    return ScoreBreakdown(
        localisation=ScoreDetail(label="Valeur marché", value=round(score_valeur, 1), weight=0.40),
        marche=ScoreDetail(label="Tension locale", value=round(score_tension, 1), weight=0.30),
        bien=ScoreDetail(label="Liquidité", value=round(score_liquidite, 1), weight=0.20),
        dpe=ScoreDetail(label="Risque énergétique", value=round(score_energie, 1), weight=0.10),
        **{"global": round(score_global, 1)},
    )


@router.post("/estimation", response_model=EstimationResponse, status_code=status.HTTP_200_OK)
async def create_estimation(
    req: EstimationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> EstimationResponse:
    request_id = str(getattr(request.state, "request_id", uuid.uuid4()))
    log.info("estimation.start", adresse=req.adresse, type=req.type_local, surface=req.surface_bati)

    # ── Cache Redis ───────────────────────────────────────────────────────────
    redis = await get_redis()
    ck = _cache_key(req)
    cached = await redis.get(ck)
    if cached:
        log.info("estimation.cache_hit", key=ck)
        data = json.loads(cached)
        data["request_id"] = request_id
        return EstimationResponse(**data)

    # ── Géocodage ─────────────────────────────────────────────────────────────
    geo = await geocode_address(req.adresse)
    if geo is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Adresse introuvable ou ambiguë. Précisez l'adresse complète avec code postal.",
        )
    lat, lng, geo_score = geo

    # ── Requête comparables (PostGIS) ─────────────────────────────────────────
    sql = text("""
        SELECT
            id::text,
            adresse_complete AS adresse,
            code_postal,
            nom_commune AS commune,
            date_mutation,
            type_local,
            surface_bati AS surface_reelle_bati,
            nombre_pieces AS nombre_pieces_principales,
            valeur_fonciere,
            prix_m2,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            ROUND(
                ST_Distance(
                    ST_Transform(geom, 2154),
                    ST_Transform(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 2154)
                )::numeric, 1
            ) AS distance_metres
        FROM transactions
        WHERE
            is_outlier = FALSE
            AND type_local = :type_local
            AND prix_m2 IS NOT NULL
            AND date_mutation >= NOW() - INTERVAL '24 months'
            AND ST_DWithin(
                geom::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                500
            )
            AND surface_bati BETWEEN :surface_min AND :surface_max
        ORDER BY distance_metres ASC
        LIMIT 20
    """)

    result = await db.execute(sql, {
        "lat": lat,
        "lng": lng,
        "type_local": req.type_local,
        "surface_min": req.surface_bati * 0.6,
        "surface_max": req.surface_bati * 1.4,
    })
    rows = result.mappings().all()

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun comparable trouvé dans un rayon de 500m sur 24 mois. Zone insuffisamment documentée.",
        )

    comparables: List[ComparableTransaction] = [ComparableTransaction(**dict(r)) for r in rows]
    prix_m2_values = [c.prix_m2 for c in comparables]
    prix_m2_values.sort()
    n = len(prix_m2_values)
    p_min = prix_m2_values[0]
    p_max = prix_m2_values[-1]
    p_median = prix_m2_values[n // 2]

    fourchette = PrixFourchette(
        min=round(p_min * req.surface_bati, 0),
        median=round(p_median * req.surface_bati, 0),
        max=round(p_max * req.surface_bati, 0),
        prix_m2_min=round(p_min, 0),
        prix_m2_median=round(p_median, 0),
        prix_m2_max=round(p_max, 0),
    )

    scores = _compute_scores(
        prix_m2_bien=p_median,
        prix_m2_median=p_median,
        nb_comparables=n,
        classe_dpe=None,
    )

    confidence = min(1.0, n / 10.0)

    # ── Audit log RGPD ────────────────────────────────────────────────────────
    await db.execute(text("""
        INSERT INTO audit_log (event_type, details)
        VALUES ('estimation', :details::jsonb)
    """), {"details": json.dumps({
        "request_id": request_id,
        "adresse": req.adresse,
        "type_local": req.type_local,
        "surface_bati": req.surface_bati,
        "nb_comparables": n,
    })})

    response = EstimationResponse(
        request_id=request_id,
        adresse_geocodee=req.adresse,
        latitude=lat,
        longitude=lng,
        geocoding_score=geo_score,
        fourchette=fourchette,
        scores=scores,
        confidence=confidence,
        nb_comparables=n,
        comparables=comparables[:5],
        created_at=datetime.now(timezone.utc),
    )

    # ── Mise en cache ─────────────────────────────────────────────────────────
    await redis.setex(ck, _CACHE_TTL, response.model_dump_json())

    log.info("estimation.done", nb_comparables=n, confidence=confidence, prix_m2_median=p_median)
    return response
