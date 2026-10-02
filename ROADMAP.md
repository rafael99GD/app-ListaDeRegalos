# 🗺️ Wishlist Hub — Estado y Hoja de Ruta

Documento vivo de control de hitos, estado del proyecto y decisiones de arquitectura.

---

## 📊 Resumen de Estado

- **Estado General**: Hitos 0, 1 y 2 completados al 100%. Fase actual: Validación de Usuario y QA Local (Hito 3 pausado por decisión de producto previo al despliegue).
- **Base de Datos actual**: SQLite (vía Prisma ORM, preparado para migración a PostgreSQL)
- **Servicios activos**: Backend Express (puerto 5000), Frontend React Vite (puerto 5173)

---

## 📌 Hitos del Proyecto

### ✅ Hito 0: Setup y Arquitectura Base (Completado)
- [x] Configuración del monorepo (`backend/` y `frontend/`) con TypeScript.
- [x] Esquema Prisma con modelos: `User`, `AuthOtp`, `Wishlist`, `WishlistWhitelist`, `SavedWishlist`, `Item`.
- [x] Migración inicial de base de datos (`prisma migrate dev`).
- [x] Backend Express con rutas modulares y middleware de errores.
- [x] Subida de imágenes locales con `multer` (`/uploads/items`) y filtro MIME (`.jpg`, `.png`).
- [x] Autenticación completa: registro, verificación por OTP (hash + expiración 10 min), login JWT.
- [x] Lógica de listas: creación, links públicos ofuscados (`shareSlug`), whitelist para listas privadas y anclado de listas.
- [x] Lógica de regalos: alta de items, reserva/compra pública o autenticada, reseteo exclusivo por el creador.
- [x] Smoke test validado de extremo a extremo.

---

### ✅ Hito 1: Pulido de UX / UI, Modo Oscuro y Mobile-First (Completado)
- [x] Soporte para **Modo Oscuro / Claro** con persistencia en `localStorage` y toggle en la barra de navegación.
- [x] Adaptación **Mobile-First**:
  - [x] Navegación inferior o menú hamburguesa optimizado para dedos en pantallas táctiles.
  - [x] Ajuste de espaciados, fuentes y botones para interacción táctil fluida (mínimo 44px de tap target).
  - [x] Tarjetas de regalo (`GiftCard`) y modales optimizados para pantallas verticales de smartphone (formato bottom sheet).
- [x] Estados vacíos ilustrados (sin regalos en la lista, sin listas creadas, etc.).
- [x] Filtros y ordenación de regalos reactivos en memoria (por precio, fecha y alfabético; disponibilidad y reservados).
- [x] Microinteracciones y feedback festivo (ráfaga de confeti con `canvas-confetti` al reservar regalo).

---

### ✅ Integración Especial: Steam Wishlist Hub (Completado y Blindado)
- [x] **Resolución y Normalización de Identidad Steam**: Soporte flexible para URLs completas (`https://steamcommunity.com/id/...`, `https://store.steampowered.com/wishlist/id/...`, `/profiles/...`), SteamID64 numérico de 17 dígitos y vanity names directos (ej. `rafael99`, `gaben`).
- [x] **Parser Robusto Multi-Estrategia (`GET /api/steam/wishlist`)**: Capacidad de procesar tanto el formato JSON tradicional como la arquitectura web moderna de Steam (renderizado SSR de React en HTML) con extracción de precios con descuento en EUR, decodificación de entidades HTML y bypass de redirecciones 302 sin falsos positivos de privacidad.
- [x] **Importación por Lotes (`POST /api/wishlists/:id/items/batch`)**: Inserción masiva de regalos en base de datos en una sola transacción eficiente con Prisma.
- [x] **Modal de Importación (`ImportSteamModal.tsx`)**: Buscador, previsualización de juegos con miniaturas y precios, selección con checkboxes ("Seleccionar todos" / "Deseleccionar") y filtro de títulos.
- [x] **Asistente e Instructivo para Quien Regala (`SteamGiftGuideModal.tsx` & `GiftCard.tsx`)**: Badge temático distintivo de Steam y modal informativo con dos vías claras (compra directa en Steam como amigo o aportación por Bizum).
- [x] **Homogeneización Visual Total**: Cobertura al 100% de Modo Oscuro en todos los modales (`AddItemModal`, `CreateWishlistModal`, `WhitelistModal`, `ImportSteamModal`, etc.) y pantallas de autenticación (`Login`, `Register`, `VerifyOtp`, `ForgotPassword`, `ResetPassword`).

---

### ✅ Hito 2: Robustez y Notificaciones Reales (Completado - 100%)
- [x] Integración de servicio de email transaccional (Resend / Fallback a consola) para envío real del OTP.
- [x] Limpieza automática de imágenes huérfanas en disco al eliminar o modificar regalos y listas, con protección anti-Path Traversal y actualización a `moduleResolution: NodeNext`.
- [x] Rate limiting global en `/api` y protección estricta anti-fuerza bruta en endpoints de autenticación y OTP (`express-rate-limit`).
- [x] Sincronización en tiempo real con WebSockets (`socket.io` & `socket.io-client`): salas por lista (`join_wishlist`/`leave_wishlist`), eventos `item:created`, `item:updated` e `item:deleted`, blindaje de privacidad anónima y feedback visual reactivo ("En vivo" y resaltado dinámico).

---

### 🌟 Fase de Refinamiento y Mejoras Clave (En progreso)
- [x] **Feature 1/4: Nivel de Deseo (1-10) en Regalos y Barra de Filtros/Ordenación en Lista**:
  - Calificación de prioridad/deseo (1 a 10) con selector visual intuitivo (slider táctil, botones rápidos y etiquetas dinámicas) en creación y edición de regalos (`AddItemModal`).
  - Indicador visual dinámico en tarjeta de regalo (`GiftCard`): insignia temática de fuego, barra de progreso con gradiente de color y botón de edición rápida.
  - Barra de herramientas en `WishlistDetail` y `PublicWishlist`: chip conmutable "Deseo alto" (>= 7) con contador dinámico e integración reactiva con WebSockets.
  - Nueva opción de ordenación "Nivel de deseo (10 a 1) 🔥" en memoria.
  - Persistencia en base de datos (`priority Int @default(5)` en Prisma) y validación de seguridad con clamping 1-10 en Zod.
  - Suite de pruebas de regresión e integración: `npm run test:priority`.
- [x] **Feature 2/4: Sistema Social de Amigos y Búsqueda de Usuarios** (COMPLETADO):
  - Modelo `Friendship` en Prisma con estados (`PENDING`, `ACCEPTED`, `REJECTED`) e índices relacionales.
  - Endpoints backend en `/api/friends`: enviar y responder solicitudes, listar amigos, buscar usuarios con estado relacional en tiempo real y consultar listas accesibles (`/api/friends/:id/wishlists`).
  - Vista dedicada `Friends.tsx` con tabs para "Amigos", "Solicitudes" (entrantes y salientes) y "Buscador de usuarios", además de modal para inspección directa de listas de deseos.
  - Enlaces de navegación en escritorio y en la barra inferior móvil.
  - Suite de pruebas de regresión: `npm run test:friends`.
- [x] **Feature 3/4: Amigo Invisible (Secret Santa) con Sorteo y Notificaciones** (COMPLETADO):
  - Modelos `SecretSantaGroup` y `SecretSantaMember` en Prisma con soporte para presupuesto opcional, fecha de intercambio y estados `DRAFT`, `DRAWN`, `COMPLETED`.
  - Algoritmo de Sattolo para permutación de ciclo simple sin auto-asignaciones ($O(N)$ derangement garantizado) en `derangement.ts`.
  - Blindaje estricto de privacidad en backend: ningún participante puede ver los emparejamientos de otros vía payload de red.
  - Notificaciones enriquecidas por email (Resend / fallback consola) con plantilla HTML responsive festiva.
  - Vista dedicada `SecretSanta.tsx` con modal de creación, listado de eventos, ejecutor de sorteo para el creador y tarjeta interactiva de revelación (Scratch / Reveal Card) con acceso directo a las listas de regalos del asignado.
  - Suite de pruebas de regresión e integridad matemática: `npm run test:secretsanta`.
- [x] **Feature 4/4: PWA (Progressive Web App) y Modo Móvil Instalable** (COMPLETADO):
  - Integración completa con `vite-plugin-pwa` y generación de Service Worker con Workbox.
  - `manifest.webmanifest` con iconos responsive (Android/iOS), fondo oscuro y acento azul eléctrico de Wishlist Hub.
  - Estrategia de caché offline suave para fuentes de Google e imágenes de regalos subidas.
  - Botón y aviso interactivo flotante (`PwaInstallPrompt.tsx`) para "Instalar Aplicación en Pantalla de Inicio" con soporte Chromium/Android e iOS Safari.
- [x] **Sprint de Robustez Técnica, Concurrencia y Perfil de Usuario Completo** (COMPLETADO):
  - **Fase 1**: Reorganización estructurada y documentada de `.env` y `.env.example` en 6 bloques temáticos, switch seguro `RESET_DB_ON_START=false` e inmunidad de rate limiting en redes privadas locales (RFC 1918).
  - **Fase 2**: Transacciones atómicas de reserva (`$transaction`) con bloqueo optimista y respuesta HTTP 409 Conflict anti-doble reserva; sincronización instantánea por WebSockets (`gift_reserved`, `gift_updated`, etc.) en salas duales.
  - **Fase 3**: Modelo `User` ampliado con `firstName`, `lastName` y `avatarUrl` (Prisma); registro actualizado; nombres reales en vistas sociales ("Nombre Apellidos (@username)"); módulo `/profile` completo (avatar JPG/PNG max 5MB, datos personales y cambio de contraseña) en web y móvil.

---

### 🚀 Hito 3: Preparación para Despliegue y Producción (Release Readiness)
> **Estado**: [EN EJECUCIÓN - FASE FINAL DE DESPLIEGUE].  
> **Estrategia**: Plan de publicación 100% gratuito (Coste cero) con arquitectura cloud desacoplada o VPS dedicado.

#### Documentación y Guías de Lanzamiento:
- [x] **Documentación Exhaustiva de Variables de Entorno**: `backend/.env` y `backend/.env.example` documentados línea por línea con propósito, valores aceptados, comportamiento booleano y configuración obligatoria para producción.
- [x] **Guía de Despliegue en Producción (`DEPLOY.md`)**: Requisitos previos, compilación (`npm run build`), estrategias de despliegue (PaaS/Render/Vercel vs VPS/Nginx/PM2 vs Docker), persistencia de `/uploads` y checklist de smoke tests.

#### Arquitectura de Publicación 100% Gratuita:
- **Frontend**: Vercel / Render Static Site (Plan Gratuito, despliegue continuo CI/CD integrado con GitHub, soporte HTTPS automático).
- **Backend**: Render Web Service (Free tier, suspensión por inactividad tras 15 min, reanudación automática).
- **Base de Datos**: Turso SQLite Serverless (libSQL) / Neon Postgres (Free tier sin pérdida de datos, replicación en edge).
- **Emails Transaccionales**: Resend (Free tier, 3.000 emails/mes, 100 emails/día, soporte de remitente verificado o dev).

#### Checklist Previo al Lanzamiento:
- [x] **Cleanup previo y blindaje de seguridad**: Desactivación incondicional de `RESET_DB_ON_START` y `DB_AUTO_RESET` en producción (`false`), ignorados por código en `NODE_ENV === 'production'`.
- [x] **Configuración de CORS y dominios**: `FRONTEND_URL` y `ALLOWED_ORIGINS` preparados para vincular a los dominios de producción.
- [x] **Compilación y suites de tests en verde**: `npm run build` y suites automatizadas (`test:ratelimit`, `test:friends`, `test:secretsanta`, `test:socket`) superadas al 100%.
- [ ] Adaptación de variables de base de datos a proveedor serverless gratuito persistente (o persistent disk).
- [ ] Despliegue sincronizado y prueba de humo (smoke test) en producción.