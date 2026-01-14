#!/bin/bash
# Database Deployment Script
# Deploys the Vantus database schema to PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-vantus}"
DB_USER="${DB_USER:-postgres}"
SCHEMA_FILE="schema.sql"

echo -e "${GREEN}Vantus Database Deployment${NC}"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Using DATABASE_URL environment variable${NC}"
    export PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    psql "$DATABASE_URL" -f "$SCHEMA_FILE"
else
    # Check if PGPASSWORD is set
    if [ -z "$PGPASSWORD" ]; then
        echo -e "${YELLOW}PGPASSWORD not set. Please enter database password:${NC}"
        read -s PGPASSWORD
        export PGPASSWORD
    fi

    echo "Database: $DB_NAME"
    echo "Host: $DB_HOST"
    echo "Port: $DB_PORT"
    echo "User: $DB_USER"
    echo ""

    # Check if database exists
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${GREEN}Database '$DB_NAME' exists${NC}"
    else
        echo -e "${YELLOW}Database '$DB_NAME' does not exist. Creating...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
        echo -e "${GREEN}Database created${NC}"
    fi

    # Deploy schema
    echo -e "${YELLOW}Deploying schema...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Schema deployed successfully!${NC}"
    else
        echo -e "${RED}Schema deployment failed!${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
