import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateOtp = (): string => {
  // Genera un código OTP numérico de 6 dígitos (100000 - 999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtp = async (otp: string): Promise<string> => {
  // Utiliza SHA-256 o bcrypt. Usamos SHA-256 con salt o bcrypt para verificar fácilmente
  return bcrypt.hash(otp, SALT_ROUNDS);
};

export const compareOtp = async (otp: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(otp, hash);
};
