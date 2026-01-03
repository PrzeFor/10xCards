import { z } from 'zod';
import type { CreateFlashcardRequestDto, CreateFlashcardsRequestDto, FlashcardSource } from '../../types';

/**
 * Schema for validating flashcard source enum
 */
export const flashcardSourceSchema = z.enum([
  'manual',
  'ai_full',
  'ai_edited',
] as const) satisfies z.ZodType<FlashcardSource>;

/**
 * Schema for validating single flashcard creation request
 */
export const createFlashcardRequestSchema = z
  .object({
    front: z.string().min(1, 'Front text cannot be empty').max(300, 'Front text cannot exceed 300 characters').trim(),
    back: z.string().min(1, 'Back text cannot be empty').max(500, 'Back text cannot exceed 500 characters').trim(),
    source: flashcardSourceSchema,
    generation_id: z.string().uuid('Generation ID must be a valid UUID').optional(),
    deck_id: z.string().uuid('Deck ID must be a valid UUID').optional(),
  })
  .refine(
    (data) => {
      // If source is ai_full or ai_edited, generation_id is required
      if (data.source === 'ai_full' || data.source === 'ai_edited') {
        return data.generation_id !== undefined;
      }
      return true;
    },
    {
      message: 'Generation ID is required when source is ai_full or ai_edited',
      path: ['generation_id'],
    }
  ) satisfies z.ZodType<CreateFlashcardRequestDto>;

/**
 * Schema for validating flashcards creation request
 */
export const createFlashcardsRequestSchema = z.object({
  flashcards: z
    .array(createFlashcardRequestSchema)
    .min(1, 'At least one flashcard is required')
    .max(100, 'Cannot create more than 100 flashcards at once'),
}) satisfies z.ZodType<CreateFlashcardsRequestDto>;

/**
 * Schema for validating query parameters for listing flashcards
 */
export const listFlashcardsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be non-negative')
    .default(0),
  filter_source: flashcardSourceSchema.optional(),
  filter_deck_id: z.string().uuid('Deck ID must be a valid UUID').optional(),
  sort_created_at: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Type for validated query parameters
 */
export type ListFlashcardsQuery = z.infer<typeof listFlashcardsQuerySchema>;

/**
 * Schema for validating flashcard ID parameter in URL
 */
export const flashcardIdParamSchema = z.object({
  cardId: z.string().uuid('Card ID must be a valid UUID'),
});

/**
 * Schema for validating flashcard update request
 * Uses the same schema as creation since the structure is identical
 */
export const updateFlashcardRequestSchema = createFlashcardRequestSchema;

/**
 * Schema for validating delete flashcard params
 * Same as flashcardIdParamSchema but exported with semantic name for delete operations
 */
export const deleteFlashcardParamsSchema = flashcardIdParamSchema;

/**
 * Type for validated delete flashcard parameters
 */
export type DeleteFlashcardParams = z.infer<typeof deleteFlashcardParamsSchema>;