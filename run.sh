#!/bin/bash

# Script para iniciar la aplicación completa en Linux/Mac

echo ""
echo "==================================="
echo "   API POS Bebidas - Startup"
echo "==================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend
echo -e "${YELLOW}[1/2] Iniciando Backend (FastAPI)...${NC}"
echo ""
cd bebidas-api

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno y instalar dependencias
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# Iniciar servidor
echo -e "${GREEN}Backend iniciado en http://localhost:8000${NC}"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
sleep 3
cd ..

# Frontend
echo -e "${YELLOW}[2/2] Iniciando Frontend (Next.js)...${NC}"
echo ""
cd frontend

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install
fi

# Iniciar servidor
echo -e "${GREEN}Frontend iniciado en http://localhost:3000${NC}"
npm run dev &
FRONTEND_PID=$!
sleep 2
cd ..

echo ""
echo "==================================="
echo "    Aplicación iniciada!"
echo "==================================="
echo ""
echo -e "${GREEN}Backend:  http://localhost:8000${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Docs:     http://localhost:8000/docs${NC}"
echo ""
echo "Para detener:"
echo "  kill $BACKEND_PID  (Backend)"
echo "  kill $FRONTEND_PID (Frontend)"
echo ""

# Mantener script corriendo
wait
