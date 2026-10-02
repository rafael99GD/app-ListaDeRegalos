import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

/**
 * Carga de variables de entorno de forma síncrona, robusta y garantizada
 * independientemente del directorio de trabajo actual (process.cwd()).
 * Soporta ejecución desde la raíz del monorepo (`npm run dev`)
 * o desde la carpeta `backend/` (`npm run dev --prefix backend`).
 */
const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'), // Raíz del monorepo (si existe)
  path.resolve(__dirname, '../.env'), // backend/.env (relativo a dist/ o src/config/)
  path.resolve(process.cwd(), 'backend/.env'), // Invocado desde raíz
  path.resolve(process.cwd(), '.env'), // Invocado desde backend
];

for (const envPath of candidateEnvPaths) {
  try {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } catch (err) {
    // Ignorar errores de acceso individual
  }
}

export default process.env;
