# Multi-stage build para backend FastAPI
FROM python:3.11-slim as backend

WORKDIR /app/backend

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements y instalar dependencias Python
COPY bebidas-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY bebidas-api/ .

# Instalar gunicorn para producción
RUN pip install --no-cache-dir gunicorn

# Exponer puerto
EXPOSE 8000

# Comando para iniciar con gunicorn
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "main:app"]

---

# Para frontend, usar imagen node:20
FROM node:20-alpine

WORKDIR /app/frontend

# Copiar package.json y package-lock.json
COPY frontend/package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código del frontend
COPY frontend/ .

# Build de Next.js
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
