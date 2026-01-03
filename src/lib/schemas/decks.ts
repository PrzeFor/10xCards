import { z } from 'zod';

/**
 * Schema for creating a new deck
 */
export const createDeckRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa zestawu jest wymagana')
    .max(100, 'Nazwa zestawu nie może przekraczać 100 znaków')
    .trim(),
  description: z
    .string()
    .max(500, 'Opis nie może przekraczać 500 znaków')
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Kolor musi być w formacie hex (#RRGGBB)')
    .optional()
    .nullable()
    .default('#3b82f6'),
});

/**
 * Schema for updating an existing deck
 */
export const updateDeckRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa zestawu jest wymagana')
    .max(100, 'Nazwa zestawu nie może przekraczać 100 znaków')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Opis nie może przekraczać 500 znaków')
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Kolor musi być w formacie hex (#RRGGBB)')
    .optional()
    .nullable(),
});

