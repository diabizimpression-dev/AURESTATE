-- =============================================================================
-- AURESTATE - Migration 001 : Schéma initial PostgreSQL + PostGIS
-- Version     : 1.0.0
-- Base        : PostgreSQL 16 + PostGIS 3.4
-- Marché      : France métropolitaine
-- Sources     : DVF (data.gouv.fr), DPE ADEME, INSEE IRIS, Cadastre, IGN
-- Conformité  : RGPD — audit trail, versioning calculs, traçabilité sources
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- 2. TABLE raw_dvf — Données brutes DVF (immuables, append-only)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS raw_dvf (
    id                          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identifiants de mutation
    id_mutation                 TEXT        NOT NULL,
    date_mutation               DATE,
    nature_mutation             TEXT,
    valeur_fonciere             NUMERIC(14,2),

    -- Adresse
    adresse_numero              TEXT,
    adresse_suffixe             TEXT,
    adresse_nom_voie            TEXT,
    adresse_code_voie           TEXT,
    code_postal                 CHAR(5),
    code_commune                CHAR(5),
    nom_commune                 TEXT,
    code_departement            CHAR(3),

    -- Ancienne commune (fusion)
    ancien_code_commune         CHAR(5),
    ancien_nom_commune          TEXT,

    -- Parcelle
    id_parcelle                 TEXT,
    ancien_id_parcelle          TEXT,
    numero_volume               TEXT,

    -- Lots (jusqu'à 5)
    lot1_numero                 TEXT,
    lot1_surface_carrez         NUMERIC(8,2),
    lot2_numero                 TEXT,
    lot2_surface_carrez         NUMERIC(8,2),
    lot3_numero                 TEXT,
    lot3_surface_carrez         NUMERIC(8,2),
    lot4_numero                 TEXT,
    lot4_surface_carrez         NUMERIC(8,2),
    lot5_numero                 TEXT,
    lot5_surface_carrez         NUMERIC(8,2),
    nombre_lots                 SMALLINT,

    -- Caractéristiques du bien
    code_type_local             CHAR(1),
    type_local                  TEXT,
    surface_reelle_bati         NUMERIC(8,1),
    nombre_pieces_principales   SMALLINT,

    -- Nature de culture (pour terrains)
    code_nature_culture         TEXT,
    nature_culture              TEXT,
    code_nature_culture_speciale TEXT,
    nature_culture_speciale     TEXT,
    surface_terrain             NUMERIC(10,1),

    -- Coordonnées brutes fournies par DVF
    longitude                   NUMERIC(12,8),
    latitude                    NUMERIC(11,8),

    -- Métadonnées d'ingestion
    ingested_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_version              TEXT        NOT NULL,          -- ex: '2024-S1'
    hash_dedup                  TEXT        UNIQUE NOT NULL    -- SHA-256 du contenu pour déduplication
);

COMMENT ON TABLE  raw_dvf IS 'Données brutes DVF (data.gouv.fr) — immuables, append-only.';
COMMENT ON COLUMN raw_dvf.source_version IS 'Semestre DVF source, ex: 2024-S1.';
COMMENT ON COLUMN raw_dvf.hash_dedup     IS 'Empreinte SHA-256 de la ligne brute pour déduplication idempotente.';

-- -----------------------------------------------------------------------------
-- 3. TABLE transactions — DVF nettoyées, normalisées et géocodées
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS transactions (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Lien vers la donnée brute
    raw_dvf_id          UUID        NOT NULL REFERENCES raw_dvf(id) ON DELETE RESTRICT,

    -- Champs normalisés
    date_mutation       DATE        NOT NULL,
    type_local          TEXT        NOT NULL,      -- Appartement / Maison / Local / Terrain
    adresse_complete    TEXT,
    code_postal         CHAR(5),
    code_commune        CHAR(5),
    nom_commune         TEXT,
    code_departement    CHAR(3),

    -- Surfaces et caractéristiques
    surface_bati        NUMERIC(8,1) CHECK (surface_bati > 0),
    nombre_pieces       INTEGER,

    -- Prix
    valeur_fonciere     NUMERIC(12,2) NOT NULL,
    prix_m2             NUMERIC(10,2) GENERATED ALWAYS AS (
                            valeur_fonciere / NULLIF(surface_bati, 0)
                        ) STORED,

    -- Géolocalisation
    geom                GEOMETRY(Point, 4326),
    geocodage_score     NUMERIC(4,3)  CHECK (geocodage_score BETWEEN 0 AND 1),
    geocodage_source    TEXT          CHECK (geocodage_source IN ('api-adresse', 'cadastre', 'dvf-native')),

    -- Contrôle qualité
    is_outlier          BOOLEAN       NOT NULL DEFAULT FALSE,
    outlier_reason      TEXT,

    -- Métadonnées
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Contraintes métier
    CONSTRAINT chk_prix_m2_positif CHECK (valeur_fonciere > 0)
);

COMMENT ON TABLE  transactions IS 'Transactions DVF nettoyées, normalisées et géocodées. Données de référence pour le scoring.';
COMMENT ON COLUMN transactions.prix_m2           IS 'Colonne calculée automatiquement : valeur_fonciere / surface_bati.';
COMMENT ON COLUMN transactions.geocodage_score   IS 'Score de précision du géocodage entre 0 (faible) et 1 (exact).';
COMMENT ON COLUMN transactions.geocodage_source  IS 'Service utilisé pour le géocodage : api-adresse (BAN), cadastre ou coordonnées DVF natives.';
COMMENT ON COLUMN transactions.is_outlier        IS 'Marqueur outlier ; exclu des calculs de scoring par défaut.';

-- -----------------------------------------------------------------------------
-- 4. TABLE dpe — DPE ADEME
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dpe (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identifiant ADEME
    numero_dpe          TEXT        UNIQUE NOT NULL,

    -- Localisation textuelle
    adresse             TEXT,
    code_postal         CHAR(5),
    code_commune        CHAR(5),

    -- Géolocalisation
    geom                GEOMETRY(Point, 4326),

    -- Classes énergétiques
    classe_energie      CHAR(1)     NOT NULL CHECK (classe_energie IN ('A','B','C','D','E','F','G')),
    classe_ges          CHAR(1)     CHECK (classe_ges IN ('A','B','C','D','E','F','G')),
    valeur_conso_ep     NUMERIC(8,2),       -- kWh EP/m²/an

    -- Validité
    date_etablissement  DATE,
    date_expiration     DATE,

    -- Caractéristiques du bien
    surface_habitable   NUMERIC(8,1),
    type_batiment       TEXT,

    -- Métadonnées d'ingestion
    source_version      TEXT,               -- ex: 'ADEME-2024-Q4'
    ingested_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  dpe IS 'Diagnostics de Performance Énergétique ADEME. Utilisés pour le score risque énergétique.';
COMMENT ON COLUMN dpe.valeur_conso_ep IS 'Consommation en énergie primaire (kWh EP/m²/an).';

-- -----------------------------------------------------------------------------
-- 5. TABLE zones_iris — Zones INSEE IRIS avec géométries
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS zones_iris (
    code_iris           CHAR(9)     PRIMARY KEY,
    nom_iris            TEXT,
    code_commune        CHAR(5)     NOT NULL,
    nom_commune         TEXT,
    code_departement    CHAR(3),
    type_iris           TEXT,                  -- H (habitat), A (activité), D (divers), Z (commune non découpée)

    -- Géométrie officielle IGN
    geom                GEOMETRY(MultiPolygon, 4326) NOT NULL,

    -- Données socio-démographiques INSEE
    population          INTEGER,
    superficie_ha       NUMERIC(10,2),

    -- Millésime de la donnée
    source_annee        INTEGER     NOT NULL   -- ex: 2023
);

COMMENT ON TABLE  zones_iris IS 'Découpage IRIS INSEE avec géométries IGN. Référentiel zonal pour les indicateurs de tension et liquidité.';
COMMENT ON COLUMN zones_iris.type_iris IS 'H=Habitat, A=Activité, D=Divers, Z=Commune non découpée en IRIS.';

-- -----------------------------------------------------------------------------
-- 6. TABLE score_models — Versioning des modèles de scoring
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS score_models (
    id                          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identifiant sémantique
    version                     TEXT        UNIQUE NOT NULL,   -- ex: '1.0.0'
    description                 TEXT,

    -- Pondérations des 4 dimensions
    poids_valeur                NUMERIC(4,3) NOT NULL DEFAULT 0.400,
    poids_tension               NUMERIC(4,3) NOT NULL DEFAULT 0.300,
    poids_liquidite             NUMERIC(4,3) NOT NULL DEFAULT 0.200,
    poids_energie               NUMERIC(4,3) NOT NULL DEFAULT 0.100,

    -- Paramètres des comparables
    rayon_comparables_m         INTEGER     NOT NULL DEFAULT 500,
    fenetre_comparables_mois    INTEGER     NOT NULL DEFAULT 24,
    min_comparables             INTEGER     NOT NULL DEFAULT 5,

    -- État
    is_active                   BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Métadonnées
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contrainte : la somme des poids doit être exactement 1
    CONSTRAINT chk_poids_somme_unite CHECK (
        ROUND(poids_valeur + poids_tension + poids_liquidite + poids_energie, 3) = 1.000
    )
);

COMMENT ON TABLE  score_models IS 'Versioning des modèles de scoring. Permet la traçabilité et la reproductibilité des estimations.';
COMMENT ON COLUMN score_models.version IS 'Version sémantique du modèle, ex: 1.0.0.';
COMMENT ON COLUMN score_models.is_active IS 'Un seul modèle actif à la fois ; contrôlé par l application.';

-- -----------------------------------------------------------------------------
-- 7. TABLE estimations — Résultats de scoring versionnés (RGPD compliant)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS estimations (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Modèle utilisé
    score_model_id      UUID        NOT NULL REFERENCES score_models(id) ON DELETE RESTRICT,

    -- Input de la requête
    adresse_input       TEXT        NOT NULL,
    geom_input          GEOMETRY(Point, 4326),
    type_local          TEXT,
    surface_bati        NUMERIC(8,1),

    -- Comparables utilisés
    nb_comparables      INTEGER,

    -- Statistiques de prix
    prix_m2_min         NUMERIC(10,2),
    prix_m2_median      NUMERIC(10,2),
    prix_m2_max         NUMERIC(10,2),

    -- Scores par dimension (0-1)
    score_valeur        NUMERIC(5,3) CHECK (score_valeur    BETWEEN 0 AND 1),
    score_tension       NUMERIC(5,3) CHECK (score_tension   BETWEEN 0 AND 1),
    score_liquidite     NUMERIC(5,3) CHECK (score_liquidite BETWEEN 0 AND 1),
    score_energie       NUMERIC(5,3) CHECK (score_energie   BETWEEN 0 AND 1),
    score_global        NUMERIC(5,3) CHECK (score_global    BETWEEN 0 AND 1),

    -- Indice de confiance (dépend du nb de comparables, de la qualité géocodage…)
    confidence          NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),

    -- Horodatage du calcul
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Traçabilité RGPD : identifiant de la requête appelante (sans données personnelles)
    request_id          UUID
);

COMMENT ON TABLE  estimations IS 'Résultats de scoring versionnés. Chaque enregistrement est immuable pour la traçabilité RGPD.';
COMMENT ON COLUMN estimations.request_id IS 'Identifiant de la requête API pour audit RGPD. Ne contient aucune donnée personnelle.';
COMMENT ON COLUMN estimations.confidence  IS 'Indice de confiance global (0=faible, 1=élevé) basé sur le nb de comparables et la qualité du géocodage.';

-- -----------------------------------------------------------------------------
-- 8. TABLE comparables_used — Traçabilité des comparables par estimation
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS comparables_used (
    estimation_id           UUID        NOT NULL REFERENCES estimations(id)   ON DELETE RESTRICT,
    transaction_id          UUID        NOT NULL REFERENCES transactions(id)  ON DELETE RESTRICT,

    -- Métriques du comparable
    distance_m              NUMERIC(8,1) NOT NULL,
    prix_m2_comparable      NUMERIC(10,2) NOT NULL,
    poids_comparable        NUMERIC(5,4) NOT NULL,

    PRIMARY KEY (estimation_id, transaction_id)
);

COMMENT ON TABLE  comparables_used IS 'Détail des transactions utilisées comme comparables pour chaque estimation. Permet la reproductibilité et l audit.';
COMMENT ON COLUMN comparables_used.poids_comparable IS 'Poids de ce comparable dans la médiane pondérée (somme des poids = 1 pour une estimation donnée).';

-- -----------------------------------------------------------------------------
-- 9. TABLE audit_log — RGPD Audit Trail
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Catégorie et cible de l'événement
    event_type      TEXT        NOT NULL,   -- ex: 'DATA_ACCESS', 'ESTIMATION_REQUEST', 'INGESTION', 'MODEL_ACTIVATION'
    table_name      TEXT,
    record_id       UUID,
    action          TEXT,                   -- ex: 'READ', 'INSERT', 'UPDATE', 'DELETE'

    -- Contenu structuré de l'événement (sans données personnelles)
    details         JSONB,

    -- Contexte réseau (pseudonymisé côté application si nécessaire)
    ip_address      INET,
    user_agent      TEXT,

    -- Horodatage immuable
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  audit_log IS 'Journal d audit RGPD. Immuable — aucun UPDATE ni DELETE ne doit être accordé sur cette table.';
COMMENT ON COLUMN audit_log.event_type IS 'DATA_ACCESS | ESTIMATION_REQUEST | INGESTION | MODEL_ACTIVATION | OUTLIER_FLAG | …';

-- =============================================================================
-- INDEX
-- =============================================================================

-- ---- raw_dvf ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_raw_dvf_date_mutation     ON raw_dvf (date_mutation);
CREATE INDEX IF NOT EXISTS idx_raw_dvf_code_commune      ON raw_dvf (code_commune);
CREATE INDEX IF NOT EXISTS idx_raw_dvf_source_version    ON raw_dvf (source_version);
CREATE INDEX IF NOT EXISTS idx_raw_dvf_id_mutation       ON raw_dvf (id_mutation);

-- ---- transactions -----------------------------------------------------------
-- Spatial
CREATE INDEX IF NOT EXISTS idx_transactions_geom         ON transactions USING GIST (geom);

-- B-tree standards
CREATE INDEX IF NOT EXISTS idx_transactions_date         ON transactions (date_mutation);
CREATE INDEX IF NOT EXISTS idx_transactions_commune      ON transactions (code_commune);
CREATE INDEX IF NOT EXISTS idx_transactions_postal       ON transactions (code_postal);
CREATE INDEX IF NOT EXISTS idx_transactions_type_local   ON transactions (type_local);
CREATE INDEX IF NOT EXISTS idx_transactions_departement  ON transactions (code_departement);
CREATE INDEX IF NOT EXISTS idx_transactions_raw_dvf      ON transactions (raw_dvf_id);

-- Index partiel : uniquement les transactions non-outlier (utilisées dans les calculs)
CREATE INDEX IF NOT EXISTS idx_transactions_non_outlier  ON transactions (date_mutation, code_commune, type_local)
    WHERE is_outlier = FALSE;

-- ---- dpe --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dpe_geom                  ON dpe USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_dpe_commune_classe        ON dpe (code_commune, classe_energie);
CREATE INDEX IF NOT EXISTS idx_dpe_code_postal           ON dpe (code_postal);
CREATE INDEX IF NOT EXISTS idx_dpe_date_expiration       ON dpe (date_expiration);

-- ---- zones_iris -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_iris_geom                 ON zones_iris USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_iris_code_commune         ON zones_iris (code_commune);
CREATE INDEX IF NOT EXISTS idx_iris_code_dept            ON zones_iris (code_departement);

-- ---- estimations ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_estimations_computed_at   ON estimations (computed_at);
CREATE INDEX IF NOT EXISTS idx_estimations_geom_input    ON estimations USING GIST (geom_input);
CREATE INDEX IF NOT EXISTS idx_estimations_model         ON estimations (score_model_id);
CREATE INDEX IF NOT EXISTS idx_estimations_request_id    ON estimations (request_id);

-- ---- audit_log --------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type      ON audit_log (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id       ON audit_log (record_id) WHERE record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at      ON audit_log (created_at DESC);

-- ---- Recherche full-text par trigram (adresses) ----------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_adresse_trgm ON transactions USING GIN (adresse_complete gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dpe_adresse_trgm          ON dpe USING GIN (adresse gin_trgm_ops);

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO score_models (
    version,
    description,
    poids_valeur,
    poids_tension,
    poids_liquidite,
    poids_energie,
    rayon_comparables_m,
    fenetre_comparables_mois,
    min_comparables,
    is_active
) VALUES (
    '1.0.0',
    'Modèle initial AURESTATE — France métropolitaine. '
    'Pondération : Valeur marché 40%, Tension locale 30%, Liquidité 20%, Risque énergétique 10%.',
    0.400,
    0.300,
    0.200,
    0.100,
    500,
    24,
    5,
    TRUE
) ON CONFLICT (version) DO NOTHING;
