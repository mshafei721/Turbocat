# =============================================================================
# Turbocat Backend - Health Check Script (PowerShell)
# =============================================================================
# Usage: .\scripts\health-check.ps1 [-Url <url>] [-Timeout <seconds>] [-Retry <count>]
# =============================================================================

param(
    [string]$Url = "http://localhost:3001",
    [int]$Timeout = 5,
    [int]$Retry = 3,
    [int]$RetryDelay = 2,
    [switch]$Detailed
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Turbocat Backend - Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$healthEndpoint = "$Url/health"
$readyEndpoint = "$Url/health/ready"
$liveEndpoint = "$Url/health/live"

function Test-Endpoint {
    param(
        [string]$EndpointUrl,
        [string]$Name
    )

    Write-Host "Checking $Name endpoint: $EndpointUrl" -ForegroundColor Yellow

    for ($i = 1; $i -le $Retry; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $EndpointUrl -Method Get -TimeoutSec $Timeout -ErrorAction Stop

            if ($response.status -eq "healthy" -or $response.status -eq "ok") {
                Write-Host "[PASS] $Name check passed" -ForegroundColor Green
                if ($Detailed -and $response) {
                    Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
                }
                return $true
            } else {
                Write-Host "[WARN] $Name returned unexpected status: $($response.status)" -ForegroundColor Yellow
            }
        }
        catch {
            if ($i -lt $Retry) {
                Write-Host "  Attempt $i/$Retry failed, retrying in ${RetryDelay}s..." -ForegroundColor Yellow
                Start-Sleep -Seconds $RetryDelay
            } else {
                Write-Host "[FAIL] $Name check failed after $Retry attempts" -ForegroundColor Red
                Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
        }
    }
    return $false
}

$allPassed = $true

# Check liveness (is the server running?)
Write-Host ""
$liveResult = Test-Endpoint -EndpointUrl $liveEndpoint -Name "Liveness"
if (-not $liveResult) {
    $allPassed = $false
    Write-Host ""
    Write-Host "Server is not responding. Is it running?" -ForegroundColor Red
    Write-Host "Start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Check readiness (is the server ready to accept requests?)
Write-Host ""
$readyResult = Test-Endpoint -EndpointUrl $readyEndpoint -Name "Readiness"
if (-not $readyResult) {
    $allPassed = $false
}

# Check detailed health
Write-Host ""
Write-Host "Checking detailed health: $healthEndpoint" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $healthEndpoint -Method Get -TimeoutSec $Timeout

    Write-Host "[INFO] Health check response:" -ForegroundColor Cyan
    Write-Host "  Status: $($response.status)" -ForegroundColor White
    Write-Host "  Uptime: $($response.uptime)s" -ForegroundColor White
    Write-Host "  Timestamp: $($response.timestamp)" -ForegroundColor White

    if ($response.version) {
        Write-Host "  Version: $($response.version)" -ForegroundColor White
    }

    if ($response.services) {
        Write-Host "  Services:" -ForegroundColor White
        $response.services.PSObject.Properties | ForEach-Object {
            $status = $_.Value.status
            $color = if ($status -eq "healthy") { "Green" } elseif ($status -eq "degraded") { "Yellow" } else { "Red" }
            Write-Host "    - $($_.Name): $status" -ForegroundColor $color
        }
    }
}
catch {
    Write-Host "[WARN] Could not get detailed health info" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "All health checks passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some health checks failed!" -ForegroundColor Red
    exit 1
}
Write-Host "========================================" -ForegroundColor Cyan
