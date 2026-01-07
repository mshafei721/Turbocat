#!/bin/bash
# =============================================================================
# Turbocat Backend - Rollback Script (Bash)
# =============================================================================
# Usage: ./scripts/rollback.sh [--steps <n>] [--to-version <version>] [--dry-run]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Default values
STEPS=1
TO_VERSION=""
DRY_RUN=false
SKIP_MIGRATION=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --steps)
            STEPS="$2"
            shift 2
            ;;
        --to-version)
            TO_VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-migration)
            SKIP_MIGRATION=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo -e "${CYAN}========================================"
echo "Turbocat Backend - Rollback Script"
echo -e "========================================${NC}"
echo ""

# Set working directory to backend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

# Check environment
ENV=${NODE_ENV:-development}
echo -e "${YELLOW}Environment: $ENV${NC}"
echo -e "${YELLOW}Dry Run: $DRY_RUN${NC}"
echo ""

# =============================================================================
# Function: Rollback Database Migration
# =============================================================================
rollback_migration() {
    local steps_to_rollback=$1

    echo -e "${YELLOW}Rolling back $steps_to_rollback migration(s)...${NC}"

    if [ "$DRY_RUN" = true ]; then
        echo -e "${GRAY}[DRY RUN] Would execute migration rollback${NC}"
        return
    fi

    echo -e "${RED}WARNING: Prisma does not support automatic rollback in production.${NC}"
    echo -e "${YELLOW}To rollback a migration, you need to:${NC}"
    echo "  1. Create a new migration that reverses the changes"
    echo "  2. Deploy the reverse migration"
    echo ""
    echo -e "${GRAY}For development, you can use: npx prisma migrate reset${NC}"
    echo ""

    # Show migration history
    echo -e "${CYAN}Current migration status:${NC}"
    npx prisma migrate status
}

# =============================================================================
# Function: Rollback Application Version
# =============================================================================
rollback_version() {
    local version=$1

    echo -e "${YELLOW}Rolling back to version: $version${NC}"

    if [ "$DRY_RUN" = true ]; then
        echo -e "${GRAY}[DRY RUN] Would execute: git checkout $version${NC}"
        return
    fi

    # Check if version exists
    if ! git tag -l "$version" | grep -q . && ! git rev-parse --verify "$version" &>/dev/null; then
        echo -e "${RED}ERROR: Version '$version' not found (not a valid tag or commit)${NC}"
        exit 1
    fi

    # Stash any local changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}Stashing local changes...${NC}"
        git stash push -m "Pre-rollback stash $(date '+%Y-%m-%d %H:%M:%S')"
    fi

    # Checkout the version
    git checkout "$version"

    # Rebuild
    echo -e "${YELLOW}Rebuilding application...${NC}"
    npm ci
    npm run db:generate
    npm run build

    echo -e "${GREEN}Rolled back to version $version${NC}"
}

# =============================================================================
# Function: Rollback to Previous Deployment
# =============================================================================
rollback_to_previous() {
    echo -e "${YELLOW}Rolling back to previous deployment...${NC}"

    if [ "$DRY_RUN" = true ]; then
        echo -e "${GRAY}[DRY RUN] Would rollback to previous git commit${NC}"
        return
    fi

    # Get current and previous commit
    current_commit=$(git rev-parse HEAD)
    previous_commit=$(git rev-parse HEAD~$STEPS)

    echo "Current commit:  $current_commit"
    echo "Rolling back to: $previous_commit"
    echo ""

    if [ "$FORCE" = false ]; then
        read -p "Proceed with rollback? (y/N) " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo -e "${YELLOW}Rollback cancelled.${NC}"
            exit 0
        fi
    fi

    # Checkout previous commit
    git checkout "$previous_commit"

    # Rebuild
    echo -e "${YELLOW}Rebuilding application...${NC}"
    npm ci
    npm run db:generate
    npm run build

    echo -e "${GREEN}Rolled back $STEPS commit(s)${NC}"
}

# =============================================================================
# Main Execution
# =============================================================================

# Safety check for production
if [ "$ENV" = "production" ]; then
    echo -e "${RED}WARNING: You are running rollback in PRODUCTION environment!${NC}"
    echo ""
    if [ "$FORCE" = false ]; then
        read -p "Type 'ROLLBACK' to confirm: " confirm
        if [ "$confirm" != "ROLLBACK" ]; then
            echo -e "${YELLOW}Rollback cancelled.${NC}"
            exit 0
        fi
    fi
fi

# Execute rollback
if [ -n "$TO_VERSION" ]; then
    rollback_version "$TO_VERSION"
else
    # Rollback code
    rollback_to_previous

    # Optionally rollback migrations
    if [ "$SKIP_MIGRATION" = false ]; then
        echo ""
        rollback_migration $STEPS
    fi
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Rollback process completed!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Verify the application is working: ./scripts/health-check.sh"
echo "  2. If using a deployment platform, trigger a re-deploy"
echo "  3. Monitor logs for any issues"
