# 🚀 Guía de Deployment

Guía completa para deployar la aplicación a producción.

## 📋 Tabla de contenidos

1. [Deployment Local](#deployment-local)
2. [Deployment con Docker](#deployment-con-docker)
3. [Deployment Backend](#deployment-backend)
4. [Deployment Frontend](#deployment-frontend)
5. [Configuración de Producción](#configuración-de-producción)

## 🏠 Deployment Local

### Windows

```bash
# Ejecutar el script de inicio
run.bat
```

### Linux/Mac

```bash
# Dar permisos de ejecución
chmod +x run.sh

# Ejecutar
./run.sh
```

## 🐳 Deployment con Docker

### Requisitos

- Docker instalado
- Docker Compose (para docker-compose.yml)

### Pasos

1. **Configurar variables de entorno**

```bash
# Crear .env en la raíz del proyecto
cp bebidas-api/.env.example .env
# Editar .env con tus credenciales
```

2. **Build de las imágenes**

```bash
docker-compose build
```

3. **Iniciar contenedores**

```bash
docker-compose up -d
```

4. **Verificar que todo funciona**

```bash
docker-compose logs -f
```

5. **Detener contenedores**

```bash
docker-compose down
```

## 🔙 Deployment Backend

### Opción 1: Heroku

```bash
# 1. Crear app en Heroku
heroku create tu-app-nombre

# 2. Configurar variables de entorno
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_KEY=your_key
heroku config:set SECRET_KEY=your_secret

# 3. Deployar
git push heroku main
```

### Opción 2: Railway

```bash
# 1. Conectar repo a Railway
# (desde dashboard de Railway)

# 2. Configurar variables de entorno en Railway dashboard

# 3. Railway auto-detecta y deploya
```

### Opción 3: Render

```bash
# 1. Conectar repo a Render
# 2. Crear nuevo Web Service
# 3. Configurar:
#    - Build command: pip install -r requirements.txt
#    - Start command: gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
# 4. Agregar variables de entorno
```

### Opción 4: VPS (AWS, DigitalOcean, etc)

```bash
# 1. SSH a tu servidor
ssh user@your_server_ip

# 2. Instalar dependencias
sudo apt-get update
sudo apt-get install python3 python3-pip supervisor nginx

# 3. Clonar repo
git clone tu_repo
cd tu_repo/bebidas-api

# 4. Crear entorno virtual
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Configurar supervisor para auto-restart
sudo nano /etc/supervisor/conf.d/api-bebidas.conf
```

**archivo `/etc/supervisor/conf.d/api-bebidas.conf`:**

```ini
[program:api-bebidas]
directory=/home/user/tu_repo/bebidas-api
command=/home/user/tu_repo/bebidas-api/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
user=user
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/api-bebidas.log
```

```bash
# 6. Reiniciar supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start api-bebidas

# 7. Configurar Nginx (reverse proxy)
sudo nano /etc/nginx/sites-available/api-bebidas
```

**archivo `/etc/nginx/sites-available/api-bebidas`:**

```nginx
server {
    listen 80;
    server_name tu_dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# 8. Habilitar sitio
sudo ln -s /etc/nginx/sites-available/api-bebidas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🎨 Deployment Frontend

### Opción 1: Vercel (recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login en Vercel
vercel login

# 3. Desplegar
cd frontend
vercel

# 4. Configurar variables de entorno en Vercel dashboard
# NEXT_PUBLIC_API_URL=https://tu-api.com
```

### Opción 2: Netlify

```bash
# 1. Instalar Netlify CLI
npm i -g netlify-cli

# 2. Login
netlify login

# 3. Build
cd frontend
npm run build

# 4. Deploy
netlify deploy --prod --dir=.next
```

### Opción 3: GitHub Pages

```bash
# next.config.js: agregar
module.exports = {
  output: 'export',
  basePath: '/nombre-repo'
}

# 1. Build
npm run build

# 2. Push a GitHub
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Opción 4: Railway

```bash
# 1. Conectar repo a Railway
# 2. Crear nuevo Web Service
# 3. Configurar:
#    - Build command: npm run build
#    - Start command: npm start
# 4. Agregar NEXT_PUBLIC_API_URL
```

### Opción 5: AWS S3 + CloudFront

```bash
# 1. Build
npm run build

# 2. Subir a S3
aws s3 sync out/ s3://tu-bucket/

# 3. Invalidar CloudFront
aws cloudfront create-invalidation --distribution-id TU_ID --paths "/*"
```

## ⚙️ Configuración de Producción

### Backend (main.py)

Cambiar estas líneas:

```python
# CAMBIAR:
CORS_ORIGINS = ["*"]

# A:
CORS_ORIGINS = [
    "https://tu-frontend.com",
    "https://www.tu-frontend.com"
]

# Cambiar SECRET_KEY en .env a algo muy seguro
SECRET_KEY=tu-clave-super-segura-aleatoria-64-caracteres
```

### Frontend (.env.production)

```
NEXT_PUBLIC_API_URL=https://tu-api.com
```

### Dominios Personalizados

**Backend:**
- Apunta DNS a tu servidor backend
- Configura SSL/HTTPS (Let's Encrypt)

**Frontend:**
- En Vercel/Netlify: agregar dominio en settings
- Actualizar DNS records

### SSL/HTTPS (Let's Encrypt)

```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot certonly --nginx -d tu-dominio.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Variables de Entorno Seguras

**NUNCA commits .env files**

En GitHub:
1. Usar GitHub Secrets
2. En cada plataforma (Vercel, Heroku, etc), usar sus dashboards

### Monitoreo en Producción

```bash
# Backend logs
sudo journalctl -u api-bebidas -f

# Frontend logs
vercel logs --since 2025-04-18

# Monitoreo de recursos
top, htop, glances
```

### Backup de Base de Datos

```bash
# Supabase maneja backups automáticos
# Pero hacer backup manual:
pg_dump -h db.supabase.co -U tu_user -d postgres > backup.sql
```

## 📝 Checklist Pre-Producción

- [ ] Cambiar SECRET_KEY a algo seguro
- [ ] Cambiar CORS_ORIGINS a dominios permitidos
- [ ] Configurar SSL/HTTPS
- [ ] Variables de entorno en cada plataforma
- [ ] Test de autenticación
- [ ] Test de endpoints críticos
- [ ] Configurar logs
- [ ] Configurar backups
- [ ] Optimizar imágenes (frontend)
- [ ] Minificar CSS/JS
- [ ] CDN para archivos estáticos
- [ ] Rate limiting en backend
- [ ] Validar formularios en backend
- [ ] Sanitizar inputs

## 🆘 Troubleshooting

**Backend no inicia**
- Verificar variables de entorno
- Revisar logs: `heroku logs --tail`
- Probar localmente

**Frontend no carga**
- Limpiar cache del navegador
- Verificar NEXT_PUBLIC_API_URL
- Revisar DevTools (F12)

**CORS errors**
- Verificar CORS_ORIGINS en backend
- El frontend debe estar en la lista

**Timeout errors**
- Aumentar timeout en proxy/server
- Optimizar queries a BD

---

¿Necesitas ayuda? Revisa los READMEs en cada carpeta.
