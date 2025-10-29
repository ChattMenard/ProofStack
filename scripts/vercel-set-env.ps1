#!/usr/bin/env pwsh
<#
.SYNOPSIS
ProofStack Vercel Environment Variable Setup Script
Bulk-adds production environment variables to Vercel from .env.production.example or .env.production

.DESCRIPTION
This script reads env vars from a .env file and uploads them to Vercel using the Vercel CLI.
Supports interactive and non-interactive modes.

.PARAMETER EnvFile
Path to the .env file to read (default: .env.production)

.PARAMETER Environment
Vercel environment target: production, preview, or development (default: production)

.PARAMETER DryRun
If specified, shows what would be set without actually running vercel env add

.PARAMETER Confirm
If specified, prompts before adding each variable (default: true for production)

.EXAMPLE
# Add vars from .env.production to production environment
.\scripts\vercel-set-env.ps1

# Dry-run: show what would be set
.\scripts\vercel-set-env.ps1 -DryRun

# Add to preview environment
.\scripts\vercel-set-env.ps1 -Environment preview

# Silent mode (no confirmation prompts)
.\scripts\vercel-set-env.ps1 -Confirm:$false
#>

param(
    [string]$EnvFile = ".env.production",
    [string]$Environment = "production",
    [switch]$DryRun,
    [bool]$Confirm = $true
)

$ErrorActionPreference = "Stop"

# Colors for output
$Color_Info = "Cyan"
$Color_Success = "Green"
$Color_Warning = "Yellow"
$Color_Error = "Red"

function Write-Info { Write-Host "ℹ $args" -ForegroundColor $Color_Info }
function Write-Success { Write-Host "✓ $args" -ForegroundColor $Color_Success }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor $Color_Warning }
function Write-Error-Custom { Write-Host "✗ $args" -ForegroundColor $Color_Error }

# Verify Vercel CLI is installed
try {
    $null = vercel --version 2>&1
} catch {
    Write-Error-Custom "Vercel CLI not found. Install it with: npm install -g vercel"
    exit 1
}

# Check if project is linked
Write-Info "Checking if project is linked to Vercel..."
try {
    $null = vercel link --confirm 2>&1
    Write-Success "Project is linked to Vercel"
} catch {
    Write-Error-Custom "Project not linked to Vercel. Run 'vercel link' first."
    exit 1
}

# Verify env file exists
if (!(Test-Path $EnvFile)) {
    Write-Error-Custom "Env file not found: $EnvFile"
    Write-Info "Create it by copying: cp .env.production.example .env.production"
    exit 1
}

Write-Success "Using env file: $EnvFile"

# Parse .env file
$vars = @()
$comments = 0
$empty = 0

foreach ($line in Get-Content $EnvFile) {
    $trimmed = $line.Trim()
    
    # Skip comments and empty lines
    if ($trimmed.StartsWith("#") -or [string]::IsNullOrWhiteSpace($trimmed)) {
        if ($trimmed.StartsWith("#")) { $comments++ } else { $empty++ }
        continue
    }
    
    # Parse KEY=VALUE
    if ($trimmed -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove surrounding quotes if present
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        
        $vars += @{ Name = $key; Value = $value }
    }
}

Write-Success "Parsed $($vars.Count) variables from $EnvFile (skipped $comments comments, $empty empty lines)"

if ($vars.Count -eq 0) {
    Write-Warning "No variables found in $EnvFile"
    exit 0
}

# Show summary
Write-Host ""
Write-Info "Will add to Vercel environment: $Environment"
Write-Info "Variables to add:"
foreach ($var in $vars) {
    $displayValue = if ($var.Name.ToUpper().Contains("SECRET") -or $var.Name.ToUpper().Contains("KEY") -or $var.Name.ToUpper().Contains("TOKEN")) {
        "***" + $var.Value.Substring([Math]::Max(0, $var.Value.Length - 4))
    } else {
        $var.Value
    }
    Write-Host "  - $($var.Name) = $displayValue"
}

Write-Host ""
if ($DryRun) {
    Write-Warning "DRY-RUN mode: No changes will be made"
    exit 0
}

# Ask for confirmation if interactive
if ($Confirm) {
    $response = Read-Host "Continue? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Warning "Cancelled"
        exit 0
    }
}

# Add vars to Vercel
$added = 0
$skipped = 0
$failed = 0

foreach ($var in $vars) {
    try {
        Write-Host "Adding: $($var.Name)..." -ForegroundColor Cyan -NoNewline
        
        # Use vercel env add (may prompt for confirmation)
        # Suppress stderr to reduce noise
        $output = vercel env add $var.Name $var.Value $Environment 2>&1
        
        Write-Success ""
        $added++
    } catch {
        Write-Error-Custom " FAILED"
        Write-Host "  Error: $_"
        $failed++
    }
}

Write-Host ""
Write-Success "Summary:"
Write-Host "  Added: $added"
Write-Host "  Skipped: $skipped"
if ($failed -gt 0) {
    Write-Error-Custom "  Failed: $failed"
} else {
    Write-Success "  Failed: 0"
}

Write-Host ""
Write-Success "Environment variables have been set in Vercel!"
Write-Info "Next steps:"
Write-Host "  1. Verify variables in Vercel dashboard (Settings > Environment Variables)"
Write-Host "  2. Apply Supabase migrations: npx supabase db push"
Write-Host "  3. Deploy: vercel --prod"
Write-Host "  4. Run smoke tests on the deployed app"

exit 0
