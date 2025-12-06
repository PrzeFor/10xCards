import type { SupabaseClient } from '../../db/supabase.client';
import type { Database } from '../../db/database.types';
import type { CreateFlashcardRequestDto, FlashcardDto, FlashcardSource } from '../../types';

/**
 * Service for handling flashcard operations
 */
export class FlashcardService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Creates multiple flashcards in a single transaction
   * @param userId - The authenticated user ID
   * @param requests - Array of flashcard creation requests
   * @returns Array of created flashcard DTOs
   */
  async createFlashcards(userId: string, requests: CreateFlashcardRequestDto[]): Promise<FlashcardDto[]> {
    // Validate generation IDs for AI sources
    await this.validateGenerationIds(userId, requests);

    // Prepare records for insertion
    const records = requests.map((request) => ({
      user_id: userId,
      front: request.front,
      back: request.back,
      source: request.source,
      generation_id: request.generation_id || null,
    }));

    // Insert flashcards in a single transaction
    const { data, error } = await this.supabase
      .from('flashcards')
      .insert(records)
      .select('id, user_id, generation_id, front, back, source, created_at, updated_at');

    if (error) {
      throw new Error(`Failed to create flashcards: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No flashcards were created');
    }

    // Map to FlashcardDto format
    return data.map((record) => ({
      id: record.id,
      generation_id: record.generation_id,
      front: record.front,
      back: record.back,
      source: record.source as FlashcardSource,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }));
  }

  /**
   * Validates that all generation IDs exist and belong to the user
   * @param userId - The authenticated user ID
   * @param requests - Array of flashcard creation requests
   */
  private async validateGenerationIds(userId: string, requests: CreateFlashcardRequestDto[]): Promise<void> {
    // Extract unique generation IDs from AI sources
    const generationIds = requests
      .filter((req) => req.source !== 'manual' && req.generation_id)
      .map((req) => req.generation_id!)
      .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

    if (generationIds.length === 0) {
      return; // No generation IDs to validate
    }

    // UUID format is already validated by Zod schema, so we can skip additional validation here
    // The Zod schema uses a more permissive UUID validation that accepts all valid UUID formats

    // Check if all generation IDs exist and belong to the user
    const { data: generations, error } = await this.supabase
      .from('generations')
      .select('id, status')
      .eq('user_id', userId)
      .in('id', generationIds);

    if (error) {
      console.error('Database error validating generation IDs:', error);
      throw new Error(`Database error during validation: ${error.message}`);
    }

    const foundIds = generations?.map((g) => g.id) || [];
    const missingIds = generationIds.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new Error(`Generation not found or access denied: ${missingIds.join(', ')}`);
    }

    // Check if any generations are still pending (optional validation)
    const pendingGenerations = generations?.filter((g) => g.status === 'pending') || [];
    if (pendingGenerations.length > 0) {
      console.warn(
        `Warning: Using flashcards from pending generations: ${pendingGenerations.map((g) => g.id).join(', ')}`
      );
    }
  }

  /**
   * Retrieves a single flashcard by ID for the authenticated user
   * @param userId - The authenticated user ID
   * @param flashcardId - The flashcard ID to retrieve
   * @returns FlashcardDto or null if not found
   */
  async getFlashcard(userId: string, flashcardId: string): Promise<FlashcardDto | null> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('id, user_id, generation_id, front, back, source, created_at, updated_at')
      .eq('id', flashcardId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to retrieve flashcard: ${error.message}`);
    }

    return {
      id: data.id,
      generation_id: data.generation_id,
      front: data.front,
      back: data.back,
      source: data.source as FlashcardSource,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
