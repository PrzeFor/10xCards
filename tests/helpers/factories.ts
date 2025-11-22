import type { 
  Flashcard, 
  Generation, 
  User 
} from '@/types';

/**
 * Factory functions for creating test data
 * Follows the Factory pattern for consistent test data generation
 */

let flashcardIdCounter = 1;
let generationIdCounter = 1;

export function createTestFlashcard(
  overrides?: Partial<Flashcard>
): Flashcard {
  const id = flashcardIdCounter++;
  
  return {
    id: `test-flashcard-${id}`,
    user_id: 'test-user-id',
    generation_id: 'test-generation-id',
    front: `Test flashcard front ${id}`,
    back: `Test flashcard back ${id}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestGeneration(
  overrides?: Partial<Generation>
): Generation {
  const id = generationIdCounter++;
  
  return {
    id: `test-generation-${id}`,
    user_id: 'test-user-id',
    source_text: 'A'.repeat(500), // Min length is 500
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    status: 'completed',
    flashcard_count: 0,
    source_text_length: 500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestUser(
  overrides?: Partial<User>
): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides,
  };
}

/**
 * Reset counters between test suites if needed
 */
export function resetFactoryCounters() {
  flashcardIdCounter = 1;
  generationIdCounter = 1;
}

