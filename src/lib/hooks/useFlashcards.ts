import { useState, useEffect, useCallback } from 'react';
import type {
  FlashcardDto,
  ListFlashcardsResponseDto,
} from '../../types';
import type { FlashcardFilters, PaginationState } from '../../types/viewModels';

interface UseFlashcardsParams {
  filters: FlashcardFilters;
  pagination: PaginationState;
}

interface UseFlashcardsReturn {
  flashcards: FlashcardDto[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
}

/**
 * Hook zarządzający pobieraniem i cache'owaniem listy fiszek
 */
export function useFlashcards({ filters, pagination }: UseFlashcardsParams): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const fetchFlashcards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Buduj query params
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        'sort[created_at]': filters.sortOrder,
      });

      // Dodaj filtr source jeśli został wybrany
      if (filters.source) {
        params.append('filter[source]', filters.source);
      }

      // Dodaj filtr deck_id jeśli został wybrany
      if (filters.deckId) {
        params.append('filter[deck_id]', filters.deckId);
      }

      const response = await fetch(`/api/flashcards?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Obsługa błędów uwierzytelniania
      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/flashcards';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch flashcards');
      }

      const data: ListFlashcardsResponseDto = await response.json();
      
      setFlashcards(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Brak połączenia z internetem. Sprawdź swoje połączenie.');
      } else {
        setError('Wystąpił błąd podczas pobierania fiszek.');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  return {
    flashcards,
    loading,
    error,
    total,
    refetch: fetchFlashcards,
  };
}

