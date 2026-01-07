# =============================================================================
# Turbocat Backend - Build Script (PowerShell)
# =============================================================================
# Usage: .\scripts\build.ps1
# =============================================================================

param(
    [switch]$Clean,
    [switch]$Production
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Turbocat Backend - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set working directory to backend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
Set-Location $backendDir

Write-Host "[1/5] Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check if Node.js version is >= 20
$majorVersion = [int]($nodeVersion -replace 'v(\d+).*', '$1')
if ($majorVersion -lt 20) {
    Write-Host "ERROR: Node.js version 20 or higher is required!" -ForegroundColor Red
    exit 1
}

# Clean build directory if requested
if ($Clean) {
    Write-Host "[2/5] Cleaning previous build..." -ForegroundColor Yellow
    if (Test-Path "dist") {
        Remove-Item -Path "dist" -Recurse -Force
        Write-Host "Cleaned dist directory" -ForegroundColor Green
    }
} else {
    Write-Host "[2/5] Skipping clean (use -Clean flag to clean)" -ForegroundColor Gray
}

# Install dependencies
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Yellow
if ($Production) {
    npm ci --omit=dev
} else {
    npm ci
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed successfully" -ForegroundColor Green

# Generate Prisma client
Write-Host "[4/5] Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to generate Prisma client!" -ForegroundColor Red
    exit 1
}
Write-Host "Prisma client generated successfully" -ForegroundColor Green

# Build TypeScript
Write-Host "[5/5] Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: TypeScript build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "TypeScript build completed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Output directory: dist/" -ForegroundColor White
Write-Host "To start the server: npm run start" -ForegroundColor White
