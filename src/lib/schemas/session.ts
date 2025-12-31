import { z } from 'zod';
import type {
  RatingValue,
  CreateSessionRequestDto,
  UpdateSRSStateRequestDto,
  SessionCardResultDto,
  CompleteSessionRequestDto,
} from '../../types';

/**
 * Schema dla oceny trudności fiszki
 */
export const ratingValueSchema = z.enum(['easy', 'medium', 'hard'] as const) satisfies z.ZodType<RatingValue>;

/**
 * Schema dla żądania utworzenia sesji
 */
export const createSessionRequestSchema = z.object({
  flashcard_ids: z.array(z.string().uuid()).optional(),
  max_cards: z.number().int().min(1).max(100).default(20),
}) satisfies z.ZodType<CreateSessionRequestDto>;

/**
 * Schema dla aktualizacji stanu SRS
 */
export const updateSRSStateRequestSchema = z.object({
  rating: ratingValueSchema,
  review_duration: z.number().min(0).optional(),
}) satisfies z.ZodType<UpdateSRSStateRequestDto>;

/**
 * Schema dla wyniku pojedynczej karty
 */
export const sessionCardResultSchema = z.object({
  flashcard_id: z.string().uuid(),
  rating: ratingValueSchema,
  timestamp: z.string().datetime(),
  review_duration: z.number().min(0),
}) satisfies z.ZodType<SessionCardResultDto>;

/**
 * Schema dla statystyk sesji
 */
export const sessionStatsSchema = z.object({
  total_cards: z.number().int().min(0),
  easy_count: z.number().int().min(0),
  medium_count: z.number().int().min(0),
  hard_count: z.number().int().min(0),
  duration: z.number().min(0),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime(),
});

/**
 * Schema dla zakończenia sesji
 */
export const completeSessionRequestSchema = z.object({
  results: z.array(sessionCardResultSchema),
  stats: sessionStatsSchema,
}) satisfies z.ZodType<CompleteSessionRequestDto>;

/**
 * Walidacja czy suma ocen zgadza się z liczbą kart
 */
export const validateSessionStats = (stats: {
  total_cards: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
}): boolean => {
  const sumRatings = stats.easy_count + stats.medium_count + stats.hard_count;
  return sumRatings === stats.total_cards;
};


