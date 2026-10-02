import crypto from 'crypto';

/**
 * Genera un slug aleatorio seguro de caracteres alfanuméricos no ambiguos
 * Ej: "k9x7m2q8p4" (10 caracteres)
 */
export const generateShareSlug = (length = 10): string => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};
