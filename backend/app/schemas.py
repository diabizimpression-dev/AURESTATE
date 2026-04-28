from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ── Santé ─────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    db: str
    redis: str
    version: str


# ── Scores 4D ─────────────────────────────────────────────────────────────────

class ScoreDetail(BaseModel):
    label: str
    value: float = Field(..., ge=0, le=100)
    weight: float = Field(..., ge=0, le=1)
    description: Optional[str] = None


class ScoreBreakdown(BaseModel):
    localisation: ScoreDetail
    marche: ScoreDetail
    bien: ScoreDetail
    dpe: ScoreDetail
    global_score: float = Field(..., ge=0, le=100, alias="global")

    model_config = {"populate_by_name": True}


# ── Comparables / Transactions DVF ───────────────────────────────────────────

class ComparableTransaction(BaseModel):
    id: str
    adresse: str
    code_postal: str
    commune: str
    date_mutation: datetime
    type_local: str
    surface_reelle_bati: float
    nombre_pieces_principales: Optional[int] = None
    valeur_fonciere: float
    prix_m2: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_metres: Optional[float] = None

    model_config = {"from_attributes": True}


class ComparablesResponse(BaseModel):
    total: int
    transactions: List[ComparableTransaction]
    rayon_metres: int
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None


# ── Estimation ────────────────────────────────────────────────────────────────

class EstimationRequest(BaseModel):
    adresse: str = Field(..., min_length=5, max_length=500, description="Adresse complète du bien")
    type_local: str = Field(..., description="Appartement ou Maison")
    surface_bati: float = Field(..., gt=0, le=10000, description="Surface habitable en m²")
    nb_pieces: Optional[int] = Field(None, ge=1, le=50, description="Nombre de pièces principales")

    @field_validator("type_local")
    @classmethod
    def validate_type_local(cls, v: str) -> str:
        allowed = {"Appartement", "Maison"}
        if v not in allowed:
            raise ValueError(f"type_local doit être parmi: {allowed}")
        return v


class PrixFourchette(BaseModel):
    min: float
    median: float
    max: float
    unite: str = "EUR"
    prix_m2_min: float
    prix_m2_median: float
    prix_m2_max: float


class EstimationResponse(BaseModel):
    request_id: str
    adresse_geocodee: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geocoding_score: Optional[float] = None
    fourchette: PrixFourchette
    scores: ScoreBreakdown
    confidence: float = Field(..., ge=0, le=1, description="Indice de confiance [0-1]")
    nb_comparables: int
    comparables: List[ComparableTransaction]
    created_at: datetime
