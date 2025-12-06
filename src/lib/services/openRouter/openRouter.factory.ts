/**
 * Factory functions for creating OpenRouterService instances
 */

import { OpenRouterService } from './openRouter.service';
import type { OpenRouterServiceOptions } from './openRouter.types';

/**
 * Creates a new OpenRouterService instance with environment configuration
 *
 * @param options - Optional configuration overrides
 * @returns Configured OpenRouterService instance
 * @throws {Error} If OPENROUTER_API_KEY environment variable is not set
 *
 * @example
 * ```ts
 * const openRouter = createOpenRouterService();
 * const response = await openRouter.sendChatCompletion(messages);
 * ```
 */
export function createOpenRouterService(options?: Omit<OpenRouterServiceOptions, 'apiKey'>): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  return new OpenRouterService(apiKey, options);
}

/**
 * Creates a new OpenRouterService instance for flashcard generation
 * Pre-configured with optimal settings for flashcard generation
 *
 * @returns Configured OpenRouterService instance for flashcard generation
 *
 * @example
 * ```ts
 * const openRouter = createFlashcardGenerationService();
 * const response = await openRouter.sendChatCompletion(messages);
 * ```
 */
export function createFlashcardGenerationService(): OpenRouterService {
  return createOpenRouterService({
    defaultModel: 'openai/gpt-4o-mini',
    timeout: 60000, // 60 seconds
    maxRetries: 2,
    retryDelay: 1000,
  });
}
