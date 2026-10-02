# 🎁 Wishlist Hub (App de Listas de Regalos)

Wishlist Hub es una plataforma web moderna, intuitiva y festiva para crear, gestionar y compartir listas de deseos y regalos para ocasiones especiales (Navidad, San Valentín, cumpleaños, aniversarios, baby showers, bodas, etc.).

Permite a los usuarios organizar sus listas públicas o privadas, subir imágenes de productos o usar enlaces, definir precios y enlaces de compra directa, y permitir que amigos o familiares reserven regalos sin desvelar sorpresas o evitar regalos duplicados.

---

## 🛠️ Stack Tecnológico

### **Backend (`backend/`)**
- **Runtime & Lenguaje**: Node.js v18+ / v24+, TypeScript
- **Framework**: Express.js
- **ORM & Base de Datos**: Prisma ORM con SQLite por defecto (conmutabilidad directa a PostgreSQL cambiando `provider = "postgresql"` en `schema.prisma`)
- **Validación de Esquemas**: Zod
- **Autenticación & Criptografía**: JWT (`jsonwebtoken`), `bcryptjs`, códigos OTP numéricos de 6 dígitos con hash seguro
- **Gestión de Archivos**: `multer` configurado con filtro estricto (.png, .jpg, .jpeg) y límite de 2MB guardado en `backend/uploads/items/`
- **CORS & Seguridad**: `cors`, `dotenv`

### **Frontend (`frontend/`)**
- **Librería & Lenguaje**: React 18+, TypeScript
- **Empaquetador**: Vite
- **Estilos**: Tailwind CSS con paleta temática adaptada a celebraciones y detalles
- **Iconografía**: Lucide React
- **Navegación**: React Router DOM (v7)
- **Cliente HTTP**: Axios con interceptor automático para tokens Bearer JWT y proxy para desarrollo local

---

## 📂 Estructura del Proyecto

```text
app-ListaDeRegalos/
├── package.json              # Scripts concurrentes del monorepo
├── .gitignore                # Reglas de exclusión Git
├── README.md                 # Documentación del proyecto
│
├── backend/                  # Servidor API REST
│   ├── .env.example          # Plantilla de variables de entorno backend
│   ├── .env                  # Variables activas de entorno
│   ├── package.json          # Dependencias y scripts de backend
│   ├── tsconfig.json         # Configuración TypeScript para Node
│   ├── uploads/
│   │   └── items/            # Directorio de almacenamiento de imágenes locales
│   ├── prisma/
│   │   ├── schema.prisma     # Modelos relacionales de Prisma
│   │   ├── migrations/       # Migraciones SQL registradas
│   │   └── dev.db            # Base de datos SQLite
│   └── src/
│       ├── config/           # Prisma client singleton
│       ├── controllers/      # authController, wishlistController, itemController
│       ├── middleware/       # auth, uploads (multer), validación (Zod), errores
│       ├── routes/           # Rutas modulares Express
│       ├── schemas/          # Esquemas de validación Zod
│       ├── services/         # Servicios (emailService / OTP simulator)
│       ├── types/            # Tipos de TypeScript e interfaces Express
│       ├── utils/            # JWT, hash, generación de nanoids/slugs
│       └── server.ts         # Punto de entrada del servidor Express
│
└── frontend/                 # Aplicación SPA React
    ├── .env.example          # Plantilla de variables frontend
    ├── .env                  # Variables frontend
    ├── package.json          # Dependencias de React y Vite
    ├── vite.config.ts        # Configuración de Vite con proxy /api y /uploads
    ├── tailwind.config.js    # Configuración de Tailwind CSS
    ├── tsconfig.json         # Configuración TypeScript para React
    ├── index.html            # Plantilla HTML con tipografía Plus Jakarta Sans
    └── src/
        ├── components/       # Navbar, Cards (GiftCard, WishlistCard), Modales
        ├── context/          # AuthContext y ToastContext
        ├── pages/            # Login, Register, VerifyOtp, Forgot/Reset, Dashboard, Detalle, Vista Pública
        ├── services/         # Clientes Axios tipados
        ├── types/            # Modelos TypeScript compartidos en cliente
        ├── App.tsx           # Enrutamiento de la aplicación
        └── main.tsx          # Punto de entrada React
```

---

## 🗄️ Modelo de Datos (Prisma)

El esquema implementado en [`backend/prisma/schema.prisma`](file:///backend/prisma/schema.prisma) cuenta con las siguientes entidades:

1. **`User`**:
   - `id`, `username` (único, indexado), `email` (único, indexado), `passwordHash`, `isVerified`, timestamps.
   - Relaciones con Wishlists, SavedWishlists, WhitelistEntries, AuthOtps.
2. **`AuthOtp`**:
   - `id`, `userId`, `otpHash`, `type` (`REGISTRATION`, `PASSWORD_RESET`), `expiresAt` (10 min), `attempts` (máx. 5), `used`.
3. **`Wishlist`**:
   - `id`, `userId`, `title`, `description`, `occasion` (ej: "Navidad", "San Valentín"), `visibility` (`PUBLIC`, `PRIVATE`), `shareSlug` (nanoId aleatorio único), timestamps.
4. **`WishlistWhitelist`**:
   - `id`, `wishlistId`, `userId`, clave única compuesta `@@unique([wishlistId, userId])`.
5. **`SavedWishlist`**:
   - `id`, `userId`, `wishlistId`, clave única compuesta `@@unique([userId, wishlistId])`.
6. **`Item`**:
   - `id`, `wishlistId`, `title`, `price`, `currency` (def: "EUR"), `url`, `imageType` (`URL`, `LOCAL`, `NONE`), `imageUrl`, `isPurchased`, `purchasedBy`, `purchasedAt`, timestamps.

---

## 🚀 Puesta en Marcha Rápida

### 1. Requisitos Previos
- **Node.js**: v18.0.0 o superior (verificado con v24.x)
- **npm**: v9+ (verificado con npm v11/12)

### 2. Instalación de Dependencias
Ejecuta en la raíz del proyecto:
```bash
npm run install:all
```
*(Opcionalmente, ejecuta `npm install` en la raíz para habilitar el comando concurrente).*

### 3. Base de Datos & Migraciones
El proyecto viene configurado con SQLite para empezar a trabajar inmediatamente sin instalar servicios de bases de datos adicionales. Para sincronizar la base de datos:
```bash
npm run prisma:migrate
```

### 4. Iniciar en Modo Desarrollo
Ejecuta en la raíz para levantar simultáneamente el backend y el frontend:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Archivos Estáticos**: [http://localhost:5000/uploads/...](http://localhost:5000/uploads)

---

## 📡 Endpoints de la API REST

### Autenticación (`/api/auth`)
- `POST /api/auth/register`: Valida datos con Zod, normaliza campos, genera OTP de 6 dígitos e imprime el código en consola (simulador de email).
- `POST /api/auth/verify-otp`: Valida OTP (máx. 5 intentos, caducidad 10m), activa usuario (`isVerified: true`) y entrega JWT.
- `POST /api/auth/resend-otp`: Reenvía un nuevo código OTP al correo.
- `POST /api/auth/login`: Autentica credenciales verificando que la cuenta esté verificada.
- `POST /api/auth/forgot-password`: Genera OTP de tipo `PASSWORD_RESET`.
- `POST /api/auth/reset-password`: Valida OTP y actualiza la contraseña.
- `GET /api/auth/me`: Retorna los datos del usuario en sesión (`Bearer <token>`).

### Listas de Regalos (`/api/wishlists`)
- `GET /api/wishlists/public/:shareSlug`: **Público**. Retorna la lista y sus regalos a cualquier visitante con el enlace ofuscado.
- `GET /api/wishlists`: Lista las listas creadas por el usuario autenticado.
- `POST /api/wishlists`: Crea una nueva lista (Pública o Privada).
- `GET /api/wishlists/:id`: Consulta una lista por ID (verificando si el usuario es dueño o está en Whitelist).
- `PUT /api/wishlists/:id`: Modifica título, descripción, ocasión o visibilidad (solo dueño).
- `DELETE /api/wishlists/:id`: Elimina la lista y sus regalos (solo dueño).
- `POST /api/wishlists/:id/whitelist`: Agrega a un usuario por su `username` para darle acceso a una lista privada.
- `DELETE /api/wishlists/:id/whitelist/:userId`: Revoca acceso a un usuario invitado.
- `POST /api/wishlists/:id/save`: Guarda/ancla una lista a las listas compartidas del usuario.
- `DELETE /api/wishlists/:id/save`: Desancla la lista.
- `GET /api/wishlists/saved`: Lista todas las listas ancladas por el usuario.
- `GET /api/wishlists/shared-with-me`: Lista las listas privadas en las que el usuario ha sido invitado.

### Regalos / Artículos (`/api/items` y `/api/wishlists/:id/items`)
- `POST /api/wishlists/:id/items`: Agrega un regalo (soporta `multipart/form-data` para subida de imagen local o JSON con URL externa).
- `PUT /api/items/:id`: Edita el regalo o reemplaza su imagen (solo dueño).
- `DELETE /api/items/:id`: Elimina el regalo y limpia el archivo local de disco si existía.
- `PATCH /api/items/:id/purchase`: Marca el regalo como comprado/reservado (`isPurchased = true`). Puede usarse de forma anónima o con nombre de comprador.
- `PATCH /api/items/:id/unpurchase`: **Solo permitido para el creador de la lista** (o el comprador autenticado). Restablece el regalo a disponible.

---

## 🎨 Vistas del Frontend

1. **Registro e Inicio de Sesión**:
   - Formulario reactivo con validación instantánea.
   - Pantalla de ingreso de código OTP de 6 dígitos con botón de reenvío.
   - Recuperación de contraseña paso a paso.
2. **Dashboard**:
   - Pestaña "Mis Listas": Grid con tarjetas interactivas, badge de ocasión, botón rápido para copiar enlace con toast de confirmación.
   - Pestaña "Compartidas Conmigo": Agrupa listas privadas donde estás autorizado y listas guardadas.
   - Modal para crear lista con selector de ocasión (Navidad, San Valentín, Cumpleaños...) y toggle Pública/Privada.
3. **Detalle de Lista (Creador)**:
   - Añadir regalos con subida de imagen (previsualización, drag & drop) o enlace web.
   - Modal para gestionar invitados por `@username` en listas privadas.
   - Estadísticas de regalos totales, reservados y disponibles.
4. **Detalle Compartido / Enlace Público (`/w/:slug`)**:
   - Vista optimizada para invitados sin necesidad de registro obligatorio.
   - Marcado de regalos como comprados con confirmación interactiva.
   - Enlace directo a la tienda del regalo.
   - Botón para guardar la lista en la cuenta del usuario.
