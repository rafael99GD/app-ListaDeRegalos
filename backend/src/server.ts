// 1. CARGA INMEDIATA Y SÍNCRONA DE VARIABLES DE ENTORNO
import './config/env';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Cargar explícitamente buscando tanto en el CWD como en la carpeta backend si se ejecuta desde raíz monorepo
const envCandidatePaths = [
  path.resolve(__dirname, '../.env'), // backend/.env relativo a src/
  path.resolve(process.cwd(), 'backend/.env'), // ejecutado desde raíz monorepo
  path.resolve(process.cwd(), '.env'), // ejecutado desde backend/
  path.resolve(__dirname, '../../.env'), // raíz monorepo si existe
];

for (const envPath of envCandidatePaths) {
  try {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } catch (e) {
    // Ignorar errores de ruta
  }
}

import express from 'express';
import http from 'http';
import cors from 'cors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { apiRateLimiter } from './middleware/rateLimiter';
import { prisma } from './config/prisma';
import { autoResetDatabase } from './utils/dbReset';
import { initSocketServer } from './services/socketService';

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración para proxies inversos (Render, Railway, Vercel, etc.)
app.set('trust proxy', 1);

// Configuración de CORS
const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  process.env.FRONTEND_URL,
  ...extraOrigins,
].filter(Boolean) as string[];

const isOriginPermitted = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
  // Permitir accesos locales LAN para pruebas multidispotivo (RFC 1918)
  if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginPermitted(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por política de CORS'));
      }
    },
    credentials: true,
  })
);

// Middlewares estándar para parsear JSON y urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos subidos (/uploads -> backend/uploads)
const uploadsDirectory = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDirectory));

// Rutas de la API con limitador global preventivo
app.use('/api', apiRateLimiter);
app.use('/api', routes);

// Middleware de ruta no encontrada (404)
app.use(notFoundHandler);

// Middleware global de manejo de errores
app.use(errorHandler);

// Iniciar el servidor con reseteo condicional de base de datos para desarrollo
let server: any;
let httpServer: http.Server;

const startServer = async () => {
  try {
    await autoResetDatabase();
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }

  httpServer = http.createServer(app);
  initSocketServer(httpServer, allowedOrigins);

  server = httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(` 🚀 Wishlist Hub API lista y corriendo en:`);
    console.log(`    http://localhost:${PORT}`);
    console.log(` 📁 Archivos estáticos en: /uploads`);
    console.log(` 📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(` ⚡ WebSockets (Socket.IO): Activo en sala wishlist:*`);
    console.log(`======================================================\n`);
  });
};

startServer();

// Cierre elegante (graceful shutdown)
const gracefulShutdown = async (signal: string) => {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor y desconectando Prisma...`);
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Servidor cerrado con éxito.');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
