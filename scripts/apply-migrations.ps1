# Apply Supabase Migrations
# This script helps you apply database migrations to your Supabase project

Write-Host "🔧 Supabase Migration Helper" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    Write-Host "Please create .env.local with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

# Read Supabase URL from .env.local
$envContent = Get-Content ".env.local" -Raw
if ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)') {
    $supabaseUrl = $matches[1].Trim()
    $projectUrl = $supabaseUrl -replace '/v1', ''
    $sqlEditorUrl = "$projectUrl/project/default/sql"
} else {
    Write-Host "⚠️  Could not find NEXT_PUBLIC_SUPABASE_URL in .env.local" -ForegroundColor Yellow
    $sqlEditorUrl = "https://supabase.com/dashboard/project/_/sql"
}

# Get migration files
$migrationsDir = "supabase\migrations"
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name

Write-Host "📦 Found $($migrationFiles.Count) migration file(s):" -ForegroundColor Green
Write-Host ""

foreach ($file in $migrationFiles) {
    Write-Host "   • $($file.Name)" -ForegroundColor White
}

Write-Host ""
Write-Host "🌐 To apply these migrations:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Open your Supabase SQL Editor:" -ForegroundColor White
Write-Host "      $sqlEditorUrl" -ForegroundColor Blue
Write-Host ""
Write-Host "   2. Copy and paste each migration file's contents" -ForegroundColor White
Write-Host "   3. Run the SQL in order (003, then 004)" -ForegroundColor White
Write-Host ""

# Ask if user wants to see a migration
Write-Host "Would you like to see a migration file's contents? (Y/N) " -NoNewline -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "Select a migration:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $migrationFiles.Count; $i++) {
        Write-Host "   $($i + 1). $($migrationFiles[$i].Name)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Enter number (1-$($migrationFiles.Count)): " -NoNewline -ForegroundColor Yellow
    $selection = Read-Host
    
    if ($selection -match '^\d+$' -and [int]$selection -ge 1 -and [int]$selection -le $migrationFiles.Count) {
        $selectedFile = $migrationFiles[[int]$selection - 1]
        Write-Host ""
        Write-Host "📄 Contents of $($selectedFile.Name):" -ForegroundColor Green
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Gray
        Get-Content $selectedFile.FullName | ForEach-Object { Write-Host $_ -ForegroundColor White }
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 Copy the above SQL and paste it into your Supabase SQL Editor" -ForegroundColor Yellow
        Write-Host "   Then click 'RUN' to apply the migration" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Alternatively, you can:" -ForegroundColor Green
Write-Host "   • Use the Supabase CLI (install via npm or brew)" -ForegroundColor White
Write-Host "   • Use the Supabase dashboard's SQL editor" -ForegroundColor White
Write-Host "   • Run: node scripts/apply-migrations.js (if you have Node.js)" -ForegroundColor White
Write-Host ""
