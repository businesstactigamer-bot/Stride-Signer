@echo off
title Stride Sign - Mobile ATP Patient Signature App
echo ===================================================
echo     STRIDE MOBILITY - STRIDE SIGN (FIELD APP)
echo ===================================================
echo.
echo Starting local server on port 8080...
echo.

:: Check if python is available
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start http://localhost:8080
    python server.py
) else (
    echo Python was not found in PATH. Opening index.html directly...
    start index.html
)
pause
