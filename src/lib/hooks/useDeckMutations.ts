import { useCallback } from 'react';
import type { CreateDeckRequestDto, UpdateDeckRequestDto, DeckDto } from '../../types';

/**
 * Hook for deck mutation operations (create, update, delete)
 */
export function useDeckMutations() {
  const createDeck = useCallback(async (data: CreateDeckRequestDto): Promise<DeckDto> => {
    const response = await fetch('/api/decks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create deck');
    }

    return response.json();
  }, []);

  const updateDeck = useCallback(
    async (deckId: string, data: UpdateDeckRequestDto): Promise<DeckDto> => {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update deck');
      }

      return response.json();
    },
    []
  );

  const deleteDeck = useCallback(async (deckId: string): Promise<void> => {
    const response = await fetch(`/api/decks/${deckId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete deck');
    }
  }, []);

  return {
    createDeck,
    updateDeck,
    deleteDeck,
  };
}

