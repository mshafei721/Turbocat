# =============================================================================
# Turbocat Backend - Database Migration Script (PowerShell)
# =============================================================================
# Usage: .\scripts\migrate.ps1 [-Deploy] [-Reset] [-Status]
# =============================================================================

param(
    [switch]$Deploy,    # Deploy migrations (production)
    [switch]$Reset,     # Reset database (development only!)
    [switch]$Status,    # Show migration status
    [switch]$Generate   # Generate migration from schema changes
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Turbocat Backend - Migration Script" -ForegroundColor Cyan
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
Write-Host ""

# Verify database URL is set
if (-not $env:DATABASE_URL) {
    # Try to load from .env file
    if (Test-Path ".env") {
        Write-Host "Loading environment from .env file..." -ForegroundColor Yellow
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^([^#=]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim().Trim('"').Trim("'")
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
}

if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL in your .env file or environment" -ForegroundColor Red
    exit 1
}

# Show migration status
if ($Status) {
    Write-Host "Checking migration status..." -ForegroundColor Yellow
    npx prisma migrate status
    exit $LASTEXITCODE
}

# Reset database (development only)
if ($Reset) {
    if ($env -eq "production") {
        Write-Host "ERROR: Cannot reset database in production!" -ForegroundColor Red
        exit 1
    }

    Write-Host "WARNING: This will DELETE ALL DATA in the database!" -ForegroundColor Red
    $confirm = Read-Host "Type 'RESET' to confirm"
    if ($confirm -ne "RESET") {
        Write-Host "Reset cancelled." -ForegroundColor Yellow
        exit 0
    }

    Write-Host "Resetting database..." -ForegroundColor Yellow
    npx prisma migrate reset --force
    exit $LASTEXITCODE
}

# Generate migration
if ($Generate) {
    Write-Host "Generating migration from schema changes..." -ForegroundColor Yellow
    $migrationName = Read-Host "Enter migration name (e.g., add_user_preferences)"
    if (-not $migrationName) {
        Write-Host "ERROR: Migration name is required!" -ForegroundColor Red
        exit 1
    }
    npx prisma migrate dev --name $migrationName
    exit $LASTEXITCODE
}

# Deploy migrations (production mode)
if ($Deploy) {
    Write-Host "Deploying migrations to database..." -ForegroundColor Yellow
    Write-Host "This is a non-interactive deployment." -ForegroundColor Gray

    # Run migration deploy
    npx prisma migrate deploy

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Migration deployment failed!" -ForegroundColor Red
        exit 1
    }

    Write-Host "Migrations deployed successfully!" -ForegroundColor Green
    exit 0
}

# Default: development migration
Write-Host "Running development migration..." -ForegroundColor Yellow
npx prisma migrate dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Migration failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
