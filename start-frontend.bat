@echo off
echo ========================================
echo   PensiónDesk Frontend - Iniciando
echo ========================================
cd /d "%~dp0"
echo Verificando dependencias npm...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install --legacy-peer-deps --prefer-offline
)
echo.
echo Iniciando servidor de desarrollo en http://localhost:3000
echo.
call npm run dev
pause
