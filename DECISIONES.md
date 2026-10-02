# 📋 Registro de Decisiones Técnicas (ADR / Decisiones de Arquitectura)

---

## [2026-09-26] Configuración de Modo Oscuro Class-Based en Tailwind CSS y Persistencia Dual de Tema

### Contexto
Al activar el botón de cambio de tema entre claro y oscuro en el frontend, la interfaz no reflejaba ningún cambio visual y se mantenía en modo oscuro en navegadores con preferencia de sistema operativo oscuro. Al inspeccionar el CSS compilado por Vite/Tailwind, las clases `dark:...` se encontraban contenidas dentro de `@media (prefers-color-scheme: dark)`.

### Decisiones Adoptadas

#### 1. Configuración explícita `darkMode: 'class'` en Tailwind CSS
- **Decisión**: Añadir `darkMode: 'class'` en `frontend/tailwind.config.js`.
- **Razón**: Por defecto en Tailwind CSS v3, si la clave `darkMode` no está presente, Tailwind adopta la estrategia `'media'`, generando reglas CSS bajo `@media (prefers-color-scheme: dark)`. Bajo esa estrategia, la clase `.dark` en la etiqueta `<html>` es completamente ignorada. Al configurar `'class'`, Tailwind compila las clases bajo el selector `:is(.dark *)`, permitiendo control programático dinámico reactivo al DOM.

#### 2. Compatibilidad y Persistencia Dual en `localStorage`
- **Decisión**: Leer de `localStorage.getItem('theme') || localStorage.getItem('wishlist_theme')` y guardar en ambas claves (`'theme'` y `'wishlist_theme'`).
- **Razón**: Permite cumplir la convención estándar del ecosistema web (`'theme'`) solicitada en los requisitos, manteniendo al mismo tiempo retrocompatibilidad total con cualquier sesión previa que tuviese la clave `'wishlist_theme'`.

#### 3. Sincronización Inmediata contra FOUC y soporte de `color-scheme`
- **Decisión**: Mantener y actualizar el script síncrono en el `<head>` de `frontend/index.html` y asegurar que `ThemeContext.tsx` sincronice tanto `document.documentElement.classList` como `document.documentElement.style.colorScheme = 'light' | 'dark'`.
- **Razón**: Evita el parpadeo de pantalla blanca/oscura durante la carga (Flash of Unstyled Content) y permite que los controles nativos del navegador (barras de desplazamiento, inputs de formularios nativos) adapten su paleta automáticamente al tema seleccionado.

#### 4. Semántica Visual del Toggle en Navbar
- **Decisión**: Mostrar el icono de Sol (`Sun`) cuando el tema activo es `'light'` (Modo Claro) y el icono de Luna (`Moon`) cuando el tema activo es `'dark'` (Modo Oscuro), con etiquetas accesibles `title` y `aria-label` que indiquen la acción de cambio.
- **Razón**: Otorga una retroalimentación visual clara e inequívoca del estado del sistema en todo momento, respondiendo a la especificación de "sol para modo claro, luna para modo oscuro".

---

## [2026-09-26] Mecanismo Condicional de Reseteo Automático de Base de Datos para Desarrollo Local (`DB_AUTO_RESET`)

### Contexto
Durante el ciclo iterativo de desarrollo y pruebas locales, los registros acumulados (usuarios registrados, OTPs, listas duplicadas, reservas y archivos de imagen subidos en `uploads/`) generan colisiones de unicidad (`unique constraint` en emails/usernames) y acumulación de datos obsoletos, ralentizando el flujo de trabajo del desarrollador.

### Decisiones Adoptadas

#### 1. Activación Condicional Estricta por Variable de Entorno
- **Decisión**: El reseteo automático de base de datos solo se ejecuta si `process.env.DB_AUTO_RESET === 'true'`. En `backend/.env` se activa por defecto para agilizar desarrollo local (`DB_AUTO_RESET=true`) y se documenta en `backend/.env.example` desactivado (`DB_AUTO_RESET=false`).
- **Razón**: Evita hardcodear lógica destructiva en el flujo estándar de la aplicación y garantiza que el borrado sea una decisión explícita de configuración.

#### 2. Blindaje de Seguridad frente a Entornos de Producción
- **Decisión**: Si `process.env.NODE_ENV === 'production'`, el helper `autoResetDatabase()` rechaza categóricamente la ejecución emitiendo una advertencia de seguridad (`[SEGURIDAD] DB_AUTO_RESET ignorado`), incluso si por descuido `DB_AUTO_RESET=true` estuviese presente.
- **Razón**: Protección en profundidad (*defense-in-depth*) contra pérdida accidental de datos en despliegues reales o staging productivo.

#### 3. Limpieza Integral de Datos y Archivos Huérfanos
- **Decisión**: El reseteo abarca:
  1. Transacción Prisma para vaciar tablas respetando claves foráneas: `Item`, `SavedWishlist`, `WishlistWhitelist`, `AuthOtp`, `Wishlist`, `User`.
  2. Eliminación de todos los archivos generados en `backend/uploads/items/`, preservando `.gitkeep`.
- **Razón**: Mantener paridad absoluta entre los registros en BD y los archivos estáticos en disco, evitando referencias rotas o imágenes fantasmas.

#### 4. Compromiso de Desactivación y Retirada Previa a Producción
- **Decisión**: Se ha registrado como tarea explícita en el Hito 3 del `ROADMAP.md` la verificación o remoción de `DB_AUTO_RESET` antes del despliegue productivo.

---

## [2026-09-26] Integración de Resend como Servicio de Email Transaccional con Fallback a Consola

### Contexto
Para el Hito 2 (Robustez y Notificaciones Reales), se requería el envío de correos electrónicos transaccionales reales con los códigos OTP de verificación (registro y restablecimiento de contraseña). No obstante, para no forzar a los desarrolladores ni a los entornos de CI/CD locales a disponer de una cuenta o credenciales activas de Resend para correr y probar el sistema, era imprescindible una arquitectura tolerante y transparente de fallback.

### Decisiones Adoptadas

#### 1. Elección de Resend como Proveedor Transaccional
- **Decisión**: Utilizar el SDK oficial de `resend` en el backend.
- **Razón**: Resend ofrece una API HTTP moderna, fiable, con soporte oficial de TypeScript, alta tasa de entrega en bandejas de entrada, excelente soporte para testing con el remitente por defecto `onboarding@resend.dev` y una integración más limpia y ligera que configuraciones manuales complejas de transporte SMTP.

#### 2. Arquitectura de Fallback Resiliente a Consola
- **Decisión**: Si `process.env.RESEND_API_KEY` está vacío o no está definido, o si la llamada a la API de Resend falla en desarrollo:
  1. El servicio `emailService.sendOtpEmail` no lanza excepciones fatales ni interrumpe la petición del usuario (evitando errores 500 no deseados).
  2. Imprime un log claro e indexable: `[DEV EMAIL FALLBACK] Código OTP para {email}: {code}`, junto con un cuadro visual en terminal con la información de expiración.
- **Razón**: Permite arrancar y probar el flujo de autenticación de principio a fin de manera local sin necesidad de configurar una API key real.

#### 3. Plantilla Dual (HTML Responsive + Texto Plano)
- **Decisión**: Se crearon dos generadores de plantilla (`generateHtmlOtpEmail` y `generatePlainTextOtpEmail`):
  - **HTML**: Diseño responsive con estética nativa de Wishlist Hub (degradado de marca en cabecera, contenedor centrado con bordes redondeados y sombra, código OTP en recuadro destacado con fuente monospace grande y espaciada, badges contextuales y aviso de expiración en 10 minutos).
  - **Texto plano**: Formato conciso con el código y advertencias de seguridad para clientes de correo legacy o lectores de pantalla.
- **Razón**: Máxima compatibilidad y experiencia de usuario atractiva sin dependencias externas pesadas de renderizado como MJML.

#### 4. Ocultación Estricta del OTP en Respuestas JSON
- **Decisión**: Confirmar y mantener que ningún endpoint (`/api/auth/register`, `/api/auth/resend-otp`, `/api/auth/forgot-password`) retorne el código OTP en la carga útil JSON.
- **Razón**: Garantiza la seguridad del flujo OTP impidiendo que inspecciones de red en el navegador permitan eludir la verificación del correo.

---

## [2026-09-26] Resolución Robusta Multi-Ruta de dotenv para Monorepo

### Contexto
Al ejecutar el servidor mediante scripts del monorepo (`npm run dev`), el directorio de trabajo del proceso (`process.cwd()`) es la raíz del monorepo (`/app-ListaDeRegalos`), mientras que el archivo `.env` se encuentra alojado en `/app-ListaDeRegalos/backend/.env`. Al ejecutarse `dotenv.config()` de forma estándar sin argumentos, dotenv buscaba el archivo en la raíz y fallaba silenciosamente, provocando que variables críticas como `DB_AUTO_RESET` y `RESEND_API_KEY` quedaran como `undefined`.

### Decisiones Adoptadas

#### 1. Módulo Centralizado `config/env.ts` e Inclusión Temprana
- **Decisión**: Se creó un cargador dedicado `backend/src/config/env.ts` que se importa en la primera línea absoluta de `server.ts` antes que cualquier módulo de Express o Prisma.
- **Razón**: Garantiza que `process.env` esté poblado desde el instante cero antes de que se evalúe cualquier import dependiente.

#### 2. Resolución Candidata Multi-Ruta
- **Decisión**: Evaluar de forma secuencial y acumulativa las siguientes rutas candidatas comprobando su existencia previa con `fs.existsSync`:
  1. `path.resolve(__dirname, '../.env')`: Relativa a la ubicación del código fuente en `backend/src` (funciona siempre sin importar el CWD).
  2. `path.resolve(process.cwd(), 'backend/.env')`: Cuando se ejecuta desde la raíz del monorepo (`npm run dev`).
  3. `path.resolve(process.cwd(), '.env')`: Cuando se ejecuta dentro de `backend/` (`cd backend && npm run dev`).
  4. `path.resolve(__dirname, '../../.env')`: Si en el futuro se añade un `.env` global de monorepo.
- **Razón**: Elimina la fragilidad frente a la carpeta de invocación del comando, permitiendo que tanto `npm run dev` en raíz como `npm run dev:backend` funcionen de manera idéntica y transparente.

---

## [2026-10-01] Limpieza Automática Segura de Imágenes Huérfanas y Migración a `moduleResolution: NodeNext`

### Contexto
1. **Deprecación de TypeScript**: En `backend/tsconfig.json`, la opción `"moduleResolution": "node"` (algoritmo legacy Node10) fue marcada como obsoleta en TypeScript 5.x hacia TypeScript 7.0. En frontend ya se utilizaba `"bundler"`, acorde a Vite.
2. **Archivos Huérfanos en Disco**: Al eliminar o actualizar regalos locales (`imageType: LOCAL`), los archivos físicos acumulaban basura en `backend/uploads/items/`. Además, el borrado no contaba con validaciones contra vulnerabilidades de *Path Traversal* (ej. `../../`), ni protección explícita para archivos esenciales como `.gitkeep`, ni borrado en cascada cuando una lista entera era eliminada.

### Decisiones Adoptadas

#### 1. Actualización de TypeScript (`module` y `moduleResolution: NodeNext`)
- **Decisión**: Configurar en `backend/tsconfig.json`:
  ```json
  "module": "NodeNext",
  "moduleResolution": "NodeNext"
  ```
- **Razón**: `NodeNext` es el estándar moderno recomendado para entornos Node.js en TypeScript 5+, resuelve módulos con total compatibilidad con CommonJS/ESM y `tsx`, y elimina cualquier advertencia de deprecación hacia TypeScript 7.0 sin romper imports ni requerir reescritura de extensiones. En el frontend se validó la presencia de `"moduleResolution": "bundler"` en `tsconfig.json` y `tsconfig.node.json`.

#### 2. Helper Centralizado y Seguro de Eliminación (`backend/src/utils/fileStorage.ts`)
- **Decisión**: Diseñar la función asíncrona `deleteLocalFile(relativePathOrUrl: string): Promise<void>` y `deleteLocalFiles(pathsOrUrls: string[]): Promise<void>`.
- **Razón**: Centralizar la lógica de manipulación de archivos desacoplada de los controladores, facilitando pruebas unitarias y reutilización en múltiples endpoints.

#### 3. Blindaje contra Path Traversal y Reglas de Protección
- **Decisión**:
  1. **Ignorar URLs externas**: Expresión regular `/^(?:https?:|\/\/|data:)/i` que ignora de inmediato imágenes remotas (Steam CDN, enlaces web).
  2. **Sanitización de prefijo**: Remoción de cualquier prefijo `/uploads/items/` o `uploads/items/`.
  3. **Protección de archivos del sistema**: Verificación estricta de `path.basename(path) !== '.gitkeep'`.
  4. **Validación de directorio permitido**: Resolución con `path.resolve(UPLOADS_ITEMS_DIR, cleanPath)` y comprobación de que `path.relative(UPLOADS_ITEMS_DIR, resolvedPath)` no empiece con `..`, no sea ruta absoluta foránea y no apunte al directorio raíz en sí.
  5. **Manejo de inexistencia silencioso (ENOENT)**: Si el archivo no existe en disco, se ignora limpiamente sin arrojar excepciones ni romper la respuesta HTTP del endpoint.
  6. **Comprobación de archivo regular**: Solo ejecuta `fs.promises.unlink` si `stat.isFile()` es verdadero (evitando borrar carpetas).

#### 4. Integración Atómica en el Ciclo de Vida de Regalos y Listas
- **Decisión**:
  - **DELETE `/api/items/:id`**: El archivo físico se borra de disco *únicamente tras* la eliminación exitosa en Prisma (`await prisma.item.delete(...)`), evitando inconsistencias si la transacción de base de datos fallara.
  - **PUT `/api/items/:id`**: Si se reemplaza la imagen por otra nueva (archivo local o URL externa) o si se quita explícitamente (`removeImage=true`), se guarda la ruta anterior y se borra de disco tras la confirmación del `prisma.item.update(...)`.
  - **Rollback de archivos subidos por Multer en caso de error**: Si la base de datos o validación arrojan una excepción durante `addItem` o `updateItem`, el archivo temporal recién subido por Multer (`req.file`) es eliminado automáticamente en el bloque `catch` para no dejar huérfanos.
  - **DELETE `/api/wishlists/:id`**: Antes de eliminar la lista, se consultan todos los items hijos con `imageType: LOCAL`. Tras borrar la lista en BD (que borra en cascada los items en SQLite), se eliminan en lote todos sus archivos asociados en disco mediante `deleteLocalFiles`.

---

## [2026-10-01] Estrategia de Rate Limiting y Protección Anti-Fuerza Bruta con `express-rate-limit`

### Contexto
Los endpoints de autenticación y verificación de códigos OTP (`/api/auth/register`, `/api/auth/login`, `/api/auth/verify-otp`, `/api/auth/resend-otp`, `/api/auth/forgot-password`, `/api/auth/reset-password`) son vectores críticos de ataque ante intentos de adivinación de contraseñas, enumeración de usuarios y saturación del proveedor transaccional de correo (Resend). Asimismo, era necesario proteger la totalidad de la API contra scraping abusivo y ataques de denegación de servicio (DoS) sin degradar la experiencia de navegación de usuarios legítimos ni entorpecer suites de pruebas automatizadas.

### Decisiones Adoptadas

#### 1. Elección de `express-rate-limit`
- **Decisión**: Integrar `express-rate-limit` (v8) como middleware estándar en Express.
- **Razón**: Es la solución madura de referencia en el ecosistema Node.js/Express, ligera, sin necesidad obligatoria de Redis en etapas tempranas (almacenamiento en memoria en proceso), altamente configurable y compatible con estándares modernos IETF (`draft-7`).

#### 2. Limitador Estricto de Autenticación / OTP (`authRateLimiter`)
- **Decisión**:
  - **Ventana temporal**: 15 minutos (`windowMs = 15 * 60 * 1000`).
  - **Cuota máxima**: 5 solicitudes por IP dentro de la ventana.
  - **Respuesta personalizada**: Código HTTP 429 (Too Many Requests) con payload JSON estructurado:
    ```json
    {
      "success": false,
      "message": "Demasiados intentos fallidos. Por favor, inténtalo de nuevo en 15 minutos."
    }
    ```
  - **Rutas protegidas**: `/register`, `/verify-otp`, `/resend-otp`, `/login`, `/forgot-password`, `/reset-password`.
- **Razón**: 5 intentos en 15 minutos es un límite seguro para evitar fuerza bruta sobre códigos OTP numéricos de 6 dígitos y passwords, sin impedir que un usuario legítimo ingrese sus credenciales con margen razonable de reintento.

#### 3. Limitador Preventivo Global de API (`apiRateLimiter`)
- **Decisión**:
  - **Ventana temporal**: 15 minutos.
  - **Cuota máxima**: 100 solicitudes por IP.
  - **Respuesta personalizada**: Código HTTP 429 con `{ success: false, message: "Has superado el límite de peticiones permitidas. Por favor, inténtalo de nuevo más tarde." }`.
  - **Alcance**: Aplicado en `server.ts` de forma global sobre el prefijo `/api/`.
- **Razón**: Permite la navegación fluida, carga reactiva de regalos y llamadas continuas de la Single Page Application (React) mientras previene scraping descontrolado y ataques de saturación.

#### 4. Cabeceras IETF y Configuración de Reverse Proxy
- **Decisión**:
  - Configurar `standardHeaders: 'draft-7'` y `legacyHeaders: false` para adherirse al borrador moderno de la IETF (`RateLimit`, `RateLimit-Policy`).
  - Habilitar `app.set('trust proxy', 1)` en Express.
- **Razón**: Garantiza que al desplegar la aplicación detrás de proxies inversos o balanceadores de carga (Render, Railway, Vercel, Nginx, Cloudflare), la IP evaluada por el limitador corresponda a la IP real del cliente (`X-Forwarded-For`) y no a la IP interna del proxy.

#### 5. Exención Condicional en Entorno de Pruebas
- **Decisión**: `skip: () => process.env.NODE_ENV === 'test'` en ambos limitadores.
- **Razón**: Evita que pruebas unitarias o de integración automatizadas de alta velocidad (CI/CD) colisionen falsamente contra los umbrales de rate limit.

---

## [2026-10-01] Cierre Formal del Hito 2, Fase de QA Local y Estrategia de Publicación Gratuita (Coste Cero)

### Contexto
Con la finalización y verificación de todas las tareas del Hito 2 (servicio de correo transaccional, limpieza automática segura de imágenes huérfanas en disco y protección anti-fuerza bruta con rate limiting), la aplicación ha alcanzado estabilidad técnica completa. Antes de proceder con el aprovisionamiento de infraestructura en la nube (Hito 3), el equipo de producto decidió priorizar una etapa intensiva de pruebas locales, validación de usabilidad (UX/UI en desktop y móvil) y refinamiento estético sin incurrir en costes operativos ni dependencias de despliegues prematuros.

### Decisiones Adoptadas

#### 1. Cierre Oficial del Hito 2 y Pausa Estratégica del Hito 3
- **Decisión**: Declarar completado al 100% el Hito 2 y pausar temporalmente el Hito 3 (Preparación para Despliegue y Producción).
- **Razón**: Asegurar la máxima madurez del producto antes del lanzamiento público, permitiendo iterar rápidamente en local sobre detalles de interacción y feedback de usuario sin la fricción de ciclos de despliegue en remoto.

#### 2. Selección de Stack de Infraestructura 100% Gratuito (Coste Cero)
Para el momento en que se reactive el Hito 3, se ha seleccionado formalmente una arquitectura de producción sostenible sin coste:
- **Frontend**: **Vercel** o **Render Static Site**:
  - Despliegue continuo (CI/CD) automático vinculado a ramas de GitHub.
  - Certificados SSL/TLS gestionados y red perimetral global (Edge CDN).
- **Backend**: **Render Web Service (Free Tier)**:
  - Soporte nativo para Node.js / Docker.
  - Suspensión automática por inactividad tras 15 minutos y reanudación transparente en la primera petición.
- **Base de Datos**: **Turso SQLite Serverless (libSQL)** o **Neon PostgreSQL (Serverless)**:
  - Nivel gratuito permanente con persistencia garantizada sin expiración.
  - Mantiene compatibilidad total con Prisma ORM.
- **Emails Transaccionales**: **Resend (Free Tier)**:
  - Cuota mensual gratuita de 3.000 emails (100 diarios), más que suficiente para validaciones de registro y recuperación de contraseñas.

#### 3. Salvaguarda Obligatoria Previa a Producción (`DB_AUTO_RESET`)
- **Decisión**: Establecer como requisito no negociable de despliegue la desactivación estricta de `DB_AUTO_RESET` (`DB_AUTO_RESET=false` o no declarada) en los paneles de variables de entorno de producción.
- **Razón**: Prevenir pérdida accidental de datos de usuarios reales en producción, reforzado por el blindaje ya existente en código (`NODE_ENV === 'production'`).

---

## [2026-10-01] Optimización de UX en Rate Limiting: `skipSuccessfulRequests` y Desacoplamiento de OTP

### Contexto
Durante las pruebas de usuario en flujos completos de autenticación (ej. solicitud de recuperación de contraseña -> verificación de OTP -> restablecimiento de contraseña -> inicio de sesión), el limitador inicial bloqueaba prematuramente a usuarios legítimos con HTTP 429 ("Demasiados intentos fallidos"). Esto ocurría porque:
1. Se contabilizaban todas las peticiones, incluidas las satisfactorias (HTTP 200/201).
2. Se compartía una cuota agregada muy reducida (5 peticiones) entre múltiples rutas del flujo de autenticación.

### Decisiones Adoptadas

#### 1. Activación de `skipSuccessfulRequests: true`
- **Decisión**: Configurar `skipSuccessfulRequests: true` en los limitadores de autenticación.
- **Razón**: Las peticiones con códigos HTTP < 400 (éxito) son descartadas del conteo de cuota al finalizar la respuesta. La tasa límite penaliza única y exclusivamente los intentos fallidos (credenciales erróneas, OTP inválido o expirado, errores 4xx/5xx).

#### 2. Separación de Responsabilidades y Ajuste de Umbrales
- **Decisión**:
  - `authRateLimiter`: Límite elevado a **20 intentos fallidos por IP en 15 minutos** para `/login`, `/register`, `/resend-otp`, `/forgot-password` y `/reset-password`.
  - `otpVerificationLimiter`: Limitador específico e hiperestricto para `POST /api/auth/verify-otp` con **5 intentos fallidos de OTP por IP en 15 minutos**.
- **Razón**: Protege de forma quirúrgica contra fuerza bruta sobre códigos numéricos de 6 dígitos en `verify-otp` sin ahogar el resto de operaciones legítimas de la cuenta.

#### 3. Bypass Configurable en Entorno Local (`RATE_LIMIT_DISABLED`)
- **Decisión**: Permitir omitir los limitadores si `process.env.NODE_ENV === 'test'` o si se define `process.env.RATE_LIMIT_DISABLED === 'true'`.
- **Razón**: Agiliza las pruebas manuales continuas del desarrollador en local sin necesidad de esperar ventanas de enfriamiento de 15 minutos.

---

## [2026-10-01] Sincronización en Tiempo Real con WebSockets (Socket.IO)

### Contexto
Cuando múltiples usuarios o invitados interactúan simultáneamente sobre una misma lista de regalos (o el creador agrega/modifica items mientras un invitado visualiza la lista compartida), existía riesgo de colisión o compras duplicadas debido a la falta de actualización reactiva. Los usuarios debían recargar la página (F5) manualmente para enterarse de que un regalo ya había sido comprado o reservado.

### Decisiones Adoptadas

#### 1. Servidor Socket.IO Integrado con Servidor HTTP de Express
- **Decisión**: Integrar `socket.io` (v4) envolviendo la aplicación Express con `http.createServer(app)` en `backend/src/server.ts`, compartiendo el mismo puerto HTTP (5000) y manejando CORS a través de `allowedOrigins`.
- **Razón**: Permite mantener una arquitectura unificada y simplificada donde la API REST y las conexiones WebSocket operan en la misma instancia y puerto, facilitando el futuro despliegue detrás de un proxy inverso.

#### 2. Salas por Lista (`wishlist:${wishlistId}`) y Emisiones Atómicas
- **Decisión**: En `backend/src/services/socketService.ts`, implementar un sistema de salas dinámicas:
  - Eventos de sala: `join_wishlist` y `leave_wishlist`.
  - Mutaciones emitidas a la sala:
    - `item:created`: Al agregar un regalo individual (`addItem`) o en lote (`addItemsBatch`).
    - `item:updated`: Al modificar datos del regalo (`updateItem`), marcarlo como reservado (`purchaseItem`) o desmarcarlo (`unpurchaseItem`).
    - `item:deleted`: Al eliminar un regalo (`deleteItem`), transmitiendo `{ id, wishlistId }`.
- **Razón**: El uso de salas garantiza un aislamiento estricto (los visitantes de una lista no reciben tráfico ni notificaciones de otras listas ajenas) y minimiza el ancho de banda del servidor.

#### 3. Privacidad y Modo Sorpresa
- **Decisión**: Al emitir `item:updated` tras una reserva anónima o sorpresa (`purchasedBy: 'Anónimo'`), la carga útil conserva el identificador anónimo sin revelar el usuario real del comprador.
- **Razón**: Cumple estrictamente con el principio de sorpresa y confidencialidad para el destinatario del regalo.

#### 4. Frontend React: Cliente Singleton y Hook Reutilizable `useWishlistSocket`
- **Decisión**:
  - Singleton en `frontend/src/services/socket.ts` con soporte multi-transporte (`websocket`, `polling`) y auto-reconexión.
  - Proxy de `/socket.io` con `ws: true` en `frontend/vite.config.ts` para desarrollo local transparente.
  - Hook `useWishlistSocket` (`frontend/src/hooks/useWishlistSocket.ts`) integrado en `WishlistDetail.tsx` y `PublicWishlist.tsx`.
  - Indicador visual "En vivo" con badge animado en la cabecera cuando la conexión WebSocket está activa.
  - Resaltado temporal visual (`ring-4 ring-emerald-400 scale-[1.02]` durante 3 segundos) y micro-toasts informativos al recibir mutaciones de otros usuarios.
- **Razón**: Reactividad inmediata sin necesidad de polling HTTP continuo, mejorando drásticamente la experiencia de usuario y previniendo compras redundantes.

#### 5. Verificación Automatizada con `npm run test:socket`
- **Decisión**: Implementar `backend/scripts/verifySocketEvents.ts` que simula conexiones simultáneas de múltiples clientes, unión a salas distintas, emisión de mutaciones, verificación de aislamiento de salas y desuscripción limpia con `leave_wishlist`.
- **Razón**: Garantiza la estabilidad del ciclo de vida de WebSockets en el pipeline de CI/CD y pruebas locales.

---

## [2026-10-01] Nivel de Deseo (1-10) en Regalos y Barra de Filtros/Ordenación en Lista

### Contexto
Para orientar a los invitados y amigos sobre qué regalos son más prioritarios o anhelados por el creador de la lista, se requería una escala explícita del 1 al 10 en cada regalo. Asimismo, las vistas de detalle y pública necesitaban una barra de herramientas con filtros rápidos y opciones de ordenación dinámicas e inmediatas para encontrar regalos por urgencia de deseo, disponibilidad y precio.

### Decisiones Adoptadas

#### 1. Atributo `priority` en Modelo Prisma y Clamping Seguro
- **Decisión**: Añadir `priority Int @default(5)` en el modelo `Item` de `schema.prisma`.
- **Validación**: En `itemSchemas.ts`, validar valores enteros de 1 a 10 con clamping seguro (`Math.max(1, Math.min(10, num))`) y valor por defecto de 5 si no se especifica.
- **Razón**: Permite calificar la urgencia o deseo del item sin obligar al usuario a un valor complejo y manteniendo la integridad en base de datos.

#### 2. Selector Interactivo de Deseo en Creación y Edición (`AddItemModal.tsx`)
- **Decisión**:
  - Implementar un selector dual táctil: slider interactivo de rango (1-10) junto a una botonera de acceso rápido (1 a 10) para un solo toque.
  - Indicador dinámico de estado con etiquetas temáticas y código de color:
    * 1-4: Casual / Detalle (gris/azul)
    * 5-6: Buen deseo (ámbar)
    * 7-8: Deseo alto (naranja / fuego)
    * 9-10: ¡Imprescindible! (rosa / rojo fuego)
  - Soporte completo para edición (`itemToEdit`) en `AddItemModal.tsx` y botón de edición en la tarjeta del regalo para el dueño.

#### 3. Visualización en Tarjeta de Regalo (`GiftCard.tsx`)
- **Decisión**:
  - Badge superior de nivel de deseo con icono de fuego (`Flame`) y color correspondiente a la intensidad.
  - Barra medidora de progreso porcentual debajo del precio con degradado dinámico.
  - Botón de edición rápida accesible para el dueño de la lista.

#### 4. Barra de Filtros Rápidos y Ordenación en Tiempo Real
- **Decisión**:
  - En `WishlistDetail.tsx` y `PublicWishlist.tsx`, añadir chip conmutable "Deseo alto" (filtra `priority >= 7`) junto a "Todos", "Disponibles" y "Comprados / Reservados".
  - Opción de ordenación "Nivel de deseo (10 a 1) 🔥" en el selector desplegable.
  - Todo el filtrado y ordenación opera de forma reactiva en memoria (`useMemo`), manteniéndose 100% sincronizado con las mutaciones recibidas por Socket.IO.

#### 5. Verificación Automatizada con `npm run test:priority`
- **Decisión**: Crear `backend/scripts/verifyPriorityAndFilters.ts` validando clamping con Zod, persistencia y actualización en base de datos SQLite, y simulación de filtros y ordenaciones.
- **Razón**: Salvaguarda la consistencia del modelo y comportamiento de negocio.

---

## [2026-10-01] Conectividad Móvil por Red Local (LAN) y Proxy Inverso Transparente de Vite

### Contexto
Al acceder a la aplicación desde un smartphone conectado a la misma red local Wi-Fi (`http://192.168.1.135:5173`), los flujos de login y registro fallaban sistemáticamente con `Network Error`. La causa raíz radicaba en que las llamadas de API utilizaban `http://localhost:5000/api` debido a una variable estática o hardcodeada, intentando contactar con el puerto 5000 del propio teléfono en lugar del ordenador anfitrión.

### Decisiones Adoptadas

#### 1. Rutas Relativas Limpias (`VITE_API_URL=/api`)
- **Decisión**: Configurar `VITE_API_URL=/api` en `frontend/.env` y `frontend/.env.example`.
- **Razón**: En el navegador móvil, una petición a `/api` se envía a la misma dirección y puerto de origen (`http://192.168.1.135:5173/api`), eliminando la dependencia de nombres de dominio o IPs fijas.

#### 2. Proxy Inverso en Vite para API y WebSockets
- **Decisión**: En `frontend/vite.config.ts`, configurar el proxy de Vite con `secure: false`, `changeOrigin: true` tanto para `/api` como para `/socket.io` (con `ws: true`).
- **Razón**: El servidor de desarrollo de Vite (que ya escucha en `0.0.0.0` mediante `server.host: true`) reenvía de forma transparente y bidireccional el tráfico al backend en `http://localhost:5000`.

#### 3. Interceptor Diagnóstico de Red en Axios
- **Decisión**: En `frontend/src/services/api.ts`, añadir un interceptor que capture errores `ERR_NETWORK` e imprima advertencias legibles en la consola del navegador (`[API NETWORK ERROR]`), sugiriendo comprobar conectividad con el servidor.
- **Razón**: Acelera la detección de problemas de red física o firewall durante pruebas en dispositivos reales.

---

## [2026-10-01] Sistema Social de Amigos y Búsqueda de Usuarios (Feature 2/4)

### Contexto
Para dotar a la plataforma de dinamismo social y permitir que los usuarios compartan listas con sus círculos cercanos sin recurrir a enlaces manuales por email, se diseñó un módulo social integrado con control de solicitudes y permisos bidireccionales.

### Decisiones Adoptadas

#### 1. Modelo `Friendship` en Prisma con Relaciones Bidireccionales
- **Decisión**: Modelar `Friendship` con `senderId`, `receiverId`, `status: PENDING | ACCEPTED | REJECTED` y restricción única `@@unique([senderId, receiverId])`.
- **Razón**: Previene solicitudes duplicadas, facilita consultar relaciones entrantes y salientes y permite reactivar amistades previamente rechazadas o eliminadas.

#### 2. Consultas y Búsqueda de Usuarios con Privacidad
- **Decisión**: En `GET /api/friends/search?q=...`, excluir al usuario autenticado, limitar a un máximo de 20 resultados indexados y devolver el estado relacional computado (`FRIEND`, `REQUEST_SENT`, `REQUEST_RECEIVED`, `NONE`).
- **Razón**: Respeta el rendimiento de SQLite, evita que los usuarios se añadan a sí mismos y ofrece una experiencia inmediata en la interfaz.

#### 3. Vista Integral de Comunidad en Frontend (`Friends.tsx`)
- **Decisión**: Diseñar una interfaz organizada por pestañas ("Amigos", "Solicitudes" y "Buscador de usuarios") con contador reactivo de solicitudes pendientes y modal de inspección para explorar directamente las listas de deseos accesibles de los amigos.

---

## [2026-10-01] Amigo Invisible (Secret Santa) con Algoritmo de Sattolo y Blindaje de Privacidad (Feature 3/4)

### Contexto
Organizar intercambios de regalos requiere un mecanismo de sorteo que garantice matemáticamente que ninguna persona se regale a sí misma (desarreglo o *derangement*) y que forme un único ciclo cerrado para maximizar la emoción. Asimismo, era un requisito crítico que la seguridad y el secreto del sorteo fuesen impenetrables, incluso si un participante analiza las peticiones HTTP del navegador.

### Decisiones Adoptadas

#### 1. Algoritmo de Sattolo ($O(N)$ Ciclo Simple sin Puntos Fijos)
- **Decisión**: Implementar el algoritmo de Sattolo en `backend/src/utils/derangement.ts`.
- **Razón**: A diferencia del algoritmo clásico de Fisher-Yates (que puede generar auto-asignaciones $i = P[i]$) o de reintentos aleatorios (que pueden converger lentamente para $N$ pequeño), el algoritmo de Sattolo selecciona índices $j$ estrictamente menores a $i$ ($j \in [0, i-1]$), garantizando de forma determinista y en una única pasada $O(N)$ un ciclo de longitud exacta $N$ con exactamente cero auto-asignaciones.

#### 2. Blindaje Estricto de Privacidad en Respuestas JSON
- **Decisión**: En `GET /api/secret-santa/:id`, sanitizar la lista de participantes en el backend:
  * El usuario autenticado es el **único** que recibe el objeto `assignedTo` con los datos de su destinatario.
  * Para todos los demás miembros del grupo, el campo `assignedTo` se envía forzosamente en `null`.
- **Razón**: Blindaje contra ataques de inspección de red. Un participante no puede abrir las DevTools del navegador para ver a quién le regalan los demás.

#### 3. Tarjeta Interactiva de Revelación (Scratch / Reveal Card)
- **Decisión**: En la interfaz (`SecretSanta.tsx`), mostrar la asignación inicialmente oculta bajo una tarjeta festiva misteriosa que requiere interacción explícita para revelarse ("Rasca / Descubrir a quién regalas"), con opción de ocultarla de nuevo.
- **Razón**: Evita "spoilers" accidentales si otra persona está mirando la pantalla del móvil u ordenador.

#### 4. Notificaciones Híbridas (Email + Fallback a Consola)
- **Decisión**: Notificar asíncronamente a los participantes vía `sendSecretSantaNotification` con plantilla HTML responsiva con presupuesto y fecha, y enlace directo a Wishlist Hub.
- **Razón**: Mantiene a los usuarios informados de inmediato en sus bandejas de entrada sin bloquear la respuesta HTTP del organizador.

---

## [2026-10-02] Rediseño Visual Completo (UI/UX) con Estética Gaming / E-Commerce Moderna (Estilo Eneba / Loaded)

### Contexto
Wishlist Hub presentaba una línea gráfica basada en degradados difusos rosas/morados y bordes excesivamente redondeados (`rounded-3xl`), un estilo común en prototipos y plantillas de IA que restaba sobriedad, profesionalidad y contraste técnico a la plataforma. Para su maduración previa al despliegue, se decidió llevar la interfaz hacia un lenguaje visual moderno, estructurado y de alto impacto inspirado en tiendas y plataformas gaming y de comercio electrónico como Eneba o Loaded.

### Decisiones Adoptadas

#### 1. Sistema de Superficies Sólidas y Paleta Dark Gaming
- **Decisión**:
  - Reemplazar fondos borrosos y degradados pastel por superficies sólidas en escala de grises muy oscuros / negros: `zinc-950` (fondo global), `zinc-900` (tarjetas y modales), `zinc-850`/`zinc-800` (barras de herramientas, inputs y estados hover).
  - Delimitación técnica de 1px con bordes limpios (`border border-zinc-800` o `border-zinc-800/80`).
  - Reducción del radio de curvatura a `rounded-lg` (8px) y `rounded-xl` (12px), eliminando por completo los excesivos `rounded-3xl`.
- **Razón**: Mejora la legibilidad del contenido, elimina distracciones visuales y confiere una estructura nítida y profesional en pantallas OLED y móviles.

#### 2. Color de Acento Principal: Azul Eléctrico / Neón Cian
- **Decisión**:
  - Configurar en `frontend/tailwind.config.js` la paleta `brand` asignada a los tonos cian/azul eléctrico (`brand-500: #0ea5e9`, `brand-400: #38bdf8`, `brand-600: #0284c7`).
  - Asignar este color a los botones primarios interactivos, pestañas activas de navegación móvil y de escritorio, bordes de foco (`focus:ring-sky-500`) y resplandores sutiles.
- **Razón**: Genera un contraste visual vibrante y moderno sobre superficies oscuras, típico de interfaces de usuario gaming de alta gama.

#### 3. Acentos Funcionales Secundarios y Semántica
- **Decisión**:
  - **Verde Menta / Esmeralda (`#10b981` / `#059669`)**: Para reservas de regalos, confirmaciones exitosas, badge "En vivo" de WebSockets y toasts de éxito.
  - **Coral / Rojo Sutil (`#f43f5e` / `#e11d48`)**: Para acciones destructivas (eliminar), estados de error y toasts de alerta.
  - **Ámbar / Naranja (`#f59e0b` / `#ea580c`)**: Para avisos, niveles de prioridad media y etiquetas de aviso.
- **Razón**: Mantiene la semántica universal de feedback y estados sin romper la cohesión estética oscura.

#### 4. Rediseño de Tarjetas de Regalo (E-Commerce Product Card)
- **Decisión**:
  - Relación de aspecto consistente (`aspect-video` / `aspect-square`), fondo `bg-zinc-900`, borde `border-zinc-800`.
  - Badges de prioridad estilizados como etiquetas técnicas de producto (`PRIORIDAD 1-10`), precio nítido en tipografía monoespaciada/negrita, y acciones de compra y edición accesibles con micro-interacciones.
- **Razón**: Facilita la navegación rápida y visualización de catálogo similar a tiendas digitales de videojuegos y hardware.

#### 5. Módulo de Amigo Invisible (Secret Santa) en Modo Confidencial / Cyber
- **Decisión**:
  - Reemplazar la iconografía festiva infantil por un concepto de "misión confidencial / misterio": tarjetas en `zinc-900` con bordes oscuros, botón de revelación interactivo con brillo azul eléctrico y tarjeta de asignación elegante.
- **Razón**: Aporta una experiencia intrigante, adulta y divertida, alineada con el nuevo concepto estético de la aplicación.

#### 6. Identidad de Marca e Iconos PWA
- **Decisión**:
  - Regenerar todos los iconos y favicons de la PWA (`favicon.svg`, `favicon.ico`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon.png`) con fondo oscuro profundo (`#09090b`), contornos limpios de caja de regalo con destello superior y lazo en cian eléctrico (`#00e5ff` / `#38bdf8`).
  - Actualizar `theme_color` en `index.html` y `manifest.webmanifest` a `#09090b`.
- **Razón**: Coherencia total desde el acceso directo en la pantalla de inicio del smartphone hasta la barra de estado y la splash screen.

---

## [2026-10-03] Sprint de Robustez Técnica, Concurrencia en Tiempo Real (Anti-Doble Reserva) y Perfil de Usuario Completo con Avatares Seguros

### Contexto
Previo al despliegue final, era necesario consolidar tres áreas críticas para la estabilidad y la experiencia de usuario:
1. **Configuración de entorno categorizada y control de reseteo seguro**: Asegurar que `.env` y `.env.example` estén organizados por capas funcionales, que el reseteo automático de BD responda a flags auditables (`RESET_DB_ON_START` / `DB_AUTO_RESET`) estrictamente deshabilitados en producción, y que las redes LAN gocen de bypass en rate limiting.
2. **Concurrencia en tiempo real y anti-doble reserva (bloqueo optimista)**: En eventos de alta interacción (sorteos de Amigo Invisible, listas públicas), dos personas podrían intentar reservar o comprar el mismo regalo en el mismo milisegundo, provocando condiciones de carrera (race conditions).
3. **Perfil de usuario completo**: Humanización de la plataforma mediante nombres reales (`firstName`, `lastName`) en registro y vistas sociales ("Nombre Apellidos (@username)"), módulo `/profile` accesible en web y móvil, y subida segura de fotos de perfil (avatares) en JPG/PNG con restricción de 5MB y recolección de archivos huérfanos.

### Decisiones Adoptadas

#### 1. Reorganización Estructurada de Variables de Entorno y Switch `RESET_DB_ON_START`
- **Decisión**:
  - Reestructurar `backend/.env` y `backend/.env.example` en 6 bloques temáticos documentados: `[SERVER & CORE]`, `[SECURITY & AUTH]`, `[DATABASE]`, `[CORS & CLIENT ORIGINS]`, `[EMAIL / SMTP SERVICE]` y `[DEVELOPMENT CONTROLS]`.
  - Configurar `RESET_DB_ON_START=false` por defecto y `BYPASS_RATE_LIMIT=true` para desarrollo.
  - Implementar en `backend/src/utils/dbReset.ts` la función `autoResetDatabase()`, con salvaguarda absoluta: si `NODE_ENV === 'production'`, el reseteo se rechaza categóricamente. En desarrollo, si está activo, purga las 8 tablas relacionales y limpia las carpetas `uploads/items/` y `uploads/avatars/`.
- **Razón**: Máxima claridad operativa para despliegues y protección inquebrantable contra pérdida de datos en entornos de producción.

#### 2. Transacciones Atómicas en Reservas (Anti-Doble Reserva con HTTP 409 Conflict)
- **Decisión**:
  - En `backend/src/controllers/itemController.ts`, proteger las acciones de compra y reserva (`POST /api/gifts/:id/reserve` y `POST /api/items/:id/purchase`) mediante transacciones aisladas `prisma.$transaction`.
  - Si un usuario intenta reservar un regalo que ya se encuentra con `isPurchased === true`, el servidor responde de inmediato con HTTP 409 Conflict: *"Este regalo ya ha sido reservado por otro usuario"*.
  - En el frontend (`PurchaseConfirmModal.tsx`), capturar el código 409, emitir un toast de advertencia al usuario y cerrar el modal para reflejar el estado actualizado.
- **Razón**: Garantiza integridad transaccional indivisible a nivel de base de datos, impidiendo reservas solapadas o duplicadas.

#### 3. Sincronización Inmediata por WebSockets en Salas Duales
- **Decisión**:
  - En `backend/src/services/socketService.ts`, hacer que los sockets se unan tanto a `wishlist:${id}` como a `wishlist_${id}`.
  - Emitir eventos duales con retrocompatibilidad: `item:updated` y `gift_updated`, además de `gift_reserved` (cuando `isPurchased: true`), `gift_created` e `gift_deleted`.
  - En el hook `useWishlistSocket.ts`, escuchar los eventos con deduplicación por ID para refrescar el estado de regalos en tiempo real en todos los dispositivos conectados.
- **Razón**: Latencia imperceptible en sincronización multi-pantalla y multi-dispositivo sin recargar la página.

#### 4. Modelo de Usuario Extendido, Nombre Real y Avatares Seguros
- **Decisión**:
  - Añadir a `model User` en `schema.prisma`: `firstName String @default("")`, `lastName String @default("")` y `avatarUrl String?`.
  - Actualizar `register` y `authSchemas.ts` para solicitar Nombre y Apellidos (manteniendo el `username` como identificador único obligatorio).
  - En las vistas sociales (`Friends.tsx` y `SecretSanta.tsx`), mostrar con consistencia visual "Nombre Apellidos (@username)" junto al avatar.
  - Almacenamiento seguro de avatares en `backend/uploads/avatars/`:
    * Middleware Multer (`avatarUploadMiddleware.ts`) con límite estricto de 5MB y filtrado de tipos MIME permitido exclusivamente a `image/jpeg` y `image/png`.
    * En `fileStorage.ts`, función `deleteLocalAvatar()` con saneamiento de rutas anti-Path Traversal para borrar la imagen anterior cuando el usuario la reemplace o elimine.
  - Implementación de la vista completa `/profile` (`frontend/src/pages/Profile.tsx`) para la gestión de datos personales, cambio de contraseña, avatar y correo, enlazada en el navbar superior y en la barra inferior móvil.
- **Razón**: Interacción comunitaria más cálida y reconocible entre amigos y familiares preservando al mismo tiempo la seguridad técnica y la privacidad.

