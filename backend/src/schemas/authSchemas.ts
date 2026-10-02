import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .optional()
    .default(''),
  lastName: z
    .string()
    .trim()
    .min(1, 'Los apellidos son obligatorios')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres')
    .optional()
    .default(''),
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El nombre de usuario solo puede contener letras, números, guiones y puntos')
    .transform((val) => val.toLowerCase()),
  email: z
    .string()
    .trim()
    .email('Formato de correo electrónico inválido')
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
    .regex(/[0-9]/, 'La contraseña debe incluir al menos un número'),
});

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre no puede estar vacío')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Los apellidos no pueden estar vacíos')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres'),
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El nombre de usuario solo puede contener letras, números, guiones y puntos')
    .transform((val) => val.toLowerCase()),
  email: z
    .string()
    .trim()
    .email('Formato de correo electrónico inválido')
    .transform((val) => val.toLowerCase())
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
    .regex(/[0-9]/, 'La contraseña debe incluir al menos un número')
    .optional(),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Formato de correo electrónico inválido')
    .transform((val) => val.toLowerCase()),
  code: z
    .string()
    .trim()
    .length(6, 'El código OTP debe tener exactamente 6 dígitos')
    .regex(/^\d+$/, 'El código OTP debe ser numérico'),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Debes ingresar tu correo electrónico o nombre de usuario')
    .transform((val) => val.toLowerCase()),
  password: z.string().min(1, 'Debes ingresar tu contraseña'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Formato de correo electrónico inválido')
    .transform((val) => val.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Formato de correo electrónico inválido')
    .transform((val) => val.toLowerCase()),
  code: z
    .string()
    .trim()
    .length(6, 'El código OTP debe tener exactamente 6 dígitos')
    .regex(/^\d+$/, 'El código OTP debe ser numérico'),
  newPassword: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
    .regex(/[0-9]/, 'La contraseña debe incluir al menos un número'),
});
