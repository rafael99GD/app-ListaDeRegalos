# 🚀 Guía de Despliegue en Producción (Release & Deployment Guide) - Wishlist Hub

Esta guía describe de manera exhaustiva el procedimiento paso a paso para compilar, configurar y desplegar **Wishlist Hub** en un entorno de producción, garantizando alta disponibilidad, seguridad criptográfica, persistencia de datos y soporte en tiempo real.

---

## 📋 Tabla de Contenidos
1. [Arquitectura del Proyecto](#1-arquitectura-del-proyecto)
2. [Requisitos Previos del Servidor](#2-requisitos-previos-del-servidor)
3. [Estrategias de Despliegue Recomendadas](#3-estrategias-de-despliegue-recomendadas)
   - [Opción A: PaaS / Cloud Serverless (100% Gratuito: Render / Vercel)](#opción-a-paas--cloud-serverless-100-gratuito)
   - [Opción B: Servidor VPS Dedicado (Ubuntu / Debian + Nginx + PM2)](#opción-b-servidor-vps-dedicado-ubuntu--debian--nginx--pm2)
   - [Opción C: Contenedores Docker](#opción-c-contenedores-docker)
4. [Variables de Entorno para Producción](#4-variables-de-entorno-para-producción)
5. [Procedimiento Paso a Paso de Compilación y Puesta en Marcha](#5-procedimiento-paso-a-paso-de-compilación-y-puesta-en-marcha)
6. [Gestión de la Base de Datos en Producción](#6-gestión-de-la-base-de-datos-en-producción)
7. [Persistencia de Archivos Multimedia (`/uploads`)](#7-persistencia-de-archivos-multimedia-uploads)
8. [Verificación Post-Despliegue (Smoke Test Checklist)](#8-verificación-post-despliegue-smoke-test-checklist)

---

## 1. Arquitectura del Proyecto

Wishlist Hub es un monorepo modular desacoplado en dos subproyectos:
- **Frontend (`/frontend`)**: Single Page Application (SPA) construida con **React 18**, **TypeScript**, **Vite**, **Tailwind CSS** y capacidades de **Progressive Web App (PWA)** impulsadas por Workbox y Service Workers.
- **Backend (`/backend`)**: API RESTful y servidor de WebSockets en tiempo real construido con **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, **Socket.IO** y **Multer** para gestión de archivos multimedia.

---

## 2. Requisitos Previos del Servidor

Para ejecutar la aplicación en producción se requiere:
- **Node.js**: Versión LTS recomendada (`v18.x` o `v20.x+`).
- **NPM**: Versión `v9.x` o superior.
- **Memoria RAM**: Mínimo 512 MB (recomendado 1 GB o más para soportar la compilación de TypeScript y Vite).
- **Almacenamiento**: Al menos 2 GB de espacio en disco para dependencias `node_modules`, artefactos compilados (`dist/`) y el directorio persistente de imágenes (`uploads/`).
- **Dominio y Certificado SSL**: Obligatorio para HTTPS y WebSockets seguros (`wss://`).

---

## 3. Estrategias de Despliegue Recomendadas

### Opción A: PaaS / Cloud Serverless (100% Gratuito)
Ideal para publicación ágil sin coste de mantenimiento de infraestructura:
1. **Frontend**: Desplegar en **Vercel** o **Render Static Site**.
   - Build Command: `npm run build:frontend`
   - Output Directory: `frontend/dist`
2. **Backend**: Desplegar en **Render Web Service** (o Railway / Fly.io).
   - Build Command: `npm install && npm run build:backend && npx prisma db push --schema=backend/prisma/schema.prisma`
   - Start Command: `node backend/dist/server.js`
3. **Base de Datos**: 
   - Opción 1: **Turso libSQL** o **Neon Postgres** (Capa gratuita serverless persistente).
   - Opción 2: **Render Persistent Disk** montando `/var/data` para SQLite (`file:/var/data/prod.db`).

### Opción B: Servidor VPS Dedicado (Ubuntu / Debian + Nginx + PM2)
Ideal para control total de rendimiento, discos y costes fijos:
1. Instalar Node.js LTS, Git y Nginx.
2. Clonar el repositorio en `/var/www/wishlist-hub`.
3. Instalar PM2 globalmente: `npm install -g pm2`.
4. Configurar Nginx con soporte para WebSockets y proxy inverso hacia el puerto local de Node (5000).

```nginx
# Ejemplo de Bloque Nginx (/etc/nginx/sites-available/wishlist-hub)
server {
    server_name api.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M; # Permitir subida de avatares e imágenes
    }
}
```

5. Obtener certificado SSL gratuito con Certbot:
   ```bash
   sudo certbot --nginx -d api.tudominio.com
   ```

### Opción C: Contenedores Docker
Si prefieres despliegues reproducibles con contenedores:
- Mapear el puerto `5000:5000`.
- Montar un volumen Docker persistente para los archivos de subida:
  `-v /opt/wishlist-hub/uploads:/app/backend/uploads`

---

## 4. Variables de Entorno para Producción

En el panel de configuración de tu servidor o plataforma PaaS, debes definir obligatoriamente las siguientes variables de entorno:

| Variable | Valor de Producción Requerido | Descripción |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | **Crítica**. Desactiva trazas internas y previene cualquier borrado accidental de BD. |
| `PORT` | `5000` (o inyectado por PaaS) | Puerto TCP de escucha. |
| `DATABASE_URL` | `postgresql://...` o `file:/ruta/prod.db` | Cadena de conexión persistente. |
| `JWT_SECRET` | Clave aleatoria de 32+ caracteres | Generar con `openssl rand -base64 32`. |
| `REFRESH_SECRET` | Clave aleatoria distinta de JWT_SECRET | Generar con `openssl rand -base64 32`. |
| `JWT_EXPIRES_IN` | `24h` o `7d` | Tiempo de expiración del token de sesión. |
| `FRONTEND_URL` | `https://wishlist-hub.com` | URL canónica pública del frontend (sin `/` final). |
| `ALLOWED_ORIGINS` | `https://wishlist-hub.com,https://www.wishlist-hub.com` | Orígenes autorizados para CORS y WebSockets. |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` | Clave API de Resend para emails reales (OTP / Notificaciones). |
| `EMAIL_FROM` | `Wishlist Hub <notificaciones@tudominio.com>` | Remitente con dominio verificado en Resend. |
| `RESET_DB_ON_START` | `false` | **Obligatoriamente `false`**. |
| `DB_AUTO_RESET` | `false` | **Obligatoriamente `false`**. |
| `BYPASS_RATE_LIMIT` | `false` | **Obligatoriamente `false`** para proteger contra abusos. |
| `RATE_LIMIT_DISABLED` | `false` | **Obligatoriamente `false`**. |

> [!CAUTION]
> **NUNCA** subas el archivo `.env` al repositorio Git. Configura estas variables directamente en el panel de secretos de tu proveedor de hosting (Render, Railway, Vercel) o en el archivo `/etc/environment` de tu servidor VPS.

---

## 5. Procedimiento Paso a Paso de Compilación y Puesta en Marcha

Sigue estos comandos en la raíz del proyecto para preparar la compilación de producción:

### 1. Instalación Limpia de Dependencias
```bash
npm ci
```
*(o `npm install` si es la primera vez)*.

### 2. Generación del Cliente de Prisma
```bash
npx prisma generate --schema=backend/prisma/schema.prisma
```

### 3. Compilación Completa (Backend + Frontend)
```bash
npm run build
```
Este comando compila:
- **Backend**: Genera el código JavaScript optimizado en `backend/dist/` usando el compilador de TypeScript (`tsc`).
- **Frontend**: Empaqueta la aplicación Vite y genera el bundle de producción y Service Worker PWA en `frontend/dist/`.

### 4. Inicialización y Arranque con PM2 (en VPS)
```bash
# Arrancar el backend gestionado por PM2
pm2 start backend/dist/server.js --name "wishlist-hub-api" -i max

# Guardar la configuración para que reinicie tras reinicios del sistema operativo
pm2 save
pm2 startup
```

---

## 6. Gestión de la Base de Datos en Producción

### Si utilizas SQLite persistente (VPS o Disco Montado en Render):
1. Asegúrate de que el directorio donde reside el archivo `.db` tiene permisos de lectura y escritura para el usuario de Node.
2. Aplica los esquemas de Prisma:
   ```bash
   npx prisma db push --schema=backend/prisma/schema.prisma
   ```

### Si utilizas PostgreSQL (Neon / Supabase / Render Postgres):
1. En `backend/prisma/schema.prisma`, cambia el proveedor a `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Genera y aplica las migraciones:
   ```bash
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   ```

---

## 7. Persistencia de Archivos Multimedia (`/uploads`)

Wishlist Hub permite a los usuarios subir imágenes para los regalos (`/uploads/items`) y fotos de perfil / avatares (`/uploads/avatars`).

### El Reto de los Sistemas Efímeros (Serverless / Dynos):
En plataformas como el free tier básico de Render, Railway o Heroku, el sistema de archivos del contenedor es **efímero**: cada vez que el servicio se reinicia o se despliega una nueva versión, los archivos guardados en disco local se borran.

### Soluciones de Persistencia:

#### Solución 1: Volumen Persistente (Recomendado para VPS / Render Disks)
- **En VPS**: Las carpetas `backend/uploads/items` y `backend/uploads/avatars` residen en el disco duro del servidor y son automáticamente persistentes.
  - Asegurar permisos:
    ```bash
    mkdir -p backend/uploads/items backend/uploads/avatars
    chmod -R 755 backend/uploads
    ```
- **En Render**: Añadir un **Persistent Disk** en los ajustes del servicio web:
  - Mount Path: `/opt/render/project/src/backend/uploads`
  - Size: 1 GB (suficiente para miles de imágenes optimizadas).

#### Solución 2: Almacenamiento en la Nube (S3 / Cloudinary / Supabase Storage)
Si se escala a una arquitectura multi-instancia horizontal o Kubernetes, se recomienda sustituir el almacenamiento local en `fileStorage.ts` y Multer por un adaptador de bucket S3 compatible (AWS S3, Cloudflare R2 o Supabase Storage).

---

## 8. Verificación Post-Despliegue (Smoke Test Checklist)

Una vez completado el despliegue, verifica los siguientes puntos clave en producción:

1. **Health Check y Conectividad**:
   - Accede a `https://api.tudominio.com/api/health` y confirma respuesta HTTP 200 con `{ "status": "ok" }`.
2. **Flujo de Autenticación y OTP Real**:
   - Regístrate con un correo real en `https://tudominio.com/register`.
   - Comprueba que llega el código OTP a tu bandeja de entrada vía Resend.
   - Verifica la cuenta e inicia sesión.
3. **Gestión de Perfil y Avatar**:
   - Accede a `/profile`.
   - Sube una foto de perfil en formato PNG o JPG (menor a 5 MB).
   - Recarga la página y confirma que la imagen se muestra correctamente en el Navbar y en las vistas sociales.
4. **WebSockets y Tiempo Real**:
   - Abre la misma lista de deseos en dos pestañas o en el smartphone y en el ordenador.
   - Reserva un regalo en un dispositivo; comprueba que en el otro dispositivo se marca automáticamente como "Reservado" en menos de 1 segundo sin recargar la página.
5. **Anti-Doble Reserva (Concurrencia)**:
   - Si dos usuarios pulsan simultáneamente sobre el mismo regalo disponible, uno debe reservarlo exitosamente y el otro debe recibir la advertencia HTTP 409 Conflict (*"Este regalo ya ha sido reservado por otro usuario"*).
6. **Instalación de la PWA**:
   - Abre la aplicación en un dispositivo Android o iOS.
   - Comprueba que aparece el banner flotante "Añadir a pantalla de inicio".
   - Instala la app y ábrela en modo standalone sin barra de navegación del navegador.

---
*Wishlist Hub © 2026 - Arquitectura lista para producción y alta disponibilidad.*
