import { useState, useCallback } from 'react';
import type {
  FlashcardDto,
  CreateFlashcardsRequestDto,
  CreateFlashcardsResponseDto,
  UpdateFlashcardRequestDto,
  UpdateFlashcardResponseDto,
} from '../../types';
import type { FlashcardFormData, ApiErrorResponse } from '../../types/viewModels';

interface UseFlashcardMutationsReturn {
  createFlashcard: (data: FlashcardFormData) => Promise<FlashcardDto>;
  updateFlashcard: (id: string, data: FlashcardFormData, originalFlashcard: FlashcardDto) => Promise<FlashcardDto>;
  deleteFlashcard: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook zarządzający operacjami CRUD na fiszkach
 */
export function useFlashcardMutations(): UseFlashcardMutationsReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createFlashcard = useCallback(async (data: FlashcardFormData): Promise<FlashcardDto> => {
    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateFlashcardsRequestDto = {
        flashcards: [
          {
            front: data.front,
            back: data.back,
            source: 'manual',
            generation_id: undefined,
            deck_id: data.deckId,
          },
        ],
      };

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/flashcards';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to create flashcard');
      }

      const created: CreateFlashcardsResponseDto = await response.json();
      return created[0]; // Zwróć pierwszą (i jedyną) utworzoną fiszkę
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas tworzenia fiszki';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFlashcard = useCallback(
    async (id: string, data: FlashcardFormData, originalFlashcard: FlashcardDto): Promise<FlashcardDto> => {
      setIsLoading(true);
      setError(null);

      try {
        // Jeśli edytujemy fiszkę wygenerowaną przez AI (ai_full), zmieniamy źródło na ai_edited
        const source = originalFlashcard.source === 'ai_full' ? 'ai_edited' : originalFlashcard.source;
        
        const payload: UpdateFlashcardRequestDto = {
          front: data.front,
          back: data.back,
          source: source,
          generation_id: originalFlashcard.generation_id || undefined,
          deck_id: data.deckId,
        };

        const response = await fetch(`/api/flashcards/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (response.status === 401) {
          window.location.href = '/auth/login?redirect=/flashcards';
          throw new Error('Unauthorized');
        }

        if (response.status === 403) {
          throw new Error('Nie masz uprawnień do edycji tej fiszki');
        }

        if (response.status === 404) {
          throw new Error('Fiszka nie istnieje');
        }

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.message || 'Failed to update flashcard');
        }

        const updated: UpdateFlashcardResponseDto = await response.json();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas aktualizacji fiszki';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteFlashcard = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/flashcards';
        throw new Error('Unauthorized');
      }

      if (response.status === 403) {
        throw new Error('Nie masz uprawnień do usunięcia tej fiszki');
      }

      // 404 ignorujemy - fiszka już nie istnieje
      if (response.status === 404) {
        return;
      }

      if (!response.ok && response.status !== 204) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to delete flashcard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas usuwania fiszki';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    isLoading,
    error,
  };
}

