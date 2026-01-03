import type { SupabaseClient } from '../db/supabase.client';
import type {
  CreateDeckRequestDto,
  UpdateDeckRequestDto,
  DeckDto,
  DeckWithStatsDto,
} from '../../types';

/**
 * Service for managing flashcard decks
 */
export class DeckService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List all decks for a user with flashcard counts
   */
  async listDecks(userId: string): Promise<DeckWithStatsDto[]> {
    // Get all decks for the user
    const { data: decks, error: decksError } = await this.supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (decksError) {
      console.error('Error fetching decks:', decksError);
      throw new Error('Failed to fetch decks');
    }

    if (!decks || decks.length === 0) {
      return [];
    }

    // Get flashcard counts for each deck
    const deckIds = decks.map((deck) => deck.id);
    const { data: counts, error: countsError } = await this.supabase
      .from('flashcards')
      .select('deck_id')
      .in('deck_id', deckIds);

    if (countsError) {
      console.error('Error fetching flashcard counts:', countsError);
      throw new Error('Failed to fetch flashcard counts');
    }

    // Count flashcards per deck
    const countMap = new Map<string, number>();
    counts?.forEach((item) => {
      if (item.deck_id) {
        countMap.set(item.deck_id, (countMap.get(item.deck_id) || 0) + 1);
      }
    });

    // Combine decks with counts
    return decks.map((deck) => ({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      color: deck.color,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
      flashcard_count: countMap.get(deck.id) || 0,
    }));
  }

  /**
   * Get a single deck by ID with flashcard count
   */
  async getDeck(userId: string, deckId: string): Promise<DeckWithStatsDto> {
    // Get the deck
    const { data: deck, error: deckError } = await this.supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .eq('user_id', userId)
      .single();

    if (deckError || !deck) {
      console.error('Error fetching deck:', deckError);
      throw new Error('Deck not found');
    }

    // Get flashcard count
    const { count, error: countError } = await this.supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('deck_id', deckId);

    if (countError) {
      console.error('Error fetching flashcard count:', countError);
      throw new Error('Failed to fetch flashcard count');
    }

    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      color: deck.color,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
      flashcard_count: count || 0,
    };
  }

  /**
   * Create a new deck
   */
  async createDeck(userId: string, data: CreateDeckRequestDto): Promise<DeckDto> {
    const { data: deck, error } = await this.supabase
      .from('decks')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description || null,
        color: data.color || '#3b82f6',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating deck:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new Error('Zestaw o tej nazwie już istnieje');
      }
      
      throw new Error('Failed to create deck');
    }

    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      color: deck.color,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
    };
  }

  /**
   * Update an existing deck
   */
  async updateDeck(
    userId: string,
    deckId: string,
    data: UpdateDeckRequestDto
  ): Promise<DeckDto> {
    // First verify the deck exists and belongs to the user
    const { data: existingDeck, error: fetchError } = await this.supabase
      .from('decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingDeck) {
      throw new Error('Deck not found');
    }

    // Update the deck
    const { data: deck, error } = await this.supabase
      .from('decks')
      .update({
        name: data.name,
        description: data.description,
        color: data.color,
      })
      .eq('id', deckId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating deck:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new Error('Zestaw o tej nazwie już istnieje');
      }
      
      throw new Error('Failed to update deck');
    }

    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      color: deck.color,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
    };
  }

  /**
   * Delete a deck
   */
  async deleteDeck(userId: string, deckId: string): Promise<void> {
    const { error } = await this.supabase
      .from('decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting deck:', error);
      throw new Error('Failed to delete deck');
    }
  }
}

