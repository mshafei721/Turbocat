#!/bin/bash
# =============================================================================
# Turbocat Backend - Health Check Script (Bash)
# =============================================================================
# Usage: ./scripts/health-check.sh [--url <url>] [--timeout <seconds>] [--retry <count>]
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
URL="http://localhost:3001"
TIMEOUT=5
RETRY=3
RETRY_DELAY=2
DETAILED=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --retry)
            RETRY="$2"
            shift 2
            ;;
        --detailed)
            DETAILED=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo -e "${CYAN}========================================"
echo "Turbocat Backend - Health Check"
echo -e "========================================${NC}"
echo ""

HEALTH_ENDPOINT="$URL/health"
READY_ENDPOINT="$URL/health/ready"
LIVE_ENDPOINT="$URL/health/live"

check_endpoint() {
    local endpoint_url=$1
    local name=$2

    echo -e "${YELLOW}Checking $name endpoint: $endpoint_url${NC}"

    for i in $(seq 1 $RETRY); do
        response=$(curl -s -m $TIMEOUT -w "\n%{http_code}" "$endpoint_url" 2>/dev/null || echo "")
        http_code=$(echo "$response" | tail -n 1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" = "200" ]; then
            status=$(echo "$body" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || echo "")
            if [ "$status" = "healthy" ] || [ "$status" = "ok" ]; then
                echo -e "${GREEN}[PASS] $name check passed${NC}"
                if [ "$DETAILED" = true ] && [ -n "$body" ]; then
                    echo -e "${GRAY}  Response: $body${NC}"
                fi
                return 0
            else
                echo -e "${YELLOW}[WARN] $name returned unexpected status: $status${NC}"
            fi
        else
            if [ $i -lt $RETRY ]; then
                echo -e "${YELLOW}  Attempt $i/$RETRY failed, retrying in ${RETRY_DELAY}s...${NC}"
                sleep $RETRY_DELAY
            else
                echo -e "${RED}[FAIL] $name check failed after $RETRY attempts${NC}"
                return 1
            fi
        fi
    done
    return 1
}

ALL_PASSED=true

# Check liveness (is the server running?)
echo ""
if ! check_endpoint "$LIVE_ENDPOINT" "Liveness"; then
    ALL_PASSED=false
    echo ""
    echo -e "${RED}Server is not responding. Is it running?${NC}"
    echo -e "${YELLOW}Start the server with: npm run dev${NC}"
    exit 1
fi

# Check readiness (is the server ready to accept requests?)
echo ""
if ! check_endpoint "$READY_ENDPOINT" "Readiness"; then
    ALL_PASSED=false
fi

# Check detailed health
echo ""
echo -e "${YELLOW}Checking detailed health: $HEALTH_ENDPOINT${NC}"
health_response=$(curl -s -m $TIMEOUT "$HEALTH_ENDPOINT" 2>/dev/null || echo "")

if [ -n "$health_response" ]; then
    echo -e "${CYAN}[INFO] Health check response:${NC}"

    status=$(echo "$health_response" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
    uptime=$(echo "$health_response" | grep -o '"uptime"[[:space:]]*:[[:space:]]*[0-9.]*' | cut -d':' -f2 | tr -d ' ' || echo "unknown")
    timestamp=$(echo "$health_response" | grep -o '"timestamp"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    version=$(echo "$health_response" | grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || echo "")

    echo "  Status: $status"
    echo "  Uptime: ${uptime}s"
    echo "  Timestamp: $timestamp"
    if [ -n "$version" ]; then
        echo "  Version: $version"
    fi
else
    echo -e "${YELLOW}[WARN] Could not get detailed health info${NC}"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}All health checks passed!${NC}"
    exit 0
else
    echo -e "${RED}Some health checks failed!${NC}"
    exit 1
fi
