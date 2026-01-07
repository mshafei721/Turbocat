# =============================================================================
# Turbocat Backend - Rollback Script (PowerShell)
# =============================================================================
# Usage: .\scripts\rollback.ps1 [-Steps <n>] [-ToVersion <version>] [-DryRun]
# =============================================================================

param(
    [int]$Steps = 1,           # Number of migrations to rollback
    [string]$ToVersion,        # Rollback to specific version (git tag or commit)
    [switch]$DryRun,           # Show what would be done without executing
    [switch]$SkipMigration,    # Skip database migration rollback
    [switch]$Force             # Force rollback without confirmation
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Turbocat Backend - Rollback Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set working directory to backend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
Set-Location $backendDir

# Check environment
$env = $env:NODE_ENV
if (-not $env) {
    $env = "development"
}

Write-Host "Environment: $env" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow
Write-Host ""

# =============================================================================
# Function: Rollback Database Migration
# =============================================================================
function Rollback-Migration {
    param([int]$StepsToRollback)

    Write-Host "Rolling back $StepsToRollback migration(s)..." -ForegroundColor Yellow

    if ($DryRun) {
        Write-Host "[DRY RUN] Would execute: npx prisma migrate rollback --steps $StepsToRollback" -ForegroundColor Gray
        return
    }

    # Note: Prisma doesn't have a built-in rollback command for production
    # You need to use migrate reset (dev only) or apply reverse migrations

    Write-Host "WARNING: Prisma does not support automatic rollback in production." -ForegroundColor Red
    Write-Host "To rollback a migration, you need to:" -ForegroundColor Yellow
    Write-Host "  1. Create a new migration that reverses the changes" -ForegroundColor White
    Write-Host "  2. Deploy the reverse migration" -ForegroundColor White
    Write-Host ""
    Write-Host "For development, you can use: npx prisma migrate reset" -ForegroundColor Gray
    Write-Host ""

    # Show migration history
    Write-Host "Current migration status:" -ForegroundColor Cyan
    npx prisma migrate status
}

# =============================================================================
# Function: Rollback Application Version
# =============================================================================
function Rollback-Version {
    param([string]$Version)

    Write-Host "Rolling back to version: $Version" -ForegroundColor Yellow

    if ($DryRun) {
        Write-Host "[DRY RUN] Would execute: git checkout $Version" -ForegroundColor Gray
        return
    }

    # Check if version exists
    $tagExists = git tag -l $Version 2>$null
    $commitExists = git rev-parse --verify $Version 2>$null

    if (-not $tagExists -and -not $commitExists) {
        Write-Host "ERROR: Version '$Version' not found (not a valid tag or commit)" -ForegroundColor Red
        exit 1
    }

    # Stash any local changes
    $hasChanges = git status --porcelain
    if ($hasChanges) {
        Write-Host "Stashing local changes..." -ForegroundColor Yellow
        git stash push -m "Pre-rollback stash $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }

    # Checkout the version
    git checkout $Version

    # Rebuild
    Write-Host "Rebuilding application..." -ForegroundColor Yellow
    npm ci
    npm run db:generate
    npm run build

    Write-Host "Rolled back to version $Version" -ForegroundColor Green
}

# =============================================================================
# Function: Rollback to Previous Deployment
# =============================================================================
function Rollback-ToPrevious {
    Write-Host "Rolling back to previous deployment..." -ForegroundColor Yellow

    if ($DryRun) {
        Write-Host "[DRY RUN] Would rollback to previous git commit" -ForegroundColor Gray
        return
    }

    # Get current and previous commit
    $currentCommit = git rev-parse HEAD
    $previousCommit = git rev-parse HEAD~$Steps

    Write-Host "Current commit:  $currentCommit" -ForegroundColor White
    Write-Host "Rolling back to: $previousCommit" -ForegroundColor White
    Write-Host ""

    if (-not $Force) {
        $confirm = Read-Host "Proceed with rollback? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Host "Rollback cancelled." -ForegroundColor Yellow
            exit 0
        }
    }

    # Checkout previous commit
    git checkout $previousCommit

    # Rebuild
    Write-Host "Rebuilding application..." -ForegroundColor Yellow
    npm ci
    npm run db:generate
    npm run build

    Write-Host "Rolled back $Steps commit(s)" -ForegroundColor Green
}

# =============================================================================
# Main Execution
# =============================================================================

# Safety check for production
if ($env -eq "production") {
    Write-Host "WARNING: You are running rollback in PRODUCTION environment!" -ForegroundColor Red
    Write-Host ""
    if (-not $Force) {
        $confirm = Read-Host "Type 'ROLLBACK' to confirm"
        if ($confirm -ne "ROLLBACK") {
            Write-Host "Rollback cancelled." -ForegroundColor Yellow
            exit 0
        }
    }
}

# Execute rollback
if ($ToVersion) {
    Rollback-Version -Version $ToVersion
} else {
    # Rollback code
    Rollback-ToPrevious

    # Optionally rollback migrations
    if (-not $SkipMigration) {
        Write-Host ""
        Rollback-Migration -StepsToRollback $Steps
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Rollback process completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify the application is working: .\scripts\health-check.ps1" -ForegroundColor White
Write-Host "  2. If using a deployment platform, trigger a re-deploy" -ForegroundColor White
Write-Host "  3. Monitor logs for any issues" -ForegroundColor White
