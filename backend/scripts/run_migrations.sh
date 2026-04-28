#!/bin/bash
set -e
psql "$DATABASE_URL" -f /app/migrations/001_initial.sql
psql "$DATABASE_URL" -f /app/migrations/002_functions.sql
echo "Migrations applied."
