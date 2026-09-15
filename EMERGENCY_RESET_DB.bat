@echo off
SETLOCAL EnableDelayedExpansion
title NexGen Payroll - EMERGENCY DATABASE RESET

SET "BACKEND_DIR=%~dp0backend"

echo.
echo  ================================================================
echo    NexGen Payroll - EMERGENCY DATABASE RESET
echo    This will WIPE all data and recreate the database from scratch.
echo    Use this ONLY if login is completely broken.
echo  ================================================================
echo.
echo  WARNING: All employee data, payroll records etc. will be deleted!
echo  The database will be rebuilt from the default seed data.
echo.
set /p CONFIRM="Type YES to confirm reset (anything else cancels): "
if /i "!CONFIRM!" neq "YES" (
    echo [CANCELLED] Database reset cancelled.
    pause
    exit /b 0
)

echo.
echo [INFO] Checking MySQL is running...
netstat -ano | findstr :3306 > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MySQL is NOT running on port 3306!
    echo [ERROR] Please start MySQL via XAMPP, then run this script again.
    pause
    exit /b 1
)

:: Detect python
where python > nul 2>&1
if %errorlevel% equ 0 (SET "PY_CMD=python") else (SET "PY_CMD=python3")

echo [INFO] Running fresh database initialization...
cd /d "%BACKEND_DIR%"
%PY_CMD% init_db_fresh.py

if %errorlevel% equ 0 (
    echo.
    echo  ================================================================
    echo    [SUCCESS] Database has been reset!
    echo.
    echo    Login credentials restored:
    echo      Username: admin      Password: admin123
    echo      Username: rahul      Password: password123
    echo  ================================================================
) else (
    echo.
    echo  [ERROR] Reset failed! Check that MySQL is running and accessible.
)
echo.
pause
