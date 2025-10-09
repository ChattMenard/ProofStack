# PowerShell wrapper to run the Python task checker
$python = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' } elseif (Get-Command python -ErrorAction SilentlyContinue) { 'python' } else { Write-Error 'Python not found. Install Python and ensure py or python is on PATH.'; exit 1 }
& $python tools/check_tasks.py
