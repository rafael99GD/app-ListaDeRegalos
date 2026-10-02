import path from 'path';
import fs from 'fs';

/**
 * Directorio absoluto para almacenar imágenes locales de regalos.
 * Resuelto a backend/uploads/items tanto en ejecución directa como compilada.
 */
export const UPLOADS_ITEMS_DIR = path.resolve(__dirname, '../../uploads/items');
export const UPLOADS_AVATARS_DIR = path.resolve(__dirname, '../../uploads/avatars');

// Asegurar que los directorios base existan al inicializar
if (!fs.existsSync(UPLOADS_ITEMS_DIR)) {
  fs.mkdirSync(UPLOADS_ITEMS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_AVATARS_DIR)) {
  fs.mkdirSync(UPLOADS_AVATARS_DIR, { recursive: true });
}

/**
 * Elimina de manera segura un archivo local de imagen dentro de uploads/items.
 *
 * Medidas de seguridad y robustez:
 * 1. Rechaza valores nulos, vacíos o que no sean cadenas de texto.
 * 2. Ignora silenciosamente URLs externas (ej. https://, http://, data:, Steam CDN).
 * 3. Sanitiza la ruta extrayendo el nombre o subruta relativa dentro de uploads/items.
 * 4. Protege archivos especiales del sistema o control de versiones (ej. .gitkeep).
 * 5. Previene ataques de Path Traversal asegurando que la ruta resuelta resida estrictamente dentro de UPLOADS_ITEMS_DIR.
 * 6. Ignora silenciosamente si el archivo ya no existe en disco (ENOENT).
 * 7. Asegura que el objetivo sea un archivo regular antes de borrar (no borra directorios).
 *
 * @param relativePathOrUrl Ruta relativa (ej. "/uploads/items/uuid.jpg", "uuid.jpg") o URL remota
 */
export const deleteLocalFile = async (
  relativePathOrUrl?: string | null
): Promise<void> => {
  if (!relativePathOrUrl || typeof relativePathOrUrl !== 'string') {
    return;
  }

  const trimmed = relativePathOrUrl.trim();
  if (!trimmed) {
    return;
  }

  // 1. Ignorar URLs externas (ej. Steam, enlaces web http/https o data URIs)
  if (/^(?:https?:|\/\/|data:)/i.test(trimmed)) {
    return;
  }

  // 2. Extraer ruta relativa limpia removiendo cualquier prefijo /uploads/items o uploads/items
  const cleanSubPath = trimmed.replace(/^[/\\]*uploads[/\\]items[/\\]*/i, '');
  if (!cleanSubPath || cleanSubPath === '.' || cleanSubPath === '/') {
    return;
  }

  // 3. Preservar archivos protegidos como .gitkeep
  const baseName = path.basename(cleanSubPath).toLowerCase();
  if (baseName === '.gitkeep') {
    return;
  }

  // 4. Resolver ruta absoluta normalizada
  const resolvedPath = path.resolve(UPLOADS_ITEMS_DIR, cleanSubPath);

  // 5. Blindaje contra Path Traversal: asegurar que reside dentro de UPLOADS_ITEMS_DIR
  const relativeToUploads = path.relative(UPLOADS_ITEMS_DIR, resolvedPath);
  if (
    relativeToUploads.startsWith('..') ||
    path.isAbsolute(relativeToUploads) ||
    relativeToUploads === ''
  ) {
    console.warn(
      `⚠️ [fileStorage] Intento de Path Traversal bloqueado para la ruta: "${relativePathOrUrl}"`
    );
    return;
  }

  // 6. Eliminar el archivo si existe y es un archivo regular
  try {
    const stat = await fs.promises.stat(resolvedPath);
    if (!stat.isFile()) {
      return;
    }
    await fs.promises.unlink(resolvedPath);
  } catch (error: any) {
    // Si el archivo ya no existe, ignorar silenciosamente
    if (error.code === 'ENOENT') {
      return;
    }
    console.warn(
      `[fileStorage] Error no fatal al intentar eliminar el archivo "${resolvedPath}":`,
      error.message
    );
  }
};

/**
 * Elimina múltiples archivos locales en paralelo de forma segura.
 *
 * @param pathsOrUrls Lista de rutas o URLs
 */
export const deleteLocalFiles = async (
  pathsOrUrls: (string | null | undefined)[]
): Promise<void> => {
  if (!Array.isArray(pathsOrUrls) || pathsOrUrls.length === 0) {
    return;
  }
  await Promise.all(pathsOrUrls.map((filePath) => deleteLocalFile(filePath)));
};

/**
 * Elimina de manera segura un avatar local dentro de uploads/avatars.
 */
export const deleteLocalAvatar = async (
  relativePathOrUrl?: string | null
): Promise<void> => {
  if (!relativePathOrUrl || typeof relativePathOrUrl !== 'string') {
    return;
  }

  const trimmed = relativePathOrUrl.trim();
  if (!trimmed || /^(?:https?:|\/\/|data:)/i.test(trimmed)) {
    return;
  }

  const cleanSubPath = trimmed.replace(/^[/\\]*uploads[/\\]avatars[/\\]*/i, '');
  if (!cleanSubPath || cleanSubPath === '.' || cleanSubPath === '/') {
    return;
  }

  const baseName = path.basename(cleanSubPath).toLowerCase();
  if (baseName === '.gitkeep') {
    return;
  }

  const resolvedPath = path.resolve(UPLOADS_AVATARS_DIR, cleanSubPath);
  const relativeToAvatars = path.relative(UPLOADS_AVATARS_DIR, resolvedPath);
  if (
    relativeToAvatars.startsWith('..') ||
    path.isAbsolute(relativeToAvatars) ||
    relativeToAvatars === ''
  ) {
    console.warn(`⚠️ [fileStorage] Path Traversal bloqueado para avatar: "${relativePathOrUrl}"`);
    return;
  }

  try {
    const stat = await fs.promises.stat(resolvedPath);
    if (stat.isFile()) {
      await fs.promises.unlink(resolvedPath);
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.warn(`[fileStorage] Error al eliminar avatar "${resolvedPath}":`, error.message);
    }
  }
};
