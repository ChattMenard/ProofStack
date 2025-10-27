<#
PowerShell helper: run skill level migration + tests against a Postgres database

Usage (PowerShell):
  # Option A: supply a full connection string
  .\run_skill_level_migration.ps1 -ConnectionString "postgres://user:password@db.example.com:5432/dbname"

  # Option B: rely on environment variables (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)
  $env:PGHOST = 'db.example.com'
  $env:PGPORT = '5432'
  $env:PGUSER = 'user'
  $env:PGPASSWORD = 'password'
  $env:PGDATABASE = 'dbname'
  .\run_skill_level_migration.ps1

Notes:
- Requires `psql` and `pg_dump` on PATH.
- This script will create a dump (backup) before applying migrations. The dump is stored next to this script with a timestamp.
- Files applied (in order):
  - supabase/migrations/20251027_skill_levels.sql
  - supabase/migrations/20251027_skill_levels_grants.sql
  - supabase/tests/skill_levels_test.sql
- Review the SQL files before running. Run in staging, not production.
#>

param(
    [string]$ConnectionString
)

Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir

function ExitWithError($msg) {
    Write-Error $msg
    Pop-Location
    exit 1
}

# Resolve connection target
if ($ConnectionString) {
    $psqlTarget = "-d `"$ConnectionString`""
    $pgDumpTarget = "--dbname=$ConnectionString"
} else {
    # rely on PG* env vars
    if (-not $env:PGHOST -or -not $env:PGUSER -or -not $env:PGDATABASE) {
        ExitWithError "No connection string supplied and one or more PG env vars missing (PGHOST, PGUSER, PGDATABASE)."
    }
    $psqlTarget = ""
    $pgDumpTarget = ""
}

# Files
$migration1 = Join-Path $scriptDir "..\supabase\migrations\20251027_skill_levels.sql" -Resolve
$migration2 = Join-Path $scriptDir "..\supabase\migrations\20251027_skill_levels_grants.sql" -Resolve
$testSql    = Join-Path $scriptDir "..\supabase\tests\skill_levels_test.sql" -Resolve

if (-not (Test-Path $migration1)) { ExitWithError "Migration file not found: $migration1" }
if (-not (Test-Path $migration2)) { ExitWithError "Migration file not found: $migration2" }
if (-not (Test-Path $testSql))    { ExitWithError "Test SQL file not found: $testSql" }

# Create a timestamped backup
$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$dumpFile = Join-Path $scriptDir "..\supabase\backups\skill_levels_backup_$timestamp.sql"
New-Item -ItemType Directory -Force -Path (Split-Path $dumpFile) | Out-Null

Write-Host "Creating DB dump to $dumpFile (this may take a while)..."
$pgDumpCmd = if ($ConnectionString) {
    "pg_dump $pgDumpTarget --format=custom -f `"$dumpFile`""
} else {
    "pg_dump --format=custom -f `"$dumpFile`""
}
Write-Host $pgDumpCmd
$pgdumpResult = & pg_dump @($pgDumpTarget, "--format=custom", "-f", $dumpFile) 2>&1
if ($LASTEXITCODE -ne 0) { ExitWithError "pg_dump failed: $pgdumpResult" }
Write-Host "Dump created."

# Apply migration 1
Write-Host "Applying migration: $migration1"
$apply1 = if ($ConnectionString) { & psql -d $ConnectionString -f $migration1 } else { & psql -f $migration1 }
if ($LASTEXITCODE -ne 0) { ExitWithError "Applying $migration1 failed. See output above." }
Write-Host "Migration 1 applied successfully."

# Apply migration 2
Write-Host "Applying migration: $migration2"
$apply2 = if ($ConnectionString) { & psql -d $ConnectionString -f $migration2 } else { & psql -f $migration2 }
if ($LASTEXITCODE -ne 0) { ExitWithError "Applying $migration2 failed. See output above." }
Write-Host "Migration 2 applied successfully."

# Run test SQL and capture results
$logFile = Join-Path $scriptDir "..\supabase\tests\skill_levels_test_result_$timestamp.log"
Write-Host "Running test SQL: $testSql (logging to $logFile)"
if ($ConnectionString) {
    & psql -d $ConnectionString -f $testSql | Tee-Object -FilePath $logFile
} else {
    & psql -f $testSql | Tee-Object -FilePath $logFile
}
if ($LASTEXITCODE -ne 0) { ExitWithError "Test SQL failed. Check $logFile" }

Write-Host "Test SQL completed. Results in: $logFile"

Pop-Location
Write-Host "All done. Review the log and the dump file before promoting to production."