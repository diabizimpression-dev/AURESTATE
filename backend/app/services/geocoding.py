"""
Service de géocodage via l'API Adresse (data.gouv.fr).

Référence: https://adresse.data.gouv.fr/api-doc/adresse
"""
from __future__ import annotations

import hashlib
import json
import logging
from typing import Optional, Tuple

import httpx
import structlog

from app.config import settings
from app.database import get_redis

log = structlog.get_logger(__name__)

# Score minimum acceptable pour considérer le géocodage comme fiable
_SCORE_THRESHOLD = 0.5
_CACHE_TTL_GEOCODE = 86400  # 24 h — les adresses changent peu


def _cache_key(adresse: str) -> str:
    digest = hashlib.sha256(adresse.lower().strip().encode()).hexdigest()[:24]
    return f"geocode:{digest}"


async def geocode_address(
    adresse: str,
) -> Optional[Tuple[float, float, float]]:
    """
    Géocode une adresse via l'API Adresse data.gouv.fr.

    Returns:
        (latitude, longitude, score) si le score >= 0.5, sinon None.
    """
    cache_key = _cache_key(adresse)

    # ── Tentative cache Redis ─────────────────────────────────────────────────
    try:
        redis = await get_redis()
        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            log.debug("geocode.cache_hit", adresse=adresse)
            return data["lat"], data["lng"], data["score"]
    except Exception as exc:
        log.warning("geocode.cache_error", error=str(exc))

    # ── Appel API Adresse ─────────────────────────────────────────────────────
    url = f"{settings.api_adresse_url}/search/"
    params = {"q": adresse, "limit": 1, "autocomplete": 0}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        log.error("geocode.timeout", adresse=adresse)
        return None
    except httpx.HTTPStatusError as exc:
        log.error("geocode.http_error", status=exc.response.status_code, adresse=adresse)
        return None
    except Exception as exc:
        log.error("geocode.unexpected_error", error=str(exc), adresse=adresse)
        return None

    features = data.get("features", [])
    if not features:
        log.warning("geocode.no_result", adresse=adresse)
        return None

    feature = features[0]
    score: float = feature["properties"].get("score", 0.0)
    coords = feature["geometry"]["coordinates"]  # [lng, lat]

    if score < _SCORE_THRESHOLD:
        log.warning(
            "geocode.low_score",
            adresse=adresse,
            score=score,
            threshold=_SCORE_THRESHOLD,
        )
        return None

    lat, lng = coords[1], coords[0]

    # ── Mise en cache du résultat ─────────────────────────────────────────────
    try:
        redis = await get_redis()
        payload = json.dumps({"lat": lat, "lng": lng, "score": score})
        await redis.setex(cache_key, _CACHE_TTL_GEOCODE, payload)
    except Exception as exc:
        log.warning("geocode.cache_write_error", error=str(exc))

    log.info("geocode.success", adresse=adresse, lat=lat, lng=lng, score=score)
    return lat, lng, score
