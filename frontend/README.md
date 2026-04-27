# 🎨 Frontend - POS Bebidas

Interface moderna para sistema de punto de venta con Next.js 16, React 19 y TypeScript.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Scripts disponibles

```bash
# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Validar código
npm run lint
```

## 🏗️ Estructura del proyecto

```
app/
├── page.tsx           # Home/Dashboard
├── layout.tsx         # Layout principal
├── login/
│   └── page.tsx       # Página de login
├── utils/
│   └── api.ts         # Cliente Axios configurado
└── globals.css        # Estilos globales

public/               # Archivos estáticos
```

## 🎯 Funcionalidades principales

- ✅ Login/Registro de usuarios
- ✅ Dashboard con estadísticas
- ✅ Gestión de productos
- ✅ Sistema de carrito y pedidos
- ✅ Autenticación JWT
- ✅ Responsive design
- ✅ Gráficas con Chart.js
- ✅ Generación de PDF con jsPDF

## 🛠️ Tecnologías

- **Next.js 16** - Framework React
- **React 19** - Librería UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP
- **Chart.js** - Gráficas
- **jsPDF** - Generación de PDF
- **ESLint** - Linting

## 🔐 Autenticación

El app usa JWT para autenticación:

1. Usuario se registra en `/login`
2. Backend retorna token JWT
3. Token se guarda en localStorage
4. Cada request incluye el token en header

## 📡 API Integration

El cliente API en `app/utils/api.ts`:
- Configura base URL automáticamente
- Añade token JWT a cada request
- Maneja errores de forma centralizada
- Intercepta respuestas de la API

## 🚀 Deployment

### Vercel (recomendado)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Build manual

```bash
npm run build
npm start
```

## 🔗 Conectar con Backend

Asegurate de que:

1. Backend FastAPI corriendo en `http://localhost:8000`
2. Variables de entorno configuradas correctamente
3. CORS activado en el backend

## 🐛 Troubleshooting

**"Cannot find module"** - Ejecuta `npm install`

**"API not responding"** - Verifica que backend esté corriendo

**"Token error"** - Limpia localStorage: `localStorage.clear()`

## 📝 Desarrollo

Para agregar nuevas páginas:

```bash
# Crear carpeta y archivo page.tsx
mkdir app/nueva-pagina
touch app/nueva-pagina/page.tsx
```

## 📄 Licencia

Este proyecto es privado.

# Rebuild do., 26 de abr. de 2026 23:52:02
