import type { SupabaseClient } from '../../db/supabase.client';
import type { Database } from '../../db/database.types';
import type { CreateFlashcardRequestDto, FlashcardDto, FlashcardSource, ListFlashcardsResponseDto } from '../../types';
import type { ListFlashcardsQuery } from '../schemas/flashcards';

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

  /**
   * Lists flashcards for a user with pagination, filtering, and sorting
   * @param userId - The authenticated user ID
   * @param query - Query parameters (limit, offset, filters, sort)
   * @returns Paginated list of flashcards
   */
  async listFlashcards(userId: string, query: ListFlashcardsQuery): Promise<ListFlashcardsResponseDto> {
    const { limit, offset, filter_source, sort_created_at } = query;

    // Build base query with count
    let supabaseQuery = this.supabase
      .from('flashcards')
      .select('id, front, back, source, generation_id, created_at, updated_at', {
        count: 'exact',
      })
      .eq('user_id', userId); // Explicit user filter (RLS also enforces this)

    // Apply optional source filter
    if (filter_source) {
      supabaseQuery = supabaseQuery.eq('source', filter_source);
    }

    // Apply sorting
    const ascending = sort_created_at === 'asc';
    supabaseQuery = supabaseQuery.order('created_at', { ascending });

    // Apply pagination
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Database error listing flashcards:', error);
      throw new Error(`Failed to list flashcards: ${error.message}`);
    }

    // Transform to DTOs
    const items: FlashcardDto[] = (data || []).map((record) => ({
      id: record.id,
      front: record.front,
      back: record.back,
      source: record.source as FlashcardSource,
      generation_id: record.generation_id,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }));

    // Return paginated response
    return {
      items,
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Updates an existing flashcard
   * @param userId - The authenticated user ID
   * @param cardId - The flashcard ID to update
   * @param updateData - The update data
   * @returns Updated flashcard DTO
   * @throws Error if flashcard not found, forbidden, or generation validation fails
   */
  async updateFlashcard(
    userId: string,
    cardId: string,
    updateData: CreateFlashcardRequestDto
  ): Promise<FlashcardDto> {
    // Step 1: Fetch existing flashcard and verify ownership
    const existingFlashcard = await this.getFlashcard(userId, cardId);

    if (!existingFlashcard) {
      throw new Error('Flashcard not found');
    }

    // Step 2: Ownership is already verified by getFlashcard (filters by userId)
    // No additional check needed

    // Step 3: Validate generation_id if provided
    if (updateData.generation_id) {
      const { data: generation, error } = await this.supabase
        .from('generations')
        .select('user_id')
        .eq('id', updateData.generation_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Generation not found');
        }
        console.error('Error fetching generation:', error);
        throw new Error('Failed to validate generation');
      }

      if (!generation) {
        throw new Error('Generation not found');
      }

      if (generation.user_id !== userId) {
        throw new Error('Generation forbidden');
      }
    }

    // Step 4: Update flashcard
    const { data, error } = await this.supabase
      .from('flashcards')
      .update({
        front: updateData.front,
        back: updateData.back,
        source: updateData.source,
        generation_id: updateData.generation_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .eq('user_id', userId) // Double-check ownership
      .select('id, front, back, source, generation_id, created_at, updated_at')
      .single();

    if (error) {
      console.error('Database error updating flashcard:', error);
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    if (!data) {
      throw new Error('Flashcard not found after update');
    }

    // Step 5: Transform to DTO
    return {
      id: data.id,
      front: data.front,
      back: data.back,
      source: data.source as FlashcardSource,
      generation_id: data.generation_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Deletes a flashcard and updates related generation statistics.
   * @param userId - The authenticated user ID
   * @param cardId - The flashcard ID to delete
   * @throws Error with code 'NOT_FOUND' if flashcard doesn't exist
   * @throws Error with code 'FORBIDDEN' if user doesn't own the flashcard
   * @throws Error for database errors
   */
  async deleteFlashcard(userId: string, cardId: string): Promise<void> {
    // Step 1: Verify flashcard exists and get its data
    const { data: flashcard, error: fetchError } = await this.supabase
      .from('flashcards')
      .select('id, generation_id, source, user_id')
      .eq('id', cardId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // Not found
        const error = new Error('Flashcard not found');
        (error as any).code = 'NOT_FOUND';
        throw error;
      }
      throw fetchError;
    }

    // Step 2: Verify ownership
    if (flashcard.user_id !== userId) {
      const error = new Error("You don't have permission to delete this flashcard");
      (error as any).code = 'FORBIDDEN';
      throw error;
    }

    // Step 3: Delete the flashcard
    const { error: deleteError } = await this.supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId); // Double-check ownership

    if (deleteError) {
      throw deleteError;
    }

    // Step 4: Update generation statistics if applicable
    if (flashcard.generation_id) {
      await this.updateGenerationStatsAfterDeletion(
        flashcard.generation_id,
        flashcard.source
      );
    }
  }

  /**
   * Updates generation statistics after a flashcard is deleted.
   * Decrements counters based on flashcard source.
   * @param generationId - The generation ID to update
   * @param source - The source type of the deleted flashcard
   */
  private async updateGenerationStatsAfterDeletion(
    generationId: string,
    source: string
  ): Promise<void> {
    // Fetch current generation data
    const { data: generation, error: fetchError } = await this.supabase
      .from('generations')
      .select('generated_count, accepted_unedited_count, accepted_edited_count')
      .eq('id', generationId)
      .single();

    if (fetchError || !generation) {
      // Generation might have been deleted (ON DELETE SET NULL)
      // This is not an error condition, just return
      return;
    }

    // Calculate new values
    const updates: any = {
      generated_count: Math.max(0, generation.generated_count - 1),
    };

    if (source === 'ai_full') {
      updates.accepted_unedited_count = Math.max(
        0,
        (generation.accepted_unedited_count || 0) - 1
      );
    } else if (source === 'ai_edited') {
      updates.accepted_edited_count = Math.max(
        0,
        (generation.accepted_edited_count || 0) - 1
      );
    }

    // Update generation
    const { error: updateError } = await this.supabase
      .from('generations')
      .update(updates)
      .eq('id', generationId);

    if (updateError) {
      // Log error but don't throw - flashcard is already deleted
      console.error('Failed to update generation stats:', updateError);
    }
  }
}
