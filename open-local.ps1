# Open ProofStack Local Development Server
Write-Host "🚀 Starting ProofStack Dev Server..." -ForegroundColor Green

# Check if npm run dev is already running
$port = 3000

# Check if server is running
$testConnection = Test-Connection -ComputerName localhost -TCPPort $port -Quiet 2>$null

if ($testConnection) {
    Write-Host "✓ Dev server already running" -ForegroundColor Yellow
}
else {
    Write-Host "Starting dev server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev" -PassThru | Out-Null
    Start-Sleep -Seconds 8
}

# Open browser
Write-Host "🌐 Opening http://localhost:$port in browser..." -ForegroundColor Green
Start-Process "http://localhost:$port"

Write-Host "✓ Done!" -ForegroundColor Green
