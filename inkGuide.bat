@echo off
title inkGuide - Your Book's Companion
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not found. Please install it from https://nodejs.org
  echo (Or download the single-file inkGuide.exe from https://inkguide.uk)
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run: installing packages, please wait...
  call npm install --no-audit --no-fund
)

echo.
echo  =============================================
echo   inkGuide is running.
echo   Browser: http://localhost:4321
echo   Closing this window stops the app.
echo   (Your writing is saved automatically.)
echo  =============================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:4321"
node server.js
pause
