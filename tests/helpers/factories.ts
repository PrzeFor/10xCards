import type { Database } from '@/db/database.types';
import type { FlashcardProposalViewModel } from '@/types/viewModels';

/**
 * Factory functions for creating test data
 * Follows the Factory pattern for consistent test data generation
 */

type FlashcardRow = Database['public']['Tables']['flashcards']['Row'];
type GenerationRow = Database['public']['Tables']['generations']['Row'];

let flashcardIdCounter = 1;
let generationIdCounter = 1;
let proposalIdCounter = 1;

export function createTestFlashcard(
  overrides?: Partial<FlashcardRow>
): FlashcardRow {
  const id = flashcardIdCounter++;
  
  return {
    id: `test-flashcard-${id}`,
    user_id: 'test-user-id',
    generation_id: 'test-generation-id',
    front: `Test flashcard front ${id}`,
    back: `Test flashcard back ${id}`,
    source: 'ai_full',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestGeneration(
  overrides?: Partial<GenerationRow>
): GenerationRow {
  const id = generationIdCounter++;
  
  return {
    id: `test-generation-${id}`,
    user_id: 'test-user-id',
    source_text: 'A'.repeat(500), // Min length is 500
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    status: 'completed',
    generated_count: 0,
    accepted_unedited_count: 0,
    accepted_edited_count: 0,
    source_text_length: 500,
    generation_duration: 1000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export interface TestUser {
  id: string;
  email: string;
}

export function createTestUser(
  overrides?: Partial<TestUser>
): TestUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides,
  };
}

export function createTestFlashcardProposal(
  overrides?: Partial<FlashcardProposalViewModel>
): FlashcardProposalViewModel {
  const id = proposalIdCounter++;
  
  return {
    id: `test-proposal-${id}`,
    front: `Test flashcard front ${id}`,
    back: `Test flashcard back ${id}`,
    source: 'ai_full',
    isSelected: false,
    status: 'pending',
    ...overrides,
  };
}

/**
 * Reset counters between test suites if needed
 */
export function resetFactoryCounters() {
  flashcardIdCounter = 1;
  generationIdCounter = 1;
  proposalIdCounter = 1;
}

