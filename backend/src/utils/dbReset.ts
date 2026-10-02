import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma';
import { UPLOADS_ITEMS_DIR, UPLOADS_AVATARS_DIR } from './fileStorage';

/**
 * Limpia una carpeta de uploads locales conservando .gitkeep
 */
const cleanFolder = (dirPath: string): void => {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (file !== '.gitkeep') {
        const filePath = path.join(dirPath, file);
        try {
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error(`[DEV] Error al eliminar archivo de upload ${file}:`, err);
        }
      }
    }
  }
};

/**
 * Limpia todas las carpetas de uploads locales (items y avatars)
 */
export const cleanUploadsFolder = (): void => {
  cleanFolder(UPLOADS_ITEMS_DIR);
  cleanFolder(UPLOADS_AVATARS_DIR);
};

/**
 * Vacía todas las tablas de la base de datos en orden de dependencias
 * y elimina los archivos subidos de prueba.
 */
export const resetDatabase = async (): Promise<void> => {
  await prisma.$transaction([
    prisma.secretSantaMember.deleteMany(),
    prisma.secretSantaGroup.deleteMany(),
    prisma.friendship.deleteMany(),
    prisma.item.deleteMany(),
    prisma.savedWishlist.deleteMany(),
    prisma.wishlistWhitelist.deleteMany(),
    prisma.authOtp.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  cleanUploadsFolder();
};

/**
 * Helper de arranque condicional para desarrollo.
 * Solo se ejecuta si:
 * 1. NODE_ENV !== 'production'
 * 2. RESET_DB_ON_START === 'true' || DB_AUTO_RESET === 'true'
 */
export const autoResetDatabase = async (): Promise<void> => {
  const isResetRequested =
    process.env.RESET_DB_ON_START === 'true' || process.env.DB_AUTO_RESET === 'true';

  // Blindaje de seguridad estricto para producción
  if (process.env.NODE_ENV === 'production') {
    if (isResetRequested) {
      console.warn(
        '⚠️ [SEGURIDAD] RESET_DB_ON_START / DB_AUTO_RESET ignorado: No se permite el reseteo automático de base de datos en entorno de producción.'
      );
    }
    return;
  }

  // Comprobar activación explícita
  if (!isResetRequested) {
    return;
  }

  try {
    await resetDatabase();
    console.log(
      '🧹 [DEV] RESET_DB_ON_START activo: Base de datos y archivos de prueba reiniciados correctamente.'
    );
  } catch (error) {
    console.error('❌ [DEV] Error durante el reseteo automático de la base de datos:', error);
    throw error;
  }
};
