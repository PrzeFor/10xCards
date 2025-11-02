import { z } from 'zod';
import type { 
  CreateFlashcardRequestDto, 
  CreateFlashcardsRequestDto,
  FlashcardSource
} from '../../types';

/**
 * Schema for validating flashcard source enum
 */
export const flashcardSourceSchema = z.enum(['manual', 'ai_full', 'ai_edited'] as const) satisfies z.ZodType<FlashcardSource>;

/**
 * Schema for validating single flashcard creation request
 */
export const createFlashcardRequestSchema = z.object({
  front: z
    .string()
    .min(1, 'Front text cannot be empty')
    .max(300, 'Front text cannot exceed 300 characters')
    .trim(),
  back: z
    .string()
    .min(1, 'Back text cannot be empty')
    .max(500, 'Back text cannot exceed 500 characters')
    .trim(),
  source: flashcardSourceSchema,
  generation_id: z
    .string()
    .uuid('Generation ID must be a valid UUID')
    .optional()
}).refine((data) => {
  // If source is ai_full or ai_edited, generation_id is required
  if (data.source === 'ai_full' || data.source === 'ai_edited') {
    return data.generation_id !== undefined;
  }
  return true;
}, {
  message: 'Generation ID is required when source is ai_full or ai_edited',
  path: ['generation_id']
}) satisfies z.ZodType<CreateFlashcardRequestDto>;

/**
 * Schema for validating flashcards creation request
 */
export const createFlashcardsRequestSchema = z.object({
  flashcards: z
    .array(createFlashcardRequestSchema)
    .min(1, 'At least one flashcard is required')
    .max(100, 'Cannot create more than 100 flashcards at once')
}) satisfies z.ZodType<CreateFlashcardsRequestDto>;
