import jwt from 'jsonwebtoken';
import { AuthUserPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_mode';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as any;

export const generateToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
};
