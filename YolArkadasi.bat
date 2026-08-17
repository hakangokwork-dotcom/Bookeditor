@echo off
title Yol Arkadasi - Kitap Yazma Araci
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo HATA: Node.js bulunamadi. Lutfen https://nodejs.org adresinden kurun.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Ilk kurulum: paketler yukleniyor, lutfen bekleyin...
  call npm install --no-audit --no-fund
)

echo.
echo  =============================================
echo   Yol Arkadasi calisiyor.
echo   Tarayici: http://localhost:4321
echo   Bu pencereyi kapatinca uygulama durur.
echo   (Yazdiklariniz otomatik kaydedilir.)
echo  =============================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:4321"
node server.js
pause
