@echo off
REM Script para iniciar la aplicación completa en Windows

echo.
echo ===================================
echo    API POS Bebidas - Startup
echo ===================================
echo.

REM Colores (limitados en Windows)
setlocal enabledelayedexpansion

echo [1/2] Iniciando Backend (FastAPI)...
echo.
cd bebidas-api
start "Backend - FastAPI" cmd /k "python -m venv venv 2>nul & venv\Scripts\activate & pip install -r requirements.txt >nul 2>&1 & uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak
cd ..

echo [2/2] Iniciando Frontend (Next.js)...
echo.
cd frontend
if not exist node_modules (
    echo Instalando dependencias...
    call npm install
)
start "Frontend - Next.js" cmd /k "npm run dev"
cd ..

echo.
echo ===================================
echo    Aplicación iniciada!
echo ===================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Docs:     http://localhost:8000/docs
echo.
echo Presiona Ctrl+C en cada ventana para detener
echo.
