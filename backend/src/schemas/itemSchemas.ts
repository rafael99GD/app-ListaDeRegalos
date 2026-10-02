import { z } from 'zod';

export const createItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título del regalo es requerido')
    .max(150, 'El título no puede superar los 150 caracteres'),
  price: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return null;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
  currency: z.string().trim().default('EUR'),
  url: z
    .string()
    .trim()
    .url('La URL de compra no es válida')
    .optional()
    .nullable()
    .or(z.literal('')),
  imageUrl: z.string().trim().optional().nullable().or(z.literal('')),
  imageType: z.enum(['URL', 'LOCAL', 'NONE']).optional().default('NONE'),
  priority: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return 5;
      const num = typeof val === 'string' ? parseInt(val, 10) : Math.round(val);
      if (isNaN(num)) return 5;
      return Math.max(1, Math.min(10, num));
    })
    .default(5),
});

export const updateItemSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  price: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return null;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
  currency: z.string().trim().optional(),
  url: z.string().trim().url().optional().nullable().or(z.literal('')),
  imageUrl: z.string().trim().optional().nullable().or(z.literal('')),
  imageType: z.enum(['URL', 'LOCAL', 'NONE']).optional(),
  priority: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = typeof val === 'string' ? parseInt(val, 10) : Math.round(val);
      if (isNaN(num)) return undefined;
      return Math.max(1, Math.min(10, num));
    }),
});

export const purchaseItemSchema = z.object({
  purchasedBy: z.string().trim().max(100).optional().nullable(),
});

export const batchItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título del regalo es requerido')
    .max(200, 'El título no puede superar los 200 caracteres'),
  price: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return null;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
  currency: z.string().trim().default('EUR'),
  url: z
    .string()
    .trim()
    .url('La URL de compra no es válida')
    .optional()
    .nullable()
    .or(z.literal('')),
  imageUrl: z.string().trim().optional().nullable().or(z.literal('')),
  imageType: z.enum(['URL', 'LOCAL', 'NONE']).default('URL'),
  priority: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return 5;
      const num = typeof val === 'string' ? parseInt(val, 10) : Math.round(val);
      if (isNaN(num)) return 5;
      return Math.max(1, Math.min(10, num));
    })
    .default(5),
});

export const batchItemsSchema = z.union([
  z.object({
    items: z.array(batchItemSchema).min(1, 'Debe seleccionar al menos un regalo para importar'),
  }),
  z.array(batchItemSchema).min(1, 'Debe seleccionar al menos un regalo para importar'),
]);

