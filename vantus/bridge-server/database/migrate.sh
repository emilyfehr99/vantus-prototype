#!/bin/bash
# Database Migration Script
# Handles database migrations and updates

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Vantus Database Migration${NC}"
echo "=============================="
echo ""

# Check if migrations directory exists
if [ ! -d "migrations" ]; then
    echo -e "${YELLOW}Creating migrations directory...${NC}"
    mkdir -p migrations
fi

# List available migrations
echo "Available migrations:"
ls -1 migrations/*.sql 2>/dev/null || echo "No migrations found"

echo ""
echo "To create a new migration:"
echo "1. Create a file: migrations/YYYYMMDD_HHMMSS_description.sql"
echo "2. Add your SQL statements"
echo "3. Run this script to apply migrations"

# Apply pending migrations
if [ -n "$1" ]; then
    MIGRATION_FILE="$1"
    if [ -f "migrations/$MIGRATION_FILE" ]; then
        echo -e "${YELLOW}Applying migration: $MIGRATION_FILE${NC}"
        if [ -n "$DATABASE_URL" ]; then
            psql "$DATABASE_URL" -f "migrations/$MIGRATION_FILE"
        else
            psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-vantus}" -f "migrations/$MIGRATION_FILE"
        fi
        echo -e "${GREEN}Migration applied!${NC}"
    else
        echo -e "${RED}Migration file not found: migrations/$MIGRATION_FILE${NC}"
        exit 1
    fi
else
    echo ""
    echo "Usage: ./migrate.sh <migration_file.sql>"
fi
