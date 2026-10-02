import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Función auxiliar para detectar si una dirección IP pertenece a localhost
 * o a rangos privados de red local (RFC 1918 / IPv6 local).
 */
export const isPrivateOrLocalIp = (ip?: string): boolean => {
  if (!ip) return false;
  const cleanIp = ip.replace(/^::ffff:/, '').trim().toLowerCase();
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
    return true;
  }
  // 192.168.0.0 - 192.168.255.255
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  // 10.0.0.0 - 10.255.255.255
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  // 172.16.0.0 - 172.31.255.255
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(cleanIp)) return true;
  // IPv6 unique local addresses fc00::/7 o link-local fe80::/10
  if (/^fe80:|^fc00:|^fd[0-9a-f]{2}:/i.test(cleanIp)) return true;
  return false;
};

/**
 * Función auxiliar para determinar si el rate limiting debe omitirse.
 * Se omite en:
 * - Entornos de test (NODE_ENV === 'test')
 * - Si se define explícitamente RATE_LIMIT_DISABLED === 'true' o BYPASS_RATE_LIMIT === 'true'
 * - En desarrollo (NODE_ENV !== 'production'), si la IP proviene de una red privada LAN (192.168.x.x, 10.x.x.x, etc.)
 */
export const shouldSkipRateLimit = (req?: Request): boolean => {
  if (process.env.NODE_ENV === 'test') return true;
  if (process.env.RATE_LIMIT_DISABLED === 'true' || process.env.BYPASS_RATE_LIMIT === 'true') {
    return true;
  }

  // En desarrollo, omitir para IPs de red local privada para evitar 429 accidental entre dispositivos en la misma Wi-Fi
  if (process.env.NODE_ENV !== 'production' && req) {
    const clientIp = req.ip || req.socket?.remoteAddress;
    const cleanIp = clientIp ? clientIp.replace(/^::ffff:/, '').trim().toLowerCase() : '';
    if (
      /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\.|^fe80:|^fc00:|^fd[0-9a-f]{2}:/i.test(cleanIp)
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Limitador para endpoints de autenticación general (login, registro, forgot password, reset password, resend OTP).
 * Ventana: 15 minutos
 * Máximo: 20 solicitudes fallidas por IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => shouldSkipRateLimit(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos fallidos de autenticación. Por favor, inténtalo de nuevo en 15 minutos.',
    });
  },
});

/**
 * Limitador hiperestricto específicamente para validación de código OTP (/api/auth/verify-otp).
 * Ventana: 15 minutos
 * Máximo: 5 intentos fallidos por IP
 */
export const otpVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => shouldSkipRateLimit(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos incorrectos de verificación OTP. Por favor, inténtalo de nuevo en 15 minutos.',
    });
  },
});

/**
 * Limitador preventivo global para todas las rutas bajo /api/.
 * Ventana: 15 minutos
 * Máximo: 100 solicitudes por IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => shouldSkipRateLimit(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Has superado el límite de peticiones permitidas. Por favor, inténtalo de nuevo más tarde.',
    });
  },
});
