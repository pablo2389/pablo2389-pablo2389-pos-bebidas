# 🍹 API Bebidas - Sistema POS Completo

Sistema de punto de venta (POS) moderno y completo para kioskos de bebidas, con backend FastAPI y frontend Next.js.

## 📁 Estructura del Proyecto

```
Api bebidas/
├── bebidas-api/          # Backend FastAPI
│   ├── main.py          # Aplicación principal
│   ├── models.py        # Modelos Pydantic
│   ├── config.py        # Configuración
│   ├── requirements.txt  # Dependencias Python
│   ├── .env             # Variables de entorno
│   └── README.md        # Documentación backend
│
├── frontend/            # Frontend Next.js
│   ├── app/             # Páginas y componentes
│   ├── package.json     # Dependencias Node.js
│   ├── .env.local       # Variables de entorno frontend
│   └── README.md        # Documentación frontend
│
└── README.md            # Este archivo
```

## 🚀 Inicio Rápido

### Backend (FastAPI)

```bash
cd bebidas-api

# 1. Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar .env
cp .env.example .env
# Editar .env con tus credenciales Supabase

# 4. Ejecutar servidor
uvicorn main:app --reload
```

Backend disponible en: **http://localhost:8000**

### Frontend (Next.js)

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Crear .env.local si no existe
# NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Ejecutar en desarrollo
npm run dev
```

Frontend disponible en: **http://localhost:3000**

## 📚 Documentación

- [Backend - Documentación detallada](bebidas-api/README.md)
- [Frontend - Documentación detallada](frontend/README.md)
- API Swagger: http://localhost:8000/docs
- API ReDoc: http://localhost:8000/redoc

## ✨ Características

### Backend
✅ Autenticación JWT con bcrypt  
✅ API REST completa (CRUD)  
✅ Integración Supabase  
✅ Validación con Pydantic  
✅ CORS configurado  
✅ Documentación Swagger  

### Frontend
✅ Next.js 16 con App Router  
✅ React 19 con TypeScript  
✅ Tailwind CSS para estilos  
✅ Autenticación JWT  
✅ Dashboard con estadísticas  
✅ Gestión de productos y pedidos  
✅ Gráficas con Chart.js  
✅ PDF con jsPDF  

## 🔧 Configuración de Entorno

### Backend (.env)
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_clave_anonima
SECRET_KEY=tu_clave_secreta_muy_segura
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🌐 API Endpoints Principales

```
# Autenticación
POST   /auth/registrar
POST   /auth/login
GET    /usuarios/me

# Productos
GET    /productos
POST   /productos
PUT    /productos/{id}
DELETE /productos/{id}

# Pedidos
GET    /pedidos
POST   /pedidos
GET    /pedidos/{id}

# Estadísticas
GET    /estadisticas/diarias
GET    /estadisticas/top-productos

# Health
GET    /health
```

## 🛠 Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js 16 + React 19 |
| Lenguaje | Python 3.8+, TypeScript |
| Database | Supabase (PostgreSQL) |
| Autenticación | JWT + bcrypt |
| Estilos | Tailwind CSS |
| HTTP | Axios |
| Gráficas | Chart.js |

## 📦 Requisitos

- **Python 3.8+** (Backend)
- **Node.js 18+** (Frontend)
- **npm o yarn** (Frontend)
- **Cuenta Supabase** (Base de datos)

## 🚀 Deployment

### Backend (Producción)
```bash
# Opción 1: Heroku
git push heroku main

# Opción 2: Railway, Render, etc.
# Seguir instrucciones específicas de cada plataforma

# Opción 3: Docker
docker build -t api-bebidas .
docker run -p 8000:8000 api-bebidas
```

### Frontend (Producción)
```bash
# Opción 1: Vercel (recomendado)
vercel

# Opción 2: Netlify
netlify deploy

# Opción 3: Cualquier host estático
npm run build
npm start
```

## 🧪 Testing

```bash
# Backend
cd bebidas-api
pytest

# Frontend
cd frontend
npm test
```

## 🐛 Troubleshooting

### Backend no responde
- Verifica que uvicorn esté ejecutando: `uvicorn main:app --reload`
- Revisa que las variables de entorno estén configuradas
- Comprueba la conexión a Supabase

### Frontend no conecta
- Verifica NEXT_PUBLIC_API_URL en .env.local
- Comprueba que CORS esté habilitado en backend
- Abre DevTools (F12) y revisa errores en Network

### Errores de autenticación
- Limpia localStorage: `localStorage.clear()`
- Registra un nuevo usuario
- Verifica que SECRET_KEY sea consistente

## 📄 Licencia

Privado - No compartir sin autorización

## 👤 Autor

Proyecto desarrollado con ❤️

---

**¿Preguntas?** Revisa la documentación en cada carpeta o abre un issue.
