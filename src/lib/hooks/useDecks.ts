import { useState, useEffect, useCallback } from 'react';
import type { DeckWithStatsDto } from '../../types';

/**
 * Hook for fetching and managing decks list
 */
export function useDecks() {
  const [decks, setDecks] = useState<DeckWithStatsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/decks');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch decks');
      }

      const data = await response.json();
      setDecks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching decks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return {
    decks,
    loading,
    error,
    refetch: fetchDecks,
  };
}

