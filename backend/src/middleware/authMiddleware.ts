import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Acceso no autorizado: Token de sesión no proporcionado o con formato inválido',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, username: true, isVerified: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o sesión inválida',
      });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'La cuenta no ha sido verificada. Por favor verifica tu código OTP.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token expirado o inválido',
    });
  }
};

/**
 * Middleware opcional: si hay token válido, carga `req.user`. Si no lo hay, continúa sin error.
 */
export const optionalAuthenticateToken = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, username: true, isVerified: true },
    });

    if (user && user.isVerified) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
      };
    }
  } catch (err) {
    // Si falla el token en opcional, simplemente continuamos como invitado anónimo
  }
  next();
};
