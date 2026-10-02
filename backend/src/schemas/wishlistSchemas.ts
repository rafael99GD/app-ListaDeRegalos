import { z } from 'zod';

export const createWishlistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título de la lista es requerido')
    .max(100, 'El título no puede superar los 100 caracteres'),
  description: z.string().trim().max(500, 'La descripción no puede superar los 500 caracteres').optional(),
  occasion: z.string().trim().max(50, 'La ocasión no puede superar los 50 caracteres').optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
});

export const updateWishlistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título no puede estar vacío')
    .max(100, 'El título no puede superar los 100 caracteres')
    .optional(),
  description: z.string().trim().max(500, 'La descripción no puede superar los 500 caracteres').optional().nullable(),
  occasion: z.string().trim().max(50, 'La ocasión no puede superar los 50 caracteres').optional().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

export const addWhitelistUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'El nombre de usuario es requerido')
    .transform((val) => val.toLowerCase()),
});
