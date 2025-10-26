@echo off
REM Open ProofStack Local Development Server
echo.
echo 🚀 Starting ProofStack Dev Server...
echo.

cd /d "%~dp0"

REM Check if port 3000 is in use
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ✓ Dev server already running
) else (
    echo Starting dev server...
    start cmd /K "npm run dev"
    timeout /t 8 /nobreak
)

REM Open browser
echo 🌐 Opening http://localhost:3000 in browser...
start http://localhost:3000

echo ✓ Done!
