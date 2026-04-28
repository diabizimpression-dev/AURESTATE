# AURESTATE Backend

API d'estimation immobilière (FastAPI + PostgreSQL/PostGIS + Redis).

## Démarrage

```bash
docker-compose up -d
```

Service API disponible sur `http://localhost:8000`.

## Migrations

```bash
docker-compose exec api bash /app/scripts/run_migrations.sh
```

Ou manuellement :

```bash
docker-compose exec db psql -U aurestate_user -d aurestate -f /migrations/001_initial.sql
docker-compose exec db psql -U aurestate_user -d aurestate -f /migrations/002_functions.sql
```

## Pipeline d'ingestion DVF

Lance le pipeline complet (download + ingest + promote) pour Paris (département 75) :

```bash
docker-compose exec api python -m app.pipeline.run_pipeline
```

Le worker exécute également le pipeline une fois au démarrage :

```bash
docker-compose up worker
```

## Endpoints

- `GET  /health` — Healthcheck (db + redis)
- `GET  /docs` — Documentation Swagger
- `POST /estimations` — Estimation d'un bien (adresse + surface + type)
- `GET  /estimations/{id}` — Récupération d'une estimation existante
- `GET  /transactions` — Recherche de transactions DVF
- `GET  /metrics` — Métriques Prometheus

## Stack

- Python 3.12 + FastAPI 0.115
- PostgreSQL 16 + PostGIS 3.4
- Redis 7
- asyncpg (bulk inserts) + SQLAlchemy 2 async (ORM)
- structlog (logs JSON)
