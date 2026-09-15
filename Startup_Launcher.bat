@echo off
SETLOCAL EnableDelayedExpansion
title NexGen HR Payroll System - Startup Launcher

:: Set project root to the directory where this script is located
SET "PROJECT_ROOT=%~dp0"
SET "BACKEND_DIR=!PROJECT_ROOT!backend"
SET "FRONTEND_DIR=!PROJECT_ROOT!frontend"

echo.
echo  =====================================================
echo     NexGen HR Payroll System - Startup Launcher
echo  =====================================================
echo.
echo [INFO] Project Root : !PROJECT_ROOT!

:: 1. Check MySQL
echo [1/3] Checking MySQL on port 3307...
netstat -ano | findstr :3307 > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MySQL is NOT running on port 3307!
    echo [ERROR] Please start MySQL via XAMPP or your database manager.
    pause
    exit /b 1
)
echo [OK] MySQL is ready.

:: 2. Start Backend
echo [2/3] Starting Flask Backend in separate window...
start "NexGen - Backend" /d "!PROJECT_ROOT!" cmd /c "start_backend.bat"

:: Wait for Backend to be healthy
echo [INFO] Waiting for backend to initialize (this may take 10-15s)...
set "COUNT=0"
:WAIT_LOOP
set /a "COUNT+=1"
if !COUNT! gtr 30 (
    echo.
    echo [ERROR] Backend failed to start within 30 seconds.
    echo [ERROR] Please check the "NexGen - Backend" window for errors.
    pause
    exit /b 1
)

:: Use PowerShell to check the health endpoint
powershell -Command "$ProgressPreference = 'SilentlyContinue'; try { $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:5001/api/health' -UseBasicParsing -TimeoutSec 1; if ($resp.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" > nul 2>&1

if %errorlevel% neq 0 (
    set /p "temp=." <nul
    ping 127.0.0.1 -n 2 > nul
    goto WAIT_LOOP
)

echo.
echo [OK] Backend is healthy and responding.

:: 3. Start Frontend
echo [3/3] Starting Vite Frontend...
start "NexGen - Frontend" /d "!PROJECT_ROOT!" cmd /c "start_frontend.bat"

echo.
echo  =====================================================
echo     System is launching successfully!
echo  =====================================================
echo.
echo [ACCESS] Frontend Dashboard: http://localhost:3000
echo [ACCESS] Backend API Info:   http://localhost:5001/api/health
echo.
echo You can close this window now.
ping 127.0.0.1 -n 6 > nul
exit
