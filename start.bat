@echo off
title Finance Analysis System
echo ================================
echo   Finance Analysis System
echo ================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python and add to PATH.
    pause
    exit /b 1
)

if exist "requirements.txt" (
    echo [1/3] Installing dependencies...
    pip install -r requirements.txt -q --disable-pip-version-check
)

echo [2/3] Starting Flask server...
echo [3/3] Open: http://127.0.0.1:5000
echo.
python app.py
pause
