#!/bin/bash
# =============================================================================
# Turbocat Backend - Database Migration Script (Bash)
# =============================================================================
# Usage: ./scripts/migrate.sh [--deploy|--reset|--status|--generate]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
DEPLOY=false
RESET=false
STATUS=false
GENERATE=false

for arg in "$@"; do
    case $arg in
        --deploy)
            DEPLOY=true
            shift
            ;;
        --reset)
            RESET=true
            shift
            ;;
        --status)
            STATUS=true
            shift
            ;;
        --generate)
            GENERATE=true
            shift
            ;;
    esac
done

echo -e "${CYAN}========================================"
echo "Turbocat Backend - Migration Script"
echo -e "========================================${NC}"
echo ""

# Set working directory to backend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

# Check environment
ENV=${NODE_ENV:-development}
echo -e "${YELLOW}Environment: $ENV${NC}"
echo ""

# Load .env file if exists and DATABASE_URL not set
if [ -z "$DATABASE_URL" ] && [ -f ".env" ]; then
    echo -e "${YELLOW}Loading environment from .env file...${NC}"
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set!${NC}"
    echo -e "${RED}Please set DATABASE_URL in your .env file or environment${NC}"
    exit 1
fi

# Show migration status
if [ "$STATUS" = true ]; then
    echo -e "${YELLOW}Checking migration status...${NC}"
    npx prisma migrate status
    exit $?
fi

# Reset database (development only)
if [ "$RESET" = true ]; then
    if [ "$ENV" = "production" ]; then
        echo -e "${RED}ERROR: Cannot reset database in production!${NC}"
        exit 1
    fi

    echo -e "${RED}WARNING: This will DELETE ALL DATA in the database!${NC}"
    read -p "Type 'RESET' to confirm: " confirm
    if [ "$confirm" != "RESET" ]; then
        echo -e "${YELLOW}Reset cancelled.${NC}"
        exit 0
    fi

    echo -e "${YELLOW}Resetting database...${NC}"
    npx prisma migrate reset --force
    exit $?
fi

# Generate migration
if [ "$GENERATE" = true ]; then
    echo -e "${YELLOW}Generating migration from schema changes...${NC}"
    read -p "Enter migration name (e.g., add_user_preferences): " migration_name
    if [ -z "$migration_name" ]; then
        echo -e "${RED}ERROR: Migration name is required!${NC}"
        exit 1
    fi
    npx prisma migrate dev --name "$migration_name"
    exit $?
fi

# Deploy migrations (production mode)
if [ "$DEPLOY" = true ]; then
    echo -e "${YELLOW}Deploying migrations to database...${NC}"
    echo -e "\033[0;37mThis is a non-interactive deployment.${NC}"

    # Run migration deploy
    npx prisma migrate deploy

    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Migration deployment failed!${NC}"
        exit 1
    fi

    echo -e "${GREEN}Migrations deployed successfully!${NC}"
    exit 0
fi

# Default: development migration
echo -e "${YELLOW}Running development migration...${NC}"
npx prisma migrate dev

echo ""
echo -e "${CYAN}========================================"
echo -e "${GREEN}Migration completed successfully!"
echo -e "${CYAN}========================================${NC}"
