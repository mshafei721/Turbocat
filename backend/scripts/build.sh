#!/bin/bash
# =============================================================================
# Turbocat Backend - Build Script (Bash)
# =============================================================================
# Usage: ./scripts/build.sh [--clean] [--production]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
CLEAN=false
PRODUCTION=false

for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN=true
            shift
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
    esac
done

echo -e "${CYAN}========================================"
echo "Turbocat Backend - Build Script"
echo -e "========================================${NC}"
echo ""

# Set working directory to backend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

echo -e "${YELLOW}[1/5] Checking Node.js version...${NC}"
NODE_VERSION=$(node --version)
echo -e "${GREEN}Node.js version: $NODE_VERSION${NC}"

# Check if Node.js version is >= 20
MAJOR_VERSION=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
if [ "$MAJOR_VERSION" -lt 20 ]; then
    echo -e "${RED}ERROR: Node.js version 20 or higher is required!${NC}"
    exit 1
fi

# Clean build directory if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}[2/5] Cleaning previous build...${NC}"
    if [ -d "dist" ]; then
        rm -rf dist
        echo -e "${GREEN}Cleaned dist directory${NC}"
    fi
else
    echo -e "\033[0;37m[2/5] Skipping clean (use --clean flag to clean)${NC}"
fi

# Install dependencies
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
if [ "$PRODUCTION" = true ]; then
    npm ci --omit=dev
else
    npm ci
fi
echo -e "${GREEN}Dependencies installed successfully${NC}"

# Generate Prisma client
echo -e "${YELLOW}[4/5] Generating Prisma client...${NC}"
npm run db:generate
echo -e "${GREEN}Prisma client generated successfully${NC}"

# Build TypeScript
echo -e "${YELLOW}[5/5] Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}TypeScript build completed successfully${NC}"

echo ""
echo -e "${CYAN}========================================"
echo -e "${GREEN}Build completed successfully!"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "Output directory: dist/"
echo -e "To start the server: npm run start"
