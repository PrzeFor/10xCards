import { z } from 'zod';
import type {
  CreateGenerationRequestDto,
  CreateGenerationResponseDto,
  FlashcardProposalDto,
  GenerationStatus,
  FlashcardSource,
} from '../../types';

/**
 * Schema for validating generation creation request
 */
export const createGenerationRequestSchema = z.object({
  source_text: z
    .string()
    .min(500, 'Tekst musi mieć co najmniej 500 znaków')
    .max(15000, 'Tekst nie może przekraczać 15,000 znaków')
    .trim(),
}) satisfies z.ZodType<CreateGenerationRequestDto>;

/**
 * Schema for validating flashcard proposal from AI
 */
export const flashcardProposalSchema = z.object({
  id: z.string().uuid(),
  front: z.string().min(1, 'Front text cannot be empty').max(1000),
  back: z.string().min(1, 'Back text cannot be empty').max(2000),
  source: z.enum(['manual', 'ai_full', 'ai_edited'] as const),
}) satisfies z.ZodType<FlashcardProposalDto>;

/**
 * Schema for validating generation response
 */
export const createGenerationResponseSchema = z.object({
  id: z.string().uuid(),
  model: z.string().min(1),
  status: z.enum(['pending', 'completed', 'failed'] as const),
  generated_count: z.number().int().min(0),
  source_text_length: z.number().int().min(500).max(15000),
  flashcards_proposals: z.array(flashcardProposalSchema),
}) satisfies z.ZodType<CreateGenerationResponseDto>;

/**
 * Schema for validating AI service response
 */
export const aiServiceResponseSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string().min(1).max(1000),
      back: z.string().min(1).max(2000),
    })
  ),
  model: z.string().min(1),
});

/**
 * Type for AI service response
 */
export type AIServiceResponse = z.infer<typeof aiServiceResponseSchema>;
