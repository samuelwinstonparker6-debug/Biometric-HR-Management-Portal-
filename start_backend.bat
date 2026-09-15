@echo off
SETLOCAL EnableDelayedExpansion
title NexGen Payroll - Backend Server

SET "BACKEND_DIR=%~dp0backend"
if not exist "!BACKEND_DIR!" SET "BACKEND_DIR=%~dp0"

echo.
echo  ====================================
echo    Starting Backend Server
echo  ====================================
echo.

:: Detect python
where python > nul 2>&1
if !errorlevel! equ 0 (
    set "PY_CMD=python"
) else (
    set "PY_CMD=python3"
)

:: Kill any old process on port 5001 using PowerShell (more robust)
echo [INFO] Cleaning up port 5001...
powershell -Command "$p = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host 'Killed process on 5001' }"

:: 2. Install/Verify requirements
if exist "!BACKEND_DIR!\requirements.txt" (
    echo [INFO] Verifying Python packages...
    !PY_CMD! -c "import flask, flask_cors, mysql.connector, pandas, openpyxl" > nul 2>&1
    if !errorlevel! neq 0 (
        echo [INFO] Installing missing packages...
        !PY_CMD! -m pip install -r "!BACKEND_DIR!\requirements.txt" --quiet --disable-pip-version-check
    ) else (
        echo [OK] All packages are installed.
    )
)

echo [INFO] Starting Flask backend...
cd /d "!BACKEND_DIR!"
!PY_CMD! app.py
if !errorlevel! neq 0 (
    echo [ERROR] Backend failed with code !errorlevel!
    pause
)
