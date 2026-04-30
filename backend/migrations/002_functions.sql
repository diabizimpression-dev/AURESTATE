-- =============================================================================
-- AURESTATE - Migration 002 : Fonctions et vues PostgreSQL
-- Version     : 1.0.0
-- Base        : PostgreSQL 16 + PostGIS 3.4
-- Dépendances : 001_initial.sql
-- =============================================================================

-- =============================================================================
-- 1. FONCTION get_comparables
--    Retourne les transactions comparables triées par distance croissante.
--
--    Paramètres :
--      p_geom    — point de référence (EPSG:4326)
--      p_type    — type de local ciblé (ex: 'Appartement', 'Maison'…)
--      p_surface — surface bâtie du bien cible (m²)
--      p_rayon   — rayon de recherche en mètres
--      p_mois    — fenêtre temporelle en mois (à partir d'aujourd'hui)
--
--    Retourne une table avec toutes les colonnes utiles pour le scoring,
--    ordonnée par distance ASC.
--
--    Note : la tolérance de surface (±40 %) est configurable via p_surface ;
--    si p_surface IS NULL, le filtre de surface est ignoré.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_comparables(
    p_geom    GEOMETRY,
    p_type    TEXT,
    p_surface NUMERIC,
    p_rayon   INTEGER DEFAULT 500,
    p_mois    INTEGER DEFAULT 24
)
RETURNS TABLE (
    transaction_id      UUID,
    date_mutation       DATE,
    type_local          TEXT,
    adresse_complete    TEXT,
    code_commune        CHAR(5),
    code_postal         CHAR(5),
    surface_bati        NUMERIC(8,1),
    nombre_pieces       INTEGER,
    valeur_fonciere     NUMERIC(12,2),
    prix_m2             NUMERIC(10,2),
    distance_m          NUMERIC(8,1),
    geocodage_score     NUMERIC(4,3),
    geom                GEOMETRY
)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
    SELECT
        t.id                    AS transaction_id,
        t.date_mutation,
        t.type_local,
        t.adresse_complete,
        t.code_commune,
        t.code_postal,
        t.surface_bati,
        t.nombre_pieces,
        t.valeur_fonciere,
        t.prix_m2,
        -- Distance en mètres via transformation en Lambert-93 (EPSG:2154)
        -- pour une précision métrique sur la France métropolitaine
        ROUND(
            ST_Distance(
                ST_Transform(t.geom,  2154),
                ST_Transform(p_geom,  2154)
            )::NUMERIC,
            1
        )                       AS distance_m,
        t.geocodage_score,
        t.geom
    FROM transactions t
    WHERE
        -- Exclusion des outliers
        t.is_outlier = FALSE

        -- Présence obligatoire de la géométrie et du prix au m²
        AND t.geom    IS NOT NULL
        AND t.prix_m2 IS NOT NULL

        -- Type de local identique
        AND t.type_local = p_type

        -- Fenêtre temporelle
        AND t.date_mutation >= (CURRENT_DATE - (p_mois || ' months')::INTERVAL)::DATE

        -- Rayon spatial (ST_DWithin sur géographies pour précision métrique)
        AND ST_DWithin(
                t.geom::GEOGRAPHY,
                p_geom::GEOGRAPHY,
                p_rayon            -- mètres
            )

        -- Filtre de surface ±40 % (ignoré si p_surface IS NULL)
        AND (
            p_surface IS NULL
            OR (
                t.surface_bati IS NOT NULL
                AND t.surface_bati BETWEEN p_surface * 0.60
                                       AND p_surface * 1.40
            )
        )

    ORDER BY distance_m ASC;
$$;

COMMENT ON FUNCTION get_comparables(GEOMETRY, TEXT, NUMERIC, INTEGER, INTEGER) IS
'Retourne les transactions comparables non-outlier situées dans un rayon p_rayon mètres,
du même type de local, sur la fenêtre temporelle p_mois.
Si p_surface est fourni, filtre les biens à ±40 % de la surface cible.
Résultats triés par distance croissante.';


-- =============================================================================
-- 2. FONCTION compute_prix_m2_stats
--    Calcule les statistiques de distribution du prix au m² à partir
--    d'un tableau d'identifiants de transactions.
--
--    Retourne : (min, p25, median, p75, max, avg, stddev, count)
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_prix_m2_stats(
    p_transaction_ids UUID[]
)
RETURNS TABLE (
    prix_m2_min     NUMERIC(10,2),
    prix_m2_p25     NUMERIC(10,2),
    prix_m2_median  NUMERIC(10,2),
    prix_m2_p75     NUMERIC(10,2),
    prix_m2_max     NUMERIC(10,2),
    prix_m2_avg     NUMERIC(10,2),
    prix_m2_stddev  NUMERIC(10,2),
    nb_transactions INTEGER
)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
    SELECT
        ROUND(MIN(t.prix_m2),  2)                                           AS prix_m2_min,
        ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY t.prix_m2), 2)  AS prix_m2_p25,
        ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY t.prix_m2), 2)  AS prix_m2_median,
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY t.prix_m2), 2)  AS prix_m2_p75,
        ROUND(MAX(t.prix_m2),  2)                                           AS prix_m2_max,
        ROUND(AVG(t.prix_m2),  2)                                           AS prix_m2_avg,
        ROUND(STDDEV(t.prix_m2), 2)                                         AS prix_m2_stddev,
        COUNT(*)::INTEGER                                                    AS nb_transactions
    FROM transactions t
    WHERE
        t.id       = ANY(p_transaction_ids)
        AND t.prix_m2 IS NOT NULL
        AND t.is_outlier = FALSE;
$$;

COMMENT ON FUNCTION compute_prix_m2_stats(UUID[]) IS
'Calcule min, P25, médiane, P75, max, moyenne et écart-type du prix au m²
pour un ensemble de transactions identifiées par leurs UUID.
Les outliers et les enregistrements sans prix_m2 sont exclus du calcul.';


-- =============================================================================
-- 3. VUE v_transactions_recent
--    Transactions des 24 derniers mois, non outliers, géocodées.
--    Point d'entrée standard pour les calculs de scoring courant.
-- =============================================================================

CREATE OR REPLACE VIEW v_transactions_recent AS
SELECT
    t.id,
    t.raw_dvf_id,
    t.date_mutation,
    t.type_local,
    t.adresse_complete,
    t.code_postal,
    t.code_commune,
    t.nom_commune,
    t.code_departement,
    t.surface_bati,
    t.nombre_pieces,
    t.valeur_fonciere,
    t.prix_m2,
    t.geom,
    t.geocodage_score,
    t.geocodage_source,
    t.created_at,
    -- Ancienneté en mois (utile pour pondération temporelle)
    DATE_PART('month', AGE(CURRENT_DATE, t.date_mutation))::INTEGER
        + DATE_PART('year',  AGE(CURRENT_DATE, t.date_mutation))::INTEGER * 12
        AS anciennete_mois
FROM transactions t
WHERE
    t.is_outlier    = FALSE
    AND t.geom      IS NOT NULL
    AND t.prix_m2   IS NOT NULL
    AND t.date_mutation >= (CURRENT_DATE - INTERVAL '24 months')::DATE;

COMMENT ON VIEW v_transactions_recent IS
'Transactions DVF des 24 derniers mois, filtrées : non-outlier, géocodées,
avec prix_m2 calculé. Vue de référence pour les algorithmes de scoring AURESTATE.
La colonne anciennete_mois facilite la pondération temporelle des comparables.';


-- =============================================================================
-- 4. FONCTION UTILITAIRE : get_active_model
--    Retourne le modèle de scoring actuellement actif.
--    Lève une exception si aucun modèle actif n'est défini.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_active_model()
RETURNS score_models
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_model score_models;
BEGIN
    SELECT *
    INTO   v_model
    FROM   score_models
    WHERE  is_active = TRUE
    LIMIT  1;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'AURESTATE: aucun modèle de scoring actif. '
            'Définissez is_active = TRUE sur un enregistrement de score_models.';
    END IF;

    RETURN v_model;
END;
$$;

COMMENT ON FUNCTION get_active_model() IS
'Retourne la ligne score_models dont is_active = TRUE. '
'Lève une exception explicite si aucun modèle actif n''est configuré.';


-- =============================================================================
-- 5. FONCTION UTILITAIRE : log_audit
--    Insère un événement dans audit_log. Appeler depuis l'application
--    ou depuis d'autres fonctions pour garantir la traçabilité RGPD.
-- =============================================================================

CREATE OR REPLACE FUNCTION log_audit(
    p_event_type  TEXT,
    p_table_name  TEXT     DEFAULT NULL,
    p_record_id   UUID     DEFAULT NULL,
    p_action      TEXT     DEFAULT NULL,
    p_details     JSONB    DEFAULT NULL,
    p_ip_address  INET     DEFAULT NULL,
    p_user_agent  TEXT     DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO audit_log (
        event_type,
        table_name,
        record_id,
        action,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_event_type,
        p_table_name,
        p_record_id,
        p_action,
        p_details,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

COMMENT ON FUNCTION log_audit(TEXT, TEXT, UUID, TEXT, JSONB, INET, TEXT) IS
'Insère un événement dans audit_log et retourne son UUID. '
'Utilisé par l''application et les autres fonctions pour la traçabilité RGPD.';
