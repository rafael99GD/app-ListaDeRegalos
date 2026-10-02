# 📊 Estado del Proyecto - Wishlist Hub

**Última actualización:** 3 de octubre de 2026

---

## 🚀 Estado General
- **Hito 0 (Setup y Arquitectura Base)**: Completado (100%).
- **Hito 1 (Pulido de UX / UI, Modo Oscuro y Mobile-First)**: Completado y Verificado (100%).
- **Integración Especial (Steam Wishlist Hub)**: Completado y Blindado (100%).
- **Hito 2 (Robustez y Notificaciones Reales)**: Completado al 100% 🎉.
  * ✅ Tarea 1: Servicio de Email Transaccional (Resend + Fallback a consola).
  * ✅ Tarea 2: Limpieza de imágenes huérfanas en disco y corrección de tsconfig.json.
  * ✅ Tarea 3: Rate limiting global y protección anti-fuerza bruta en auth y OTP.
  * ✅ Sincronización en tiempo real con WebSockets (Socket.IO) para listas y regalos.
- **Fase de Refinamiento**: **Completada al 100% (Features 1/4, 2/4, 3/4 y 4/4)** 🎉
  * ✅ **Feature 1/4 Completada**: Nivel de deseo (1-10) en regalos y barra de herramientas con filtros/ordenación en listas.
  * ✅ **Feature 2/4 Completada**: Sistema Social de Amigos, buscador interactivo de usuarios, gestión de solicitudes y acceso a listas de amigos.
  * ✅ **Feature 3/4 Completada**: Amigo Invisible (Secret Santa) con algoritmo de Derangement de Sattolo, notificaciones por email, blindaje estricto de privacidad y tarjeta interactiva de revelación (Scratch / Reveal Card).
  * ✅ **Feature 4/4 Completada**: PWA (Progressive Web App) y Modo Móvil Instalable con Workbox, Service Worker, Web App Manifest (`manifest.webmanifest`), pack completo de iconos adaptativos y banner interactivo de instalación (`PwaInstallPrompt.tsx`).
  * 🎨 **Rediseño Visual Completo (UI/UX)**: Transición integral hacia estética gaming / e-commerce moderna (estilo Eneba / Loaded), con dark mode sólido (`zinc-950`/`zinc-900`), acento azul eléctrico neón (`#0ea5e9`), tarjetas de producto estructuradas, modo Amigo Invisible confidencial/cyber y pack de iconos PWA de alta definición.
  * 🛡️ **Sprint de Robustez Técnica, Concurrencia y Perfil de Usuario Completo**:
    - **Fase 1**: Reorganización temática de variables de entorno (`.env` / `.env.example`) en 6 secciones, switch seguro `RESET_DB_ON_START=false` con bypass total en `production`, y exención de rate limiting para IPs privadas locales (RFC 1918).
    - **Fase 2**: Bloqueo optimista y transacciones atómicas (`prisma.$transaction`) en reservas de regalos respondiendo con HTTP 409 Conflict (*"Este regalo ya ha sido reservado por otro usuario"*), con sincronización instantánea por WebSockets en salas duales (`wishlist:${id}` y `wishlist_${id}`).
    - **Fase 3**: Modelo `User` ampliado con `firstName`, `lastName` y `avatarUrl`; formulario de registro extendido; visualización social unificada "Nombre Apellidos (@username)"; módulo y pantalla `/profile` completa (subida de avatares seguros JPG/PNG max 5MB, edición de credenciales y datos personales) enlazada en navegación web y móvil.
  * 📋 **Preparación para Producción (Release Readiness)**:
    - Documentación exhaustiva línea por línea de `backend/.env` y `backend/.env.example` cubriendo propósito, tipos de valores, semántica de booleanos y directrices obligatorias para producción.
    - Creación de la guía integral de despliegue [`DEPLOY.md`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/DEPLOY.md) con estrategias PaaS (Render/Vercel), VPS (Nginx + PM2 + SSL) y Docker, gestión de persistencia de `/uploads` y checklist de smoke tests.
  * 🧪 **Suites Automatizadas (100% PASS)**:
    - `npm run test:ratelimit`: Validación de bypass en LAN, detección de rangos RFC 1918, protección anti-fuerza bruta en OTP y omisión de peticiones exitosas.
    - `npm run test:secretsanta`: Derangement matemático sin auto-asignaciones, persistencia y blindaje de privacidad.
    - `npm run test:friends`: Ciclo social completo de amistades, búsquedas, aceptación y borrado.
    - `npm run test:socket`: Sincronización multi-cliente y salas dinámicas en tiempo real.
    - `npm run build`: Compilación limpia sin errores TypeScript (0 errores), Vite ni Workbox en backend y frontend.
- **Estado de Preparación para Despliegue (Hito 3)**: **EN EJECUCIÓN (Fase Final de Despliegue)**. La base de código, la configuración de entornos y la documentación técnica están completas al 100%.

---

## 🛠️ Correcciones y Mejoras Recientes

### 📱 Optimización de Usabilidad Móvil, PWA y Navegación Unificada en la Misma Pestaña (03/10/2026)
- **Objetivo**: Perfeccionar la experiencia de navegación en dispositivos móviles y modo PWA standalone, garantizando que el usuario nunca sea expulsado de la aplicación en nuevas pestañas del navegador, que la zona táctil inferior esté protegida y que los modales y botones sean 100% responsivos.
- **Implementación**:
  1. **Navegación Unificada en la Misma Pestaña (In-App)**:
     - En `frontend/src/pages/Friends.tsx` y `frontend/src/pages/SecretSanta.tsx`: eliminado `target="_blank"` y `rel="noopener noreferrer"` en los accesos a listas de amigos y listas asignadas (`/w/:shareSlug`). Reemplazado por enlaces internos de React Router (`<Link to="...">`) con icono direccional `ArrowRight` y auto-cierre de modal.
     - En `frontend/src/App.tsx`: refactorizada la redirección tras crear una lista con `CreateWishlistModal`, sustituyendo `window.location.href` por `navigate('/wishlist/:id')` dentro de `BrowserRouter` sin recargas completas ni desconexión del estado de WebSockets.
  2. **Zona de Seguridad Inferior (Safe Area & Padding)**:
     - Aplicado padding inferior reforzado (`pt-6 pb-28 sm:py-8`) en todas las vistas principales (`Dashboard`, `WishlistDetail`, `PublicWishlist`, `Friends`, `SecretSanta`, `Profile`) para que el Navbar táctil fijo (`h-16`) y el banner de instalación PWA no tapen botones críticos ("Crear Lista", "Reservar regalo", botones de compra y footers).
  3. **Modales Adaptativos para Pantallas Pequeñas**:
     - Estandarizado el contenedor de todos los modales (`AddItemModal`, `CreateWishlistModal`, `PurchaseConfirmModal`, `SteamGiftGuideModal`, `ImportSteamModal`, `WhitelistModal`, modal de amigos y modal de sorteo) con `items-end sm:items-center p-0 sm:p-4 rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto flex flex-col`.
  4. **Touch Targets Cómodos y Control de Desborde**:
     - Botones de acción rápida y propietarios optimizados (`min-h-[42px]`, `min-h-[36px] min-w-[36px]` con iconos `w-4 h-4` y espaciado táctil).
     - Aplicado `@apply overflow-x-hidden` a `html` y `body` en `index.css` asegurando cero desborde horizontal en cualquier resolución.
  5. **Verificación y Pruebas**:
     - `npm run build` en frontend y backend: **0 errores TypeScript**.
     - Batería de tests completa (`test:socket`, `test:friends`, `test:secretsanta`, `test:ratelimit`): **100% PASS**.
- **Estado**: ✅ Completado y verificado al 100%.

### ⚡ Sincronización Reactiva en Tiempo Real Bidireccional (03/10/2026)
- **Objetivo**: Subsanar la falta de actualización reactiva en caliente en clientes y navegadores concurrentes al reservar o comprar regalos, garantizando que el cambio de estado se refleje de inmediato sin necesidad de recargar la página.
- **Causa Raíz Identificada**:
  1. En `frontend/src/services/socket.ts`, la condición `window.location.port === '5173'` forzaba `http://localhost:5000`. Al acceder desde dispositivos móviles u otros ordenadores en la red local (`http://192.168.x.x:5173`), el socket intentaba conectar al `localhost` del propio cliente móvil, fallando silenciosamente.
  2. Disparidad en nombres de salas y formatos de eventos entre `wishlist:${id}`, `wishlist_${id}` e IDs puros, impidiendo a veces el enrutamiento correcto.
  3. Faltaba enriquecimiento de payload con el atributo `status: 'RESERVED' | 'AVAILABLE'` e invocación de alias de eventos (`gift_reserved`, `gift_purchased`, etc.).
- **Implementación y Solución**:
  1. **Resolución Universal de Socket URL**:
     - `frontend/src/services/socket.ts`: Eliminado el bypass rígido a `localhost`. Ahora prioriza `VITE_SOCKET_URL` o `VITE_API_URL` absoluta, y por defecto usa `window.location.origin`. Tanto en `localhost` como en LAN (`192.168.x.x`), las conexiones Socket.IO viajan limpiamente a través del proxy de Vite (`/socket.io` con `ws: true` y `changeOrigin: true`), resolviendo problemas de CORS y conectividad en red local.
  2. **Normalización de Salas y Emisión Enriquecida en Backend**:
     - `backend/src/services/socketService.ts`: Sanitización sistemática con `normalizeId` (`.replace(/^wishlist[_:]/, '')`). Los sockets se unen y reciben eventos en `wishlist:${cleanId}`, `wishlist_${cleanId}` y `cleanId`.
     - Soporte para eventos de sala `join_wishlist`, `join-room`, `join_room`, `join` y sus contrapartes `leave_*`.
     - Emisión unificada con enriquecimiento automático: `status: isPurchased ? 'RESERVED' : 'AVAILABLE'`, `isPurchased: boolean`, disparando tanto los eventos base (`item:updated`, `item:created`, `item:deleted`) como sus alias semánticos (`gift_updated`, `gift_reserved`, `gift_purchased`, `gift_unreserved`, `gift_available`, `gift_created`, `gift_deleted`).
  3. **Hook Robusto y Sincronización en Vistas**:
     - `frontend/src/hooks/useWishlistSocket.ts`: Uniones redundantes y auto-reconexión a salas, deduplicación en ventana de 150ms, normalización de payloads y logs en consola de desarrollo (`[Socket.io Wishlist] Evento recibido: ...`).
     - `frontend/src/pages/WishlistDetail.tsx`: Vinculación inmediata del socket mediante `id || wishlist?.id`, fusión reactiva no destructiva de ítems (`{ ...i, ...updatedItem }`), y auto-cierre con aviso informativo si el modal de compra estaba abierto para un regalo que acaba de ser reservado concurrentemente por otro usuario.
     - `frontend/src/pages/PublicWishlist.tsx`: Misma reactividad y auto-cierre preventivo de modal.
  4. **Verificación y Pruebas**:
     - Actualizada suite `backend/scripts/verifySocketEvents.ts` (`npm run test:socket`) validando enriquecimiento de `status`, unión por `join-room` con prefijos y recepción en todos los alias. Resultado: **100% PASS**.
     - `npm run build` tanto en frontend como backend verificado con cero errores de TypeScript o empaquetado.
- **Estado**: ✅ Completado y verificado al 100%.

### 🚀 Preparación para Producción y Documentación Exhaustiva de Entorno (03/10/2026)
- **Objetivo**: Estandarizar la configuración de despliegue mediante documentación línea por línea de variables de entorno y proveer una guía exhaustiva de publicación en producción (`DEPLOY.md`).
- **Implementación**:
  1. **Documentación Exhaustiva de `.env` y `.env.example`**:
     - Cada variable (`PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `REFRESH_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, `RESEND_API_KEY`, `EMAIL_FROM`, `RESET_DB_ON_START`, `BYPASS_RATE_LIMIT`, etc.) documentada detallando: qué hace, valores aceptados con ejemplos concretos, comportamiento exacto de valores booleanos (`true`/`false`) y directrices según entorno local vs producción.
  2. **Guía de Despliegue en Producción (`DEPLOY.md`)**:
     - Arquitectura desacoplada frontend/backend, requisitos previos (Node.js LTS, RAM, disco).
     - Estrategias de publicación: PaaS 100% gratuita (Render + Vercel + Neon/Turso), VPS dedicado con Ubuntu, Nginx, Certbot SSL y PM2, y Docker.
     - Persistencia de archivos multimedia en `/uploads` (Persistent Disks vs almacenamiento cloud).
     - Procedimiento de compilación paso a paso y checklist de pruebas de humo (smoke tests).
- **Estado**: ✅ Completado al 100%. Compilación y suites de tests en verde.

### ⚡ Sprint de Robustez Técnica, Concurrencia y Perfil de Usuario (03/10/2026)
- **Objetivo**: Asegurar la robustez operativa de desarrollo y producción, eliminar condiciones de carrera en reservas con WebSockets y dotar a la plataforma de perfiles de usuario completos con nombres reales y avatares seguros.
- **Implementación**:
  1. **Fase 1: Robustez Local/Prod y Switch de Reseteo**:
     - `.env` y `.env.example` reestructurados en 6 bloques temáticos: `[SERVER & CORE]`, `[SECURITY & AUTH]`, `[DATABASE]`, `[CORS & CLIENT ORIGINS]`, `[EMAIL / SMTP SERVICE]` y `[DEVELOPMENT CONTROLS]`.
     - Implementado hook seguro `autoResetDatabase()` en `backend/src/utils/dbReset.ts`. En `NODE_ENV === 'production'` se ignora incondicionalmente. En desarrollo, si `RESET_DB_ON_START=true`, resetea todas las tablas relacionales y purga `uploads/items/` y `uploads/avatars/`.
     - Bypass inteligente en `rateLimiter.ts` para redes locales RFC 1918 (`192.168.x.x`, `10.x.x.x`, `127.0.0.1`, `::1`) en desarrollo para evitar bloqueos HTTP 429 durante pruebas multidispotivo.
  2. **Fase 2: Concurrencia en Tiempo Real y Bloqueo Optimista**:
     - Endpoints de compra y reserva (`purchaseItem`, `unpurchaseItem`) protegidos mediante `prisma.$transaction`. Si un regalo ya está tomado, responde inmediatamente con HTTP 409 Conflict: *"Este regalo ya ha sido reservado por otro usuario"*.
     - Modal de reserva en frontend (`PurchaseConfirmModal.tsx`) adaptado para interceptar HTTP 409 y mostrar el toast de conflicto cerrando el modal.
     - Sincronización por WebSockets en salas duales (`wishlist:${id}` y `wishlist_${id}`), emitiendo `gift_reserved`, `gift_updated`, `gift_created` y `gift_deleted` con deduplicación reactiva en `useWishlistSocket.ts`.
  3. **Fase 3: Perfil de Usuario Completo y Avatares Seguros**:
     - Prisma Schema: `User` ampliado con `firstName String @default("")`, `lastName String @default("")` y `avatarUrl String?`.
     - Registro y DTOs actualizados para solicitar Nombre y Apellidos (manteniendo `username` único).
     - Componentes sociales (`Friends.tsx` y `SecretSanta.tsx`) actualizados para mostrar "Nombre Apellidos (@username)" y foto de avatar si existe.
     - Subida de avatares en `backend/uploads/avatars/` con Multer (`avatarUploadMiddleware.ts`), límite estricto de 5MB y tipos MIME `image/jpeg` y `image/png`.
     - Borrado seguro de avatares huérfanos con `deleteLocalAvatar()` y protección anti-Path Traversal.
     - Pantalla completa de perfil `/profile` (`Profile.tsx`) con diseño dark gaming sobrio, formulario de datos de cuenta, cambio de contraseña y gestor de avatar fotográfico, enlazado en el navbar superior y barra táctil inferior móvil.
- **Estado**: ✅ Completado al 100%, suites de test automatizados pasando al 100% y `npm run build` impecable sin advertencias.

### 🎨 Rediseño Visual Completo (UI/UX): Estética Gaming / E-Commerce Moderna (02/10/2026)
- **Objetivo**: Superar los clichés gráficos de plantillas de IA (degradados rosas/morados difusos, bordes `rounded-3xl` hiperbólicos) y dotar a Wishlist Hub de una identidad visual sobria, estructurada y de alto contraste inspirada en plataformas de gaming y e-commerce moderno como Eneba o Loaded.
- **Implementación**:
  1. **Sistema de Diseño y Tokens**:
     - Configuración de Tailwind (`tailwind.config.js`): paleta `brand` redefinida hacia azul eléctrico / neón cian (`#0ea5e9`, `#38bdf8`), con superficies oscuras sólidas (`zinc-950`, `zinc-900`, `zinc-850`, `zinc-800`).
     - Normalización de bordes limpios de 1px (`border-zinc-800`) y radios estructurados (`rounded-lg` y `rounded-xl`).
     - Estilos base en `index.css`: barras de desplazamiento dark gaming personalizadas y fondo `bg-zinc-950 text-zinc-100`.
  2. **Navegación y Estructura Global**:
     - `Navbar.tsx`: Barra superior sobria sticky con efecto frosted glass sutil (`bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800`), logo renovado con acento cian y barra de navegación inferior móvil táctil con iconos definidos y pestaña activa en azul eléctrico.
     - `PwaInstallPrompt.tsx`: Banner interactivo flotante adaptado con acabados `zinc-900`, borde `zinc-800` y botón de instalación con resplandor cian.
  3. **Catálogo y Tarjetas de Producto**:
     - `WishlistCard.tsx`: Tarjetas de listas de regalos con estética de biblioteca técnica, contadores limpios y accesos directos.
     - `GiftCard.tsx`: Tarjeta de regalo tipo e-commerce con imagen bien encuadrada, badges técnicos de prioridad (`PRIORIDAD 1-10`), precio destacado en monoespacio y botones de acción rápida de alto contraste (reservar, comprar, editar, eliminar).
     - `Dashboard.tsx`: Banner de bienvenida estilizado con estadísticas clave del usuario y selector segmentado con pestañas limpias.
  4. **Vistas de Detalle y Públicas**:
     - `WishlistDetail.tsx` y `PublicWishlist.tsx`: Cabecera con métricas en píldoras sobrias, chip "En vivo" con pulso esmeralda, barra de herramientas completa con filtros rápidos y selector de ordenación con foco cian.
  5. **Módulo de Amigo Invisible (Secret Santa) en Modo Confidencial / Cyber**:
     - `SecretSanta.tsx`: Transformación de la estética festiva infantil hacia una experiencia confidencial misteriosa con tarjeta de revelación en acabados oscuros, botón de desbloqueo con resplandor azul eléctrico y panel de asignación elegante.
  6. **Módulo de Amigos y Solicitudes**:
     - `Friends.tsx`: Listas compactas de amigos y solicitudes entrantes/salientes con avatares nítidos, badges técnicos de estado y acciones rápidas con micro-interacciones.
  7. **Modales y Formularios**:
     - `AddItemModal.tsx`, `CreateWishlistModal.tsx`, `WhitelistModal.tsx`, `ImportSteamModal.tsx`, `PurchaseConfirmModal.tsx`, `SteamGiftGuideModal.tsx`: Overlays profundos (`bg-black/75 backdrop-blur-sm`), inputs en `bg-zinc-950 border-zinc-800 text-zinc-100` y botones primarios en cian eléctrico.
  8. **Autenticación y Feedback**:
     - `Login.tsx`, `Register.tsx`, `VerifyOtp.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`: Formas de autenticación sobrias y centradas.
     - `ToastContext.tsx`: Notificaciones flotantes estilizadas en `bg-zinc-900/95` con bordes y acentos semánticos en esmeralda (éxito), coral (error) y cian (información).
  9. **Iconos PWA y Branding**:
     - Regenerados `favicon.svg`, `favicon.ico`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png` y `apple-touch-icon.png` con la nueva identidad dark & electric blue.
     - `theme_color` actualizado a `#09090b` en `index.html` y `manifest.webmanifest`.
- **Estado**: ✅ Completado al 100%, compilación limpia (`npm run build`) y todas las suites de prueba en verde.

### 📱 Feature 4/4: PWA (Progressive Web App) y Modo Móvil Instalable (01/10/2026)
- **Objetivo**: Dotar a Wishlist Hub de capacidades PWA completas para funcionar como una aplicación móvil instalable en pantalla de inicio con soporte de precacheo offline de assets estáticos y fuentes, manifiesto web estándar y un banner interactivo que guíe a los usuarios en Android, iOS Safari y navegadores de escritorio.
- **Implementación**:
  1. **Integración con `vite-plugin-pwa`**:
     - Configurado en [`frontend/vite.config.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/vite.config.ts) con modo `autoUpdate`, generación automática de Service Worker (`generateSW`) con Workbox y limpieza de cachés antiguas (`cleanupOutdatedCaches: true`).
     - Caché en tiempo de ejecución: `CacheFirst` para fuentes de Google (`googleapis.com` y `gstatic.com`) y `StaleWhileRevalidate` para imágenes de regalos subidas (`/uploads/`).
  2. **Web App Manifest (`manifest.webmanifest`)**:
     - Definición de identidad de marca: Nombre completo ("Wishlist Hub - Tu Lista de Regalos"), nombre corto ("Wishlist Hub"), descripción, categoría de estilo de vida y compras, `display: "standalone"`, `orientation: "portrait"`, `theme_color: "#ec4899"` y `background_color: "#0f172a"`.
  3. **Pack Completo de Iconos en `frontend/public/`**:
     - Generados con renderizado de alta fidelidad:
       * `pwa-192x192.png`: Icono para pantalla de inicio y app drawer en Android.
       * `pwa-512x512.png`: Icono en alta resolución para splash screen y escritorio.
       * `maskable-icon-512x512.png`: Icono adaptativo con zona segura del 80% (`purpose: "maskable"`) para capas de iconos de Android.
       * `apple-touch-icon.png`: Icono táctil específico para iOS.
       * `favicon.svg` y `favicon.ico`: Favicons vectoriales y compatibles.
  4. **Componente Interactivo de Instalación ([`PwaInstallPrompt.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/components/PwaInstallPrompt.tsx))**:
     - Detección inteligente de modo standalone: si la app ya está instalada, no se muestra ningún aviso.
     - Detección de Chromium/Android/Desktop: escucha el evento nativo `beforeinstallprompt` y presenta el botón directo "Añadir a pantalla de inicio".
     - Detección de iOS (Safari en iPhone/iPad): muestra una guía visual interactiva con los iconos nativos de Compartir y "Añadir a pantalla de inicio".
     - Descarte persistente: si el usuario pulsa "Ahora no" o cierra el aviso, se almacena en `localStorage` (`wishlist_pwa_dismissed_at`) para no molestar durante los siguientes 7 días.
     - Ubicación ergonómica flotante sobre la barra de navegación móvil (`bottom-20 md:bottom-6`) con soporte completo para temas claro y oscuro.
  5. **Registro de Service Worker ([`main.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/main.tsx))**:
     - Registro inmediato vía `virtual:pwa-register` con handlers de actualización silenciosa y reporte de disponibilidad offline.
- **Estado**: ✅ Completado al 100%, compilación limpia en Vite y verificado.

### 🛡️ Ajuste de Rate Limiting para Desarrollo y Pruebas Multidispositivo en LAN (01/10/2026)
- **Problema**: Al realizar pruebas del sorteo de Amigo Invisible simultáneamente con varios navegadores y smartphones en la misma red Wi-Fi local, todas las peticiones compartían la misma dirección IP y se superaba rápidamente el umbral restrictivo de 100 peticiones en 15 minutos de `apiRateLimiter`, provocando el error HTTP 429 ("Has superado el límite de peticiones permitidas. Por favor, inténtalo de nuevo más tarde.") y el deslogueo de la sesión.
- **Solución**:
  - [`rateLimiter.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/middleware/rateLimiter.ts):
    * Creada la función `isPrivateOrLocalIp(ip)` para identificar rangos privados RFC 1918 (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`), localhost (`127.0.0.1`, `::1`) y direcciones locales IPv6.
    * En `apiRateLimiter`, se añade bypass automático en entornos no productivos (`NODE_ENV !== 'production'`) para peticiones originadas desde redes locales privadas y localhost.
    * Se amplía el límite de desarrollo a 10.000 peticiones por ventana de 15 minutos en `apiRateLimiter`, y se eleva el límite de intentos fallidos en `authRateLimiter` a 200 en desarrollo.
  - [`verifyRateLimit.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/scripts/verifyRateLimit.ts):
    * Incorporadas pruebas automatizadas que verifican la clasificación correcta de IPs privadas y comprueban una ráfaga continua de 150 peticiones en red local sin bloqueo.
- **Estado**: ✅ Corregido, testeado y validado (`npm run test:ratelimit` -> 100% PASS).

### 🎅 Feature 3/4: Amigo Invisible (Secret Santa) con Sorteo y Notificaciones (01/10/2026)
- **Objetivo**: Diseñar y construir un módulo integral de Amigo Invisible para crear eventos de sorteo de regalos con presupuesto sugerido y fecha de intercambio, emparejamiento matemático garantizado sin auto-asignaciones mediante el algoritmo de Sattolo, blindaje estricto de privacidad en backend, notificaciones enriquecidas por email y tarjeta interactiva de revelación (Scratch / Reveal Card) con acceso directo a las listas de regalos del asignado.
- **Implementación**:
  1. **Modelo de Datos Prisma (`schema.prisma`)**:
     - `enum SecretSantaStatus { DRAFT, DRAWN, COMPLETED }`.
     - Modelo `SecretSantaGroup` (id, title, description, budget, exchangeDate, status, creatorId, members, createdAt, updatedAt).
     - Modelo `SecretSantaMember` (id, groupId, userId, assignedToId, createdAt, updatedAt) con `@@unique([groupId, userId])` e índices relacionales.
     - Sincronización completa con SQLite vía `prisma db push` y regeneración del cliente con `prisma generate`.
  2. **Algoritmo Matemático de Derangement (`backend/src/utils/derangement.ts`)**:
     - Implementación del algoritmo de Sattolo ($O(N)$) para permutar los índices con un único ciclo de longitud $N$, garantizando cero auto-asignaciones ($P[i] \neq i$).
  3. **Controladores y Rutas Backend ([`secretSantaController.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/controllers/secretSantaController.ts) & [`secretSantaRoutes.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/routes/secretSantaRoutes.ts))**:
     - `POST /api/secret-santa`: Creación de evento con invitaciones múltiples.
     - `GET /api/secret-santa`: Listado de eventos en los que participa o administra el usuario.
     - `GET /api/secret-santa/:id`: Detalle del evento con blindaje estricto de privacidad (solo el usuario actual recibe su `assignedTo`, todos los demás participantes tienen `assignedTo: null` para evitar fugas por inspección de red) e inclusión de sus listas de deseos públicas y compartidas.
     - `POST /api/secret-santa/:id/draw`: Ejecución del sorteo exclusivo para el creador (mínimo 3 miembros) con transacción atómica en Prisma y envío asíncrono de notificaciones por email.
     - `DELETE /api/secret-santa/:id`: Eliminación de evento (solo creador).
  4. **Servicio de Email Festivo ([`emailService.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/services/emailService.ts))**:
     - Función `sendSecretSantaNotification`: Plantilla HTML festiva responsive con estética de Wishlist Hub, presupuesto sugerido, fecha de intercambio y fallback a consola en desarrollo.
  5. **Frontend - Vistas y Componentes ([`SecretSanta.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/pages/SecretSanta.tsx))**:
     - Tipos y servicio: [`secretSantaService.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/services/secretSantaService.ts) y tipos [`SecretSantaGroupDetail`, `SecretSantaMember`, etc.].
     - Vista `/secret-santa`: Listado de eventos con badges de estado (`Borrador` / `Sorteado`), modal de creación con selección rápida de amigos y búsqueda de usuarios, métricas del evento (participantes, presupuesto, fecha).
     - Tarjeta Interactiva de Revelación (Scratch / Reveal Card): Estado misterioso inicial con botón de revelación para evitar spoilers accidentales, avatar festivo de la persona asignada, opción de ocultar secreto y acceso con 1 clic a sus listas de regalos (`/w/:slug`).
     - Navegación: Enlace "Amigo Invisible 🎅" en cabecera de escritorio y 4ª pestaña en la barra inferior móvil de [`Navbar.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/components/Navbar.tsx).
  6. **Verificación Automatizada**: Script [`verifySecretSanta.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/scripts/verifySecretSanta.ts) (`npm run test:secretsanta`) que valida:
     - 100 iteraciones del algoritmo de Sattolo comprobando cero auto-asignaciones en 3, 5 y 10 participantes.
     - Ciclo completo de base de datos (creación, miembros, persistencia atómica del sorteo).
     - Blindaje estricto de privacidad (asegurando que los campos `assignedTo` de otros miembros son `null`).
- **Estado**: ✅ Implementado al 100%, verificado con pruebas automatizadas y compilación limpia.

### 📱 Corrección de Conectividad Móvil en LAN (Login/Registro en Smartphone) (01/10/2026)
- **Problema**: Al acceder desde el navegador móvil en red local Wi-Fi (`http://192.168.1.135:5173`), los flujos de login y registro fallaban con `Network Error` debido a que las peticiones se enviaban a `http://localhost:5000/api` (el teléfono en lugar del PC).
- **Solución**:
  - `frontend/.env` y `frontend/.env.example`: Actualizado a ruta relativa `VITE_API_URL=/api`.
  - `frontend/vite.config.ts`: Proxy configurado en `/api` (`changeOrigin: true`, `secure: false`) y `/socket.io` (`ws: true`).
  - `frontend/src/services/api.ts`: Interceptor de red que detecta y loguea diagnósticos claros para `[API NETWORK ERROR]`.
- **Estado**: ✅ Corregido y blindado.

### 👥 Feature 2/4: Sistema Social de Amigos, Búsqueda de Usuarios y Acceso LAN (01/10/2026)
- **Objetivo**: Habilitar el acceso táctil desde smartphones en la red Wi-Fi local e integrar un sistema social completo de amigos para buscar usuarios, gestionar solicitudes de amistad, explorar listas accesibles y seleccionar amigos con un solo clic al configurar la whitelist de listas privadas.
- **Implementación**:
  1. **Acceso LAN y Flexibilización de CORS / WebSockets**:
     - Frontend: [`frontend/vite.config.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/vite.config.ts) expone `0.0.0.0:5173`. [`socket.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/services/socket.ts) utiliza `window.location.origin` dinámicamente para que las conexiones HTTP y WebSocket pasen por el proxy de Vite dev server sin URLs hardcodeadas a `localhost`.
     - Backend: Helper [`corsHelper.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/utils/corsHelper.ts) (`isOriginAllowed`) integrado en [`server.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/server.ts) y [`socketService.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/services/socketService.ts), permitiendo orígenes privados RFC 1918 (`192.168.*`, `10.*`, `172.16-31.*`) en modo de desarrollo.
  2. **Modelo de Datos Prisma (`schema.prisma`)**:
     - `enum FriendshipStatus { PENDING, ACCEPTED, REJECTED }`.
     - Modelo `Friendship` con `senderId`, `receiverId`, `status`, claves foráneas con borrado en cascada y restricción única `@@unique([senderId, receiverId])`.
  3. **Controladores y Rutas Backend ([`friendController.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/controllers/friendController.ts) & [`friendRoutes.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/routes/friendRoutes.ts))**:
     - `GET /api/friends`: Lista de amigos aceptados con conteo de listas accesibles.
     - `GET /api/friends/requests`: Solicitudes entrantes y salientes pendientes.
     - `GET /api/friends/search?q=...`: Búsqueda de usuarios verificados calculando en tiempo real su estado (`FRIEND`, `REQUEST_SENT`, `REQUEST_RECEIVED`, `NONE`).
     - `POST /api/friends/request/:receiverId`: Envío o reactivación de solicitud de amistad (con auto-aceptación si era mutua).
     - `PUT /api/friends/request/:requestId`: Aceptación o rechazo de solicitud.
     - `DELETE /api/friends/:friendId`: Eliminación de amistad bidireccional.
     - `GET /api/friends/:friendId/wishlists`: Acceso directo a listas públicas o compartidas con el usuario.
  4. **Frontend - Vistas y Componentes**:
     - Tipos y Servicio: [`friendService.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/services/friendService.ts) y tipos [`Friend`, `FriendRequest`, `UserSearchResult`].
     - Vista [`Friends.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/pages/Friends.tsx) (`/friends`): Barra de búsqueda con autocompletado con debounce (300ms), tabs de "Mis Amigos" y "Solicitudes" con badges, y modal para explorar y abrir regalos del amigo.
     - Navegación: Enlace en [`Navbar.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/components/Navbar.tsx) para escritorio y 3ª columna dedicada en la barra inferior móvil.
     - Integración Whitelist: Pestaña "Mis Amigos" en [`WhitelistModal.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/components/WhitelistModal.tsx) que permite añadir invitados autorizados con un solo clic.
  5. **Verificación Automatizada**: Script [`verifyFriends.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/scripts/verifyFriends.ts) (`npm run test:friends`) validando el ciclo social completo al 100%.
- **Estado**: ✅ Implementado, testeado al 100% y listo para pruebas móviles en red local.

### 🔥 Feature 1/4: Nivel de Deseo (1-10) en Regalos y Barra de Filtros/Ordenación en Lista (01/10/2026)
- **Objetivo**: Permitir calificar el nivel de deseo de un regalo en una escala del 1 al 10 y dotar a la vista de listas de una barra de herramientas con filtros rápidos y ordenaciones dinámicas.
- **Implementación**:
  1. **Modelo de Datos y Validaciones**:
     - Prisma: campo `priority Int @default(5)` añadido al modelo `Item` en [`schema.prisma`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/prisma/schema.prisma). Sincronizado mediante `prisma db push` y `prisma generate`.
     - Zod: esquemas `createItemSchema`, `updateItemSchema` y `batchItemSchema` en [`itemSchemas.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/schemas/itemSchemas.ts) actualizados con sujeción segura (clamping `Math.max(1, Math.min(10, num))`).
     - Controlador: [`itemController.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/controllers/itemController.ts) adaptado en `addItem`, `updateItem` y `addItemsBatch` para extraer, sanitizar y persistir `priority`.
  2. **Frontend - Creación y Edición de Regalo**:
     - Tipos: interfaz `Item` en [`types/index.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/types/index.ts) actualizada con `priority: number`.
     - Modal: [`AddItemModal.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/components/AddItemModal.tsx) enriquecido con selector interactivo de rango 1 a 10 con slider táctil, botones de acceso rápido con gradiente visual y etiquetas dinámicas descriptivas (Casual, Buen deseo, Deseo alto, ¡Imprescindible!). Soporte tanto para creación de items nuevos como para edición en caliente de regalos existentes (`itemToEdit`).
  3. **Frontend - Visualización en Tarjeta (`GiftCard.tsx`)**:
     - Insignia con nivel de deseo e icono de fuego con color dinámico según intensidad (ámbar, naranja o rojo vivo).
     - Barra de progreso estética bajo el precio indicando la intensidad del deseo.
     - Botón de edición rápida integrado para el dueño de la lista (`onEditClick`).
  4. **Frontend - Barra de Filtros y Ordenación en Listas**:
     - Integrado en [`WishlistDetail.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/pages/WishlistDetail.tsx) y [`PublicWishlist.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/pages/PublicWishlist.tsx).
     - Nuevo chip de filtro rápido conmutable "Deseo alto" (filtra regalos con `priority >= 7`) con contador reactivo `highDesireCount`.
     - Nueva opción de ordenación "Nivel de deseo (10 a 1) 🔥" en memoria.
     - Ordenación y filtrado 100% reactivos vía `useMemo`, preservando la compatibilidad con actualizaciones en tiempo real por WebSockets.
  5. **Verificación Automatizada**:
     - Script [`backend/scripts/verifyPriorityAndFilters.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/scripts/verifyPriorityAndFilters.ts) (`npm run test:priority`) validando la persistencia en DB, sujeción Zod (valores fuera de rango como 0, 15, -2 ajustados automáticamente a 1 y 10), actualización de prioridad y ordenación/filtrado algorítmico.
- **Estado**: ✅ Implementado, testeado al 100% y verificado en compilación.

### ⚡ Feature: Sincronización en Tiempo Real con WebSockets (Socket.IO) (01/10/2026)
- **Objetivo**: Evitar colisiones de reservas y compras duplicadas haciendo que el backend notifique al frontend en tiempo real cuando un regalo sea creado, modificado, reservado/comprado o eliminado en una lista abierta, actualizando instantáneamente a todos los visitantes sin recargar (F5).
- **Implementación**:
  1. **Backend (`socket.io`)**:
     - Servidor HTTP nativo Node con `http.createServer(app)` en [`server.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/server.ts), compartiendo el puerto 5000 y configurando CORS con `allowedOrigins`.
     - Módulo de servicio [`socketService.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/services/socketService.ts) para gestión de salas dinámicas (`wishlist:${wishlistId}`) mediante eventos `join_wishlist` y `leave_wishlist`.
     - Emisores de mutaciones: `emitItemCreated`, `emitItemUpdated`, `emitItemDeleted`.
     - Conexión en [`itemController.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/controllers/itemController.ts): disparadas tras transacciones exitosas de Prisma en `addItem`, `addItemsBatch`, `updateItem`, `deleteItem`, `purchaseItem` y `unpurchaseItem`.
     - Privacidad respetada: las compras anónimas / sorpresa se transmiten con `purchasedBy: 'Anónimo'` sin revelar el usuario comprador.
  2. **Frontend (`socket.io-client`)**:
     - Singleton de conexión en [`frontend/src/services/socket.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/services/socket.ts) con soporte para WebSocket/polling y auto-reconexión. Proxy configurado en `vite.config.ts`.
     - Hook personalizado [`useWishlistSocket`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/hooks/useWishlistSocket.ts): orquestación de unión a sala al montar y abandono al desmontar; actualización de estado in-memory sin duplicados.
     - Integración en [`WishlistDetail.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/pages/WishlistDetail.tsx) y [`PublicWishlist.tsx`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/frontend/src/pages/PublicWishlist.tsx).
     - Feedback de UX: Badge "En vivo" con pulso verde en cabecera de la lista, resaltado dinámico (`ring-4 ring-emerald-400 scale-[1.02]`) en la tarjeta del regalo modificado y toasts no intrusivos cuando un item cambia de estado.
  3. **Verificación Automatizada**: Script [`backend/scripts/verifySocketEvents.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/scripts/verifySocketEvents.ts) (`npm run test:socket`) validando conexiones concurrentes, aislamiento entre salas, recepción de eventos y desuscripción limpia.
- **Estado**: ✅ Implementado, verificado al 100% y compilado limpiamente.

### ⚡ Fix UX: Optimización de Rate Limiting con `skipSuccessfulRequests` y Desacoplamiento de OTP (01/10/2026)
- **Problema previo**: Usuarios legítimos eran bloqueados prematuramente con HTTP 429 al completar flujos continuos de autenticación (registro, verificación de OTP, restablecimiento de contraseña e inicio de sesión), debido a que las peticiones HTTP exitosas se contabilizaban dentro del umbral estricto de 5 peticiones.
- **Solución implementada**:
  1. **Exención de peticiones exitosas**: Se configuró `skipSuccessfulRequests: true` en todos los limitadores de autenticación. Las respuestas con código HTTP < 400 (200, 201) no consumen intentos de la cuota.
  2. **Ampliación de cuota general**: `authRateLimiter` incrementado a 20 intentos fallidos en 15 minutos para login, registro y recuperación de clave.
  3. **Limitador dedicado para OTP**: Creación de `otpVerificationLimiter` exclusivo para `POST /api/auth/verify-otp` (5 intentos fallidos permitidos para frenar fuerza bruta sobre códigos de 6 dígitos).
  4. **Bypass para desarrollo local**: Soporte de desactivación opcional mediante `RATE_LIMIT_DISABLED=true` y en entorno de test.
  5. **Verificación**: Suite `npm run test:ratelimit` adaptada para probar que llamadas exitosas sucesivas no bloquean y que solo los fallos reiterados activan el 429.
- **Estado**: ✅ Resuelto, testeado y verificado en monorepo.

### ⏸️ Cierre Oficial del Hito 2 y Entrada en Fase de QA Local (01/10/2026)
- **Estado**: Culminación satisfactoria de todas las funcionalidades, seguridad y robustez del Hito 2.
- **Decisión de Producto**: Congelación temporal del paso a producción (Hito 3) para permitir un ciclo intensivo de pruebas locales, validación de diseño responsivo y afinamiento de UX.
- **Estrategia Futura de Despliegue**: Plan 100% gratuito (Vercel + Render + Turso/Neon + Resend) documentado en `ROADMAP.md` y `DECISIONES.md`.

### 🛡️ Hito 2 - Tarea 3: Rate Limiting y Protección Anti-Fuerza Bruta (01/10/2026)
- **Objetivo**: Proteger los endpoints críticos de autenticación (login, registro, OTP, forgot/reset password) contra ataques de fuerza bruta y saturación, e incorporar un límite preventivo global para toda la API.
- **Implementación**:
  1. **Dependencia**: Instalación e integración de `express-rate-limit` (v8) en `backend/package.json`.
  2. **Middlewares Dedicados ([`backend/src/middleware/rateLimiter.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/middleware/rateLimiter.ts))**:
     - `authRateLimiter`: Límite estricto de 5 solicitudes por IP en una ventana de 15 minutos con respuesta JSON HTTP 429 personalizada (`"Demasiados intentos fallidos. Por favor, inténtalo de nuevo en 15 minutos."`).
     - `apiRateLimiter`: Límite preventivo global de 100 solicitudes por IP cada 15 minutos en `/api/` para impedir scraping masivo y DoS sin afectar el uso regular.
     - Cabeceras estándar IETF `draft-7` (`RateLimit`, `RateLimit-Policy`) y cabeceras obsoletas `X-RateLimit-*` deshabilitadas.
     - Exención en testing: `skip: () => process.env.NODE_ENV === 'test'`.
  3. **Integración en Rutas y Servidor**:
     - Configuración de `app.set('trust proxy', 1)` en [`server.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/server.ts) para despliegues tras proxy inverso (Render, Railway, Vercel, Cloudflare).
     - Aplicación de `apiRateLimiter` en `/api` antes de cargar las rutas principales.
     - Aplicación de `authRateLimiter` en [`authRoutes.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/src/routes/authRoutes.ts) sobre `/register`, `/verify-otp`, `/resend-otp`, `/login`, `/forgot-password` y `/reset-password`.
  4. **Suite de Verificación Automatizada**:
     - Creado [`backend/scripts/verifyRateLimit.ts`](file:///c:/Users/Rafael/Documents/Github/app-ListaDeRegalos/backend/scripts/verifyRateLimit.ts) (script `npm run test:ratelimit`), que comprueba el paso de peticiones 1 a 5, bloqueo con 429 en la 6ª petición, omisión en `NODE_ENV === 'test'` y detección de cabeceras IETF.
- **Estado**: ✅ Implementado, verificado con tests al 100% y compilación exitosa. Cerrando el Hito 2 al 100%.

### 🗑️ Hito 2 - Tarea 2: Limpieza de Imágenes Huérfanas en Disco y Corrección de tsconfig.json (01/10/2026)
- **Objetivo**: Corregir la advertencia de deprecación de `moduleResolution` en TypeScript y garantizar que los archivos de imagen locales en `backend/uploads/items/` se eliminen automáticamente al borrar o modificar regalos o listas, con blindaje estricto de seguridad.
- **Implementación**:
  1. **Actualización de tsconfig.json**: Configuración de `"module": "NodeNext"` y `"moduleResolution": "NodeNext"` en `backend/tsconfig.json` (resolviendo la advertencia hacia TS 7.0 sin romper imports ni tsx). Frontend confirmado con `"moduleResolution": "bundler"`.
  2. **Helper Seguro `backend/src/utils/fileStorage.ts`**:
     - `deleteLocalFile(relativePathOrUrl)` y `deleteLocalFiles(pathsOrUrls)` asíncronos y desacoplados.
     - Detección y descarte transparente de URLs externas (`https://`, `http://`, Steam CDN).
     - Protección estricta contra Path Traversal (`path.relative` dentro de `backend/uploads/items/`).
     - Protección inviolable para `.gitkeep` y archivos del sistema.
     - Manejo tolerante de archivos inexistentes (`ENOENT`) y validación de archivos regulares (`stat.isFile()`).
  3. **Integración en Controladores**:
     - `deleteItem` (`DELETE /api/items/:id`): Borrado de imagen local en disco *después* de la eliminación exitosa en Prisma.
     - `updateItem` (`PUT /api/items/:id`): Borrado de la imagen previa en disco al subir una nueva imagen, suministrar una URL externa o solicitar `removeImage`.
     - Rollback preventivo: En caso de error o rechazo de permisos en `addItem` o `updateItem`, cualquier archivo recién subido por Multer se elimina en el bloque `catch`.
     - `deleteWishlist` (`DELETE /api/wishlists/:id`): Limpieza en lote de imágenes huérfanas de todos los items locales de la lista eliminada.
     - Centralización de `UPLOADS_ITEMS_DIR` en `uploadMiddleware.ts`, `dbReset.ts` y `fileStorage.ts`.
  4. **Suite de Pruebas Automatizadas**: Script `backend/scripts/verifyFileCleanup.ts` (ejecutable con `npm run test:cleanup`) con 7 pruebas que cubren valores nulos/inválidos, URLs remotas, protección de `.gitkeep`, 3 ataques de Path Traversal bloqueados, borrado físico, borrado en lote y ciclo de vida completo en base de datos.
- **Estado**: ✅ Implementado, testeado al 100% y compilado limpiamente en todo el monorepo.

### ⚡ Fix Urgente: Carga Síncrona Multi-Ruta de `process.env` en Monorepo (26/09/2026)
- **Problema previo**: Al ejecutar el servidor con `npm run dev` desde la raíz del monorepo, `process.cwd()` apuntaba a la raíz donde no existía `.env`, provocando que `dotenv.config()` no cargara `backend/.env` y dejando `DB_AUTO_RESET` y `RESEND_API_KEY` como `undefined`.
- **Solución implementada**:
  1. Creación de `backend/src/config/env.ts` importado en la primera línea absoluta de `server.ts`.
  2. Resolución candidata de rutas: `path.resolve(__dirname, '../.env')`, `path.resolve(process.cwd(), 'backend/.env')` y `path.resolve(process.cwd(), '.env')`.
  3. Lectura dinámica en tiempo de ejecución de las variables en los servicios.
  4. Probado y validado tanto el vaciado de base de datos como el envío real a través de la API de Resend (`ID: 01a0df22-b5ae-759b-91bc-a1c365240378`).
- **Estado**: ✅ Resuelto, testeado y verificado en monorepo.

### 📧 Hito 2 - Tarea 1: Servicio de Email Transaccional para OTP y Auth (26/09/2026)
- **Objetivo**: Habilitar el envío real de correos electrónicos con códigos OTP para registro y recuperación de contraseñas mediante Resend, preservando un fallback a consola para desarrollo local.
- **Implementación**:
  1. Integración del SDK de `resend` en el backend.
  2. Implementación de `backend/src/services/emailService.ts` con la función `sendOtpEmail(to, otpCode, userName, type)`.
  3. Plantilla dual con diseño de marca Wishlist Hub: HTML moderno responsive (bloque OTP destacado, degradado superior, aviso de expiración de 10 min) y versión en texto plano.
  4. Fallback resiliente: Cuando `RESEND_API_KEY` está vacío o no configurado, emite `[DEV EMAIL FALLBACK] Código OTP para {email}: {code}` en consola sin lanzar excepciones.
  5. Conexión en `backend/src/controllers/authController.ts` (registro, reenvío y forgot password) con personalización por nombre de usuario.
  6. Confirmación de seguridad: El código OTP permanece oculto del payload JSON retornado al cliente.
  7. Variables documentadas en `backend/.env.example` y configuradas en `backend/.env`.
- **Estado**: ✅ Implementado, testeado y compilado con éxito.

### 🧹 Helper de Desarrollo: Reseteo Automático de Base de Datos y Uploads (`DB_AUTO_RESET`) (26/09/2026)
- **Objetivo**: Facilitar pruebas iterativas en desarrollo local sin colisiones por registros duplicados en base de datos ni archivos huérfanos.
- **Implementación**:
  1. Módulo de utilidad `backend/src/utils/dbReset.ts` con funciones `autoResetDatabase()` y `resetDatabase()`.
  2. Vaciado transaccional de tablas Prisma respetando claves foráneas (`Item`, `SavedWishlist`, `WishlistWhitelist`, `AuthOtp`, `Wishlist`, `User`).
  3. Limpieza de imágenes en `backend/uploads/items/` preservando `.gitkeep`.
  4. Activación estrictamente condicional por variable de entorno `DB_AUTO_RESET=true` en `backend/.env`.
  5. Protección de seguridad: Se desactiva y advierte si `NODE_ENV === 'production'`.
  6. Sub-tarea registrada en el Hito 3 de `ROADMAP.md` para verificación o retiro previo a producción.
- **Estado**: ✅ Implementado, testeado y validado en servidor local.

### 🌓 Resolución de Bug: Selector de Modo Claro / Modo Oscuro (26/09/2026)
- **Problema previo**: El selector en el Navbar no producía cambios visuales; la interfaz permanecía fija en modo oscuro si el sistema operativo tenía preferencia oscura.
- **Causa raíz**: `frontend/tailwind.config.js` no declaraba explícitamente `darkMode: 'class'`, lo que provocaba que Tailwind v3 compilara todas las clases `dark:` bajo la media query `@media (prefers-color-scheme: dark)`. Por tanto, añadir o quitar la clase `.dark` en el DOM no tenía efecto visual sobre las reglas generadas.
- **Solución implementada**:
  1. Configuración de `darkMode: 'class'` en `frontend/tailwind.config.js`.
  2. Inicialización y sincronización de tema en `frontend/src/context/ThemeContext.tsx` con persistencia dual en `localStorage` (`'theme'` y `'wishlist_theme'`) y ajuste de `document.documentElement.style.colorScheme`.
  3. Script anti-FOUC (Flash of Unstyled Content) en `frontend/index.html` para sincronizar la clase `.dark` y `colorScheme` antes del renderizado de la app.
  4. Sincronización visual del botón toggle en `frontend/src/components/Navbar.tsx`: Sol (`Sun`) para modo claro activo y Luna (`Moon`) para modo oscuro activo, con etiquetas de accesibilidad (`aria-label` y `title`) claras.
- **Estado**: ✅ Resuelto, testeado y compilado con éxito.
