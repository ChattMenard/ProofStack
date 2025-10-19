# Vercel Build Control Script
# Exit 0 = Don't build, Exit 1 = Build

# Get the latest commit message
$commitMessage = git log -1 --pretty=%B

# Check for [deploy] or [build] tag
if ($commitMessage -match "\[(deploy|build)\]") {
    Write-Host "✅ Deploy tag found in commit - Building..." -ForegroundColor Green
    exit 1
}

# Check if only markdown files changed
$changedFiles = git diff HEAD~1 HEAD --name-only
$nonMdFiles = $changedFiles | Where-Object { $_ -notmatch '\.md$' }

if ($nonMdFiles.Count -eq 0) {
    Write-Host "📄 Only documentation changed - Skipping build" -ForegroundColor Yellow
    exit 0
}

# Check if migrations changed (don't deploy until manual migration)
$migrationChanged = $changedFiles | Where-Object { $_ -match 'supabase/migrations/' }
if ($migrationChanged -and ($commitMessage -notmatch "\[deploy\]")) {
    Write-Host "⚠️  Database migration detected without [deploy] tag - Skipping build" -ForegroundColor Yellow
    Write-Host "   Run migration in Supabase first, then commit with [deploy] tag" -ForegroundColor Cyan
    exit 0
}

# Default: Build
Write-Host "🚀 Code changes detected - Building..." -ForegroundColor Green
exit 1
