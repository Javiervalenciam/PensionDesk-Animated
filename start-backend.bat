@echo off
echo ========================================
echo   PensiónDesk Backend - Iniciando
echo ========================================
cd /d "%~dp0backend"
echo Instalando dependencias Python...
python -m pip install fastapi uvicorn pydantic --quiet
echo.
echo Iniciando servidor en http://localhost:8000
echo.
python -m uvicorn main_simple:app --reload --port 8000 --host 0.0.0.0
pause
