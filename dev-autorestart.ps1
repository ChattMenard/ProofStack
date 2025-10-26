# Auto-restart dev server when it crashes
$maxRestarts = 10
$restartCount = 0

Write-Host "Starting ProofStack dev server with auto-restart..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

while ($restartCount -lt $maxRestarts) {
    $restartCount++
    Write-Host "[$restartCount/$maxRestarts] Starting dev server..." -ForegroundColor Cyan
    
    # Start npm run dev using cmd
    & npm run dev
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "Dev server stopped normally." -ForegroundColor Green
        break
    } else {
        Write-Host "Dev server crashed with exit code $exitCode" -ForegroundColor Red
        Write-Host "Restarting in 2 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if ($restartCount -ge $maxRestarts) {
    Write-Host "Max restart attempts reached. Please check for errors." -ForegroundColor Red
}
