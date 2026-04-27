# 🚀 API POS Bebidas - Backend

API REST completa para un sistema de punto de venta con integración Supabase.

## 📋 Requisitos

- Python 3.8+
- pip (gestor de paquetes)
- Variables de entorno configuradas (.env)
- Supabase account y proyecto

## ⚙️ Instalación

### 1. Crear entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar ambiente (.env)

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_clave_anonima
SECRET_KEY=tu_clave_secreta_segura
```

## 🏃 Iniciar el servidor

```bash
# Modo desarrollo (con recarga automática)
uvicorn main:app --reload

# Modo producción
uvicorn main:app --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: **http://localhost:8000**

## 📚 Documentación API

Una vez corriendo el servidor, accede a:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 Endpoints principales

### Autenticación
- `POST /auth/registrar` - Registrar nuevo usuario
- `POST /auth/login` - Login y obtener token JWT
- `GET /usuarios/me` - Obtener usuario actual

### Productos
- `GET /productos` - Listar todos los productos
- `GET /productos/{id}` - Obtener producto específico
- `POST /productos` - Crear nuevo producto
- `PUT /productos/{id}` - Actualizar producto
- `DELETE /productos/{id}` - Eliminar producto

### Pedidos/Ventas
- `GET /pedidos` - Listar pedidos
- `GET /pedidos/{id}` - Obtener pedido específico
- `POST /pedidos` - Crear nuevo pedido

### Estadísticas
- `GET /estadisticas/diarias` - Estadísticas del día
- `GET /estadisticas/top-productos` - Productos más vendidos

### Health Check
- `GET /health` - Verificar estado de la API

## 🛠 Tecnologías

- **FastAPI** - Framework web
- **Uvicorn** - ASGI server
- **Supabase** - Database y Auth
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Pydantic** - Validación de datos

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- JWT para autenticación
- CORS configurado
- Validación de tokens en endpoints protegidos

## 📝 Desarrollo

Para desarrollo local:

```bash
# Instalar con entorno virtual
python -m venv venv
source venv/bin/activate  # o venv\Scripts\activate en Windows
pip install -r requirements.txt

# Ejecutar servidor
uvicorn main:app --reload --port 8000
```

## 🚀 Deployment

Para producción, usa Gunicorn o similar:

```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

## 📦 Dependencies

Ver `requirements.txt` para la lista completa de dependencias.

## 📄 Licencia

Este proyecto es privado. No compartir sin autorización.

### Documentación interactiva (Swagger UI)
**http://localhost:8000/docs**

## 📚 Endpoints principales

### Health Check
- `GET /health` - Verificar que la API funciona

### Autenticación
- `POST /auth/registrar` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /usuarios/me` - Obtener usuario autenticado

### Productos
- `GET /productos` - Listar productos
- `GET /productos/{id}` - Obtener producto
- `POST /productos` - Crear producto
- `PUT /productos/{id}` - Actualizar producto
- `DELETE /productos/{id}` - Eliminar producto

### Pedidos
- `GET /pedidos` - Listar pedidos
- `GET /pedidos/{id}` - Obtener pedido
- `POST /pedidos` - Crear pedido

### Estadísticas
- `GET /estadisticas/diarias` - Estadísticas del día
- `GET /estadisticas/top-productos` - Top 5 productos vendidos

## 🗂️ Estructura de archivos

```
bebidas-api/
├── main.py              # Aplicación FastAPI principal
├── models.py            # Modelos Pydantic
├── config.py            # Configuración centralizada
├── supabase_client.py   # Cliente Supabase
├── requirements.txt     # Dependencias Python
├── .env                 # Variables de entorno
└── __init__.py          # Package identifier
```

## 🔒 Seguridad

- Todos los endpoints usan CORS abierto (⚠️ cambiar en producción)
- JWT con expiración de 7 días
- Contraseñas hasheadas con bcrypt
- Variables sensibles en .env

## 📦 Dependencias principales

- **FastAPI** - Framework web
- **Uvicorn** - Servidor ASGI
- **Pydantic** - Validación de datos
- **PyJWT** - Tokens JWT
- **bcrypt** - Hash de contraseñas
- **requests** - Cliente HTTP

## ❓ Troubleshooting

### Error: "Faltan SUPABASE_URL y/o SUPABASE_KEY"
→ Verifica que el archivo .env está en la carpeta bebidas-api

### Puerto 8000 en uso
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8000
kill -9 <PID>
```

### Error de importación
```bash
pip install -r requirements.txt --upgrade
```

## 🚀 Próximos pasos

1. Implementar autenticación más robusta (password en formularios)
2. Agregar validaciones adicionales
3. Crear tests unitarios
4. Configurar CORS para producción
5. Desplegar en Render/Heroku/Railway

---

**Desarrollado para: Api Bebidas Kiosco**
