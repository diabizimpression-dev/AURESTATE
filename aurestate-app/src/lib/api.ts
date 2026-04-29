const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface EstimationRequest {
  adresse: string
  type_local: "Appartement" | "Maison"
  surface_bati: number
  nb_pieces?: number
}

export interface ScoreDetail {
  label: string
  value: number
  weight: number
}

export interface Fourchette {
  min: number
  median: number
  max: number
  prix_m2_min: number
  prix_m2_median: number
  prix_m2_max: number
}

export interface Comparable {
  id: string
  adresse: string
  commune: string
  date_mutation: string
  type_local: string
  surface_reelle_bati: number
  valeur_fonciere: number
  prix_m2: number
  distance_metres: number
}

export interface EstimationResponse {
  request_id: string
  adresse_geocodee: string
  latitude?: number
  longitude?: number
  geocoding_score?: number
  dpe_classe?: string
  dpe_conso?: number
  fourchette: Fourchette
  scores: {
    localisation: ScoreDetail
    marche: ScoreDetail
    bien: ScoreDetail
    dpe: ScoreDetail
    global: number
  }
  confidence: number
  nb_comparables: number
  comparables: Comparable[]
}

export async function fetchEstimation(
  req: EstimationRequest
): Promise<EstimationResponse> {
  const res = await fetch(`${API_URL}/api/v1/estimation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? `Erreur ${res.status}`)
  }
  return res.json()
}
