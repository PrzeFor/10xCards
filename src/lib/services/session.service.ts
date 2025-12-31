import type { SupabaseClient } from '../../db/supabase.client';
import type { Database } from '../../db/database.types';
import type {
  CreateSessionRequestDto,
  CreateSessionResponseDto,
  SessionDto,
  CompleteSessionRequestDto,
  SessionStatus,
  FlashcardWithSRSDto,
  SRSStateDto,
} from '../../types';

/**
 * Service for handling SRS session operations
 */
export class SessionService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Creates a new review session with flashcards due for review
   * @param userId - The authenticated user ID
   * @param request - Session creation parameters
   * @returns Session details with flashcards
   * @throws Error if no flashcards available for review
   */
  async createSession(
    userId: string,
    request: CreateSessionRequestDto
  ): Promise<CreateSessionResponseDto> {
    const maxCards = request.max_cards ?? 20;
    let flashcardIds = request.flashcard_ids;

    // If no specific flashcard IDs provided, fetch flashcards due for review
    if (!flashcardIds || flashcardIds.length === 0) {
      flashcardIds = await this.getFlashcardsDueForReview(userId, maxCards);

      if (flashcardIds.length === 0) {
        throw new Error('No flashcards available for review');
      }
    }

    // Limit to max_cards
    const selectedIds = flashcardIds.slice(0, maxCards);

    // Fetch full flashcard data with SRS state
    const flashcards = await this.getFlashcardsWithSRS(userId, selectedIds);

    if (flashcards.length === 0) {
      throw new Error('No flashcards found');
    }

    // Create session record with flashcard IDs
    const { data: session, error: sessionError } = await this.supabase
      .from('sessions')
      .insert({
        user_id: userId,
        status: 'active',
        total_cards: flashcards.length,
        completed_cards: 0,
        started_at: new Date().toISOString(),
        flashcard_ids: selectedIds, // Use selectedIds directly
      })
      .select('id, created_at')
      .single();

    if (sessionError || !session) {
      throw new Error(`Failed to create session: ${sessionError?.message}`);
    }

    return {
      session_id: session.id,
      flashcards,
      total_cards: flashcards.length,
      created_at: session.created_at,
    };
  }

  /**
   * Get flashcard IDs that are due for review
   * @param userId - The authenticated user ID
   * @param limit - Maximum number of flashcards to return
   * @returns Array of flashcard IDs
   */
  private async getFlashcardsDueForReview(userId: string, limit: number): Promise<string[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('flashcards')
      .select('id')
      .eq('user_id', userId)
      .lte('next_review', now)
      .order('next_review', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch flashcards due for review: ${error.message}`);
    }

    return (data || []).map((f) => f.id);
  }

  /**
   * Get flashcards with their SRS state
   * @param userId - The authenticated user ID
   * @param flashcardIds - Array of flashcard IDs to fetch
   * @returns Array of flashcards with SRS metadata
   */
  async getFlashcardsWithSRS(
    userId: string,
    flashcardIds: string[]
  ): Promise<FlashcardWithSRSDto[]> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select(
        `
        id,
        front,
        back,
        source,
        generation_id,
        created_at,
        updated_at,
        next_review,
        interval,
        ease_factor,
        repetitions,
        srs_state,
        last_reviewed_at
      `
      )
      .eq('user_id', userId)
      .in('id', flashcardIds)
      .order('next_review', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform to FlashcardWithSRSDto
    return data.map((record) => ({
      id: record.id,
      front: record.front,
      back: record.back,
      source: record.source as 'manual' | 'ai_full' | 'ai_edited',
      generation_id: record.generation_id,
      created_at: record.created_at,
      updated_at: record.updated_at,
      srs_state: {
        next_review: record.next_review,
        interval: record.interval,
        ease_factor: Number(record.ease_factor),
        repetitions: record.repetitions,
        state: record.srs_state as 'new' | 'learning' | 'review' | 'relearning',
        last_reviewed_at: record.last_reviewed_at || undefined,
      } as SRSStateDto,
    }));
  }

  /**
   * Retrieves session details by ID
   * @param sessionId - The session ID
   * @param userId - The authenticated user ID
   * @param includeFlashcards - Whether to include flashcard data
   * @returns Session details or null if not found
   * @throws Error if session doesn't belong to user
   */
  async getSession(
    sessionId: string,
    userId: string,
    includeFlashcards: boolean = false
  ): Promise<SessionDto | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('id, user_id, status, total_cards, completed_cards, started_at, completed_at, stats, flashcard_ids')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to retrieve session: ${error.message}`);
    }

    // Verify ownership
    if (data.user_id !== userId) {
      throw new Error('Access denied to this session');
    }

    const sessionDto: SessionDto = {
      id: data.id,
      user_id: data.user_id,
      status: data.status as SessionStatus,
      total_cards: data.total_cards,
      completed_cards: data.completed_cards,
      started_at: data.started_at,
      completed_at: data.completed_at,
      stats: data.stats || null,
    };

    // Optionally include flashcards
    if (includeFlashcards && data.flashcard_ids && data.flashcard_ids.length > 0) {
      const flashcards = await this.getFlashcardsWithSRS(userId, data.flashcard_ids);
      sessionDto.flashcards = flashcards;
    }

    return sessionDto;
  }

  /**
   * Completes a session and saves statistics
   * @param sessionId - The session ID
   * @param userId - The authenticated user ID
   * @param request - Session results and statistics
   * @returns Updated session details
   * @throws Error if session not found or already completed
   */
  async completeSession(
    sessionId: string,
    userId: string,
    request: CompleteSessionRequestDto
  ): Promise<SessionDto> {
    // Verify session exists and belongs to user
    const existingSession = await this.getSession(sessionId, userId);

    if (!existingSession) {
      throw new Error('Session not found');
    }

    if (existingSession.status === 'completed') {
      throw new Error('Session already completed');
    }

    // Update session
    const { data, error } = await this.supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_cards: request.stats.total_cards,
        completed_at: request.stats.completed_at,
        stats: request.stats,
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select('id, user_id, status, total_cards, completed_cards, started_at, completed_at, stats')
      .single();

    if (error) {
      throw new Error(`Failed to complete session: ${error.message}`);
    }

    if (!data) {
      throw new Error('Session not found after update');
    }

    return {
      id: data.id,
      user_id: data.user_id,
      status: data.status as SessionStatus,
      total_cards: data.total_cards,
      completed_cards: data.completed_cards,
      started_at: data.started_at,
      completed_at: data.completed_at,
      stats: data.stats || null,
    };
  }

  /**
   * Marks a session as abandoned (user exited without completing)
   * @param sessionId - The session ID
   * @param userId - The authenticated user ID
   */
  async abandonSession(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({ status: 'abandoned' })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to abandon session: ${error.message}`);
    }
  }

  /**
   * Get active session for user (if any)
   * @param userId - The authenticated user ID
   * @returns Active session or null
   */
  async getActiveSession(userId: string): Promise<SessionDto | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('id, user_id, status, total_cards, completed_cards, started_at, completed_at, stats')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get active session: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      status: data.status as SessionStatus,
      total_cards: data.total_cards,
      completed_cards: data.completed_cards,
      started_at: data.started_at,
      completed_at: data.completed_at,
      stats: data.stats || null,
    };
  }
}


