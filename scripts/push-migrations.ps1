# Quick Migration Application using Supabase CLI

Write-Host "🚀 Supabase Migration Pusher" -ForegroundColor Cyan
Write-Host ""

# Check if CLI is available
$cliCheck = npx supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host "Install with: npm install supabase --save-dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found (version: $cliCheck)" -ForegroundColor Green
Write-Host ""

# Check for migrations
$migrations = Get-ChildItem -Path "supabase\migrations" -Filter "*.sql" | Sort-Object Name
Write-Host "📦 Found $($migrations.Count) migration(s):" -ForegroundColor Cyan
foreach ($migration in $migrations) {
    Write-Host "   • $($migration.Name)" -ForegroundColor White
}
Write-Host ""

# Instructions
Write-Host "📋 To apply these migrations to your Supabase project:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Link and Push (Recommended)" -ForegroundColor White
Write-Host "   1. Get your project ref from Supabase dashboard" -ForegroundColor Gray
Write-Host "      (URL: https://YOUR-PROJECT-REF.supabase.co)" -ForegroundColor Gray
Write-Host "   2. Run: npx supabase link --project-ref YOUR-PROJECT-REF" -ForegroundColor Gray
Write-Host "   3. Enter your database password when prompted" -ForegroundColor Gray
Write-Host "   4. Run: npx supabase db push" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Direct Push with Connection String" -ForegroundColor White
Write-Host "   1. Get your connection string from Supabase dashboard" -ForegroundColor Gray
Write-Host "   2. Run: npx supabase db push --db-url 'postgresql://...'  " -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Manual Application (If above don't work)" -ForegroundColor White
Write-Host "   1. Open: https://supabase.com/dashboard/project/YOUR-PROJECT/sql" -ForegroundColor Gray
Write-Host "   2. Copy and paste each migration file's contents" -ForegroundColor Gray
Write-Host "   3. Run the SQL" -ForegroundColor Gray
Write-Host ""

# Offer to show migration
Write-Host "Would you like to:" -ForegroundColor Cyan
Write-Host "   [1] See instructions for linking your project" -ForegroundColor White
Write-Host "   [2] View a migration file" -ForegroundColor White
Write-Host "   [3] Exit" -ForegroundColor White
Write-Host ""
Write-Host "Enter choice (1-3): " -NoNewline -ForegroundColor Yellow
$choice = Read-Host

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔗 Linking Your Supabase Project:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Go to your Supabase dashboard" -ForegroundColor White
        Write-Host "2. Look at your project URL: https://XXX.supabase.co" -ForegroundColor White
        Write-Host "   The 'XXX' part is your project ref" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Run this command (replace XXX with your project ref):" -ForegroundColor White
        Write-Host "   npx supabase link --project-ref XXX" -ForegroundColor Green
        Write-Host ""
        Write-Host "4. When prompted, enter your database password" -ForegroundColor White
        Write-Host "   (Find it in: Settings → Database → Connection string)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "5. After linking, push migrations:" -ForegroundColor White
        Write-Host "   npx supabase db push" -ForegroundColor Green
        Write-Host ""
    }
    "2" {
        Write-Host ""
        for ($i = 0; $i -lt $migrations.Count; $i++) {
            Write-Host "   [$($i + 1)] $($migrations[$i].Name)" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Select migration (1-$($migrations.Count)): " -NoNewline -ForegroundColor Yellow
        $sel = Read-Host
        
        if ($sel -match '^\d+$' -and [int]$sel -ge 1 -and [int]$sel -le $migrations.Count) {
            $file = $migrations[[int]$sel - 1]
            Write-Host ""
            Write-Host "📄 $($file.Name):" -ForegroundColor Green
            Write-Host "════════════════════════════════════════" -ForegroundColor Gray
            Get-Content $file.FullName | Select-Object -First 50 | ForEach-Object { Write-Host $_ -ForegroundColor White }
            Write-Host "... (truncated, see full file for complete SQL)" -ForegroundColor Gray
            Write-Host "════════════════════════════════════════" -ForegroundColor Gray
        }
    }
    "3" {
        Write-Host "👋 Exiting" -ForegroundColor Gray
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
