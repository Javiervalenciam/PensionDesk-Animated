@echo off
echo ========================================
echo   PensiónDesk Local - Iniciando App
echo ========================================
echo.
echo Iniciando Backend en nueva ventana...
start "PensiónDesk Backend" cmd /k "cd /d %~dp0backend && python -m pip install fastapi uvicorn pydantic --quiet && python -m uvicorn main_simple:app --reload --port 8000 --host 0.0.0.0"
timeout /t 3 /nobreak >nul
echo.
echo Iniciando Frontend...
cd /d "%~dp0"
if not exist "node_modules" (
    echo Instalando dependencias npm...
    call npm install --legacy-peer-deps --prefer-offline
)
call npm run dev
pause
