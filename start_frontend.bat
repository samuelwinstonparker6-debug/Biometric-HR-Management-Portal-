@echo off
SETLOCAL EnableDelayedExpansion
title NexGen Payroll - Frontend (Vite)

:: Use absolute-relative path for the frontend directory
SET "FRONTEND_DIR=%~dp0frontend"
if not exist "!FRONTEND_DIR!" (
    SET "FRONTEND_DIR=%~dp0"
)

echo.
echo  ====================================
echo    Starting Frontend Dashboard
echo  ====================================
echo.

if not exist "!FRONTEND_DIR!\node_modules" (
    echo [INFO] Installing npm dependencies...
    cd /d "!FRONTEND_DIR!"
    npm install
)

echo [INFO] Starting Vite on http://localhost:3000
echo [INFO] Make sure backend is running on port 5001!
echo.
cd /d "!FRONTEND_DIR!"
npm run dev
pause
