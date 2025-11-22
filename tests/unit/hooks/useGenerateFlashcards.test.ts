import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGenerateFlashcards } from '@/lib/hooks/useGenerateFlashcards';
import { toast } from 'sonner';
import type { CreateGenerationResponseDto } from '@/types';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useGenerateFlashcards', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Initial state', () => {
    it('should have initial state with isLoading false and error null', () => {
      const { result } = renderHook(() => useGenerateFlashcards());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.generate).toBe('function');
    });
  });

  describe('Successful generation', () => {
    it('should set isLoading to true during generation', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      // Create a promise that we can resolve later to control timing
      let resolveResponse: () => void;
      const responsePromise = new Promise<void>((resolve) => {
        resolveResponse = resolve;
      });

      mockFetch.mockReturnValueOnce(
        responsePromise.then(() => ({
          ok: true,
          json: async () => mockResponse,
        })) as any
      );

      const { result } = renderHook(() => useGenerateFlashcards());

      // Start generation
      let generatePromise!: Promise<any>;
      act(() => {
        generatePromise = result.current.generate('A'.repeat(500));
      });

      // Check that isLoading is true
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Now resolve the fetch and wait for completion
      await act(async () => {
        resolveResponse!();
        await generatePromise;
      });
    });

    it('should set isLoading to false after successful generation', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        await result.current.generate('A'.repeat(500));
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should call fetch with correct parameters', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      const sourceText = 'A'.repeat(500);
      await act(async () => {
        await result.current.generate(sourceText);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source_text: sourceText }),
      });
    });

    it('should return response data', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [
          { id: '1', front: 'Q1', back: 'A1', source: 'ai_full' },
          { id: '2', front: 'Q2', back: 'A2', source: 'ai_full' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      let data: any;
      await act(async () => {
        data = await result.current.generate('A'.repeat(500));
      });

      expect(data).toEqual(mockResponse);
    });

    it('should show success toast with generated count', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 7,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        await result.current.generate('A'.repeat(500));
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Fiszki zostały wygenerowane!',
          expect.objectContaining({
            description: 'Wygenerowano 7 propozycji fiszek',
          })
        );
      });
    });

    it('should clear error on successful generation', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGenerateFlashcards());

      // Trigger error
      await act(async () => {
        try {
          await result.current.generate('A'.repeat(500));
        } catch {}
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await act(async () => {
        await result.current.generate('A'.repeat(500));
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle 400 Bad Request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Failed to parse JSON');
        },
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        await expect(result.current.generate('A'.repeat(500))).rejects.toThrow(
          'Nieprawidłowe dane wejściowe. Sprawdź długość tekstu.'
        );
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Nieprawidłowe dane wejściowe. Sprawdź długość tekstu.');
      });
    });

    it('should handle 429 Too Many Requests error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => {
          throw new Error('Failed to parse JSON');
        },
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        await expect(result.current.generate('A'.repeat(500))).rejects.toThrow(
          'Zbyt wiele żądań. Spróbuj ponownie za chwilę.'
        );
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Zbyt wiele żądań. Spróbuj ponownie za chwilę.');
      });
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Failed to parse JSON');
        },
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        await expect(result.current.generate('A'.repeat(500))).rejects.toThrow(
          'Błąd serwera. Spróbuj ponownie później.'
        );
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Błąd serwera. Spróbuj ponownie później.');
      });
    });

    it('should use error message from response if available', async () => {
      const customError = 'Custom error from server';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: customError }),
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        await expect(result.current.generate('A'.repeat(500))).rejects.toThrow(customError);
      });

      await waitFor(() => {
        expect(result.current.error).toBe(customError);
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        await expect(result.current.generate('A'.repeat(500))).rejects.toThrow(
          'Network connection failed'
        );
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network connection failed');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => useGenerateFlashcards());

      // The hook throws the original error, but sets state to translated message
      await act(async () => {
        await expect(result.current.generate('A'.repeat(500))).rejects.toEqual('Unknown error');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Nieznany błąd');
      });
    });

    it('should show error toast on failure', async () => {
      const errorMessage = 'Generation failed';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        try {
          await result.current.generate('A'.repeat(500));
        } catch {}
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Błąd generowania fiszek',
          expect.objectContaining({
            description: errorMessage,
            action: expect.objectContaining({
              label: 'Spróbuj ponownie',
            }),
          })
        );
      });
    });

    it('should handle malformed JSON in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        await expect(result.current.generate('A'.repeat(500))).rejects.toThrow(
          'Błąd serwera. Spróbuj ponownie później.'
        );
      });
    });

    it('should set isLoading to false even when error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        try {
          await result.current.generate('A'.repeat(500));
        } catch {}
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very long source text', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      const longText = 'A'.repeat(15000);
      await act(async () => {
        await result.current.generate(longText);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/generations',
        expect.objectContaining({
          body: JSON.stringify({ source_text: longText }),
        })
      );
    });

    it('should handle zero generated flashcards', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 0,
        generation_duration: 500,
        flashcards_proposals: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      let data: any;
      await act(async () => {
        data = await result.current.generate('A'.repeat(500));
      });

      expect(data.generated_count).toBe(0);
      expect(toast.success).toHaveBeenCalledWith(
        'Fiszki zostały wygenerowane!',
        expect.objectContaining({
          description: 'Wygenerowano 0 propozycji fiszek',
        })
      );
    });

    it('should handle concurrent generation requests', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockResponse, id: 'gen-2' }),
        });

      const { result } = renderHook(() => useGenerateFlashcards());

      let promise1!: Promise<any>;
      let promise2!: Promise<any>;
      act(() => {
        promise1 = result.current.generate('A'.repeat(500));
        promise2 = result.current.generate('B'.repeat(500));
      });

      const [data1, data2] = await act(async () => {
        return await Promise.all([promise1, promise2]);
      });

      expect(data1.id).toBe('gen-1');
      expect(data2.id).toBe('gen-2');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('State management', () => {
    it('should reset error when starting new generation', async () => {
      // First request fails
      mockFetch.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useGenerateFlashcards());

      await act(async () => {
        try {
          await result.current.generate('A'.repeat(500));
        } catch {}
      });

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Second request starts (should clear error immediately)
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      let generatePromise!: Promise<any>;
      act(() => {
        generatePromise = result.current.generate('B'.repeat(500));
      });

      // Error should be cleared at the start of new generation
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      await generatePromise;
    });

    it('should maintain isLoading state correctly across multiple calls', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 5,
        generation_duration: 1000,
        flashcards_proposals: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGenerateFlashcards());

      // First call
      await act(async () => {
        await result.current.generate('A'.repeat(500));
      });
      expect(result.current.isLoading).toBe(false);

      // Second call
      await act(async () => {
        await result.current.generate('B'.repeat(500));
      });
      expect(result.current.isLoading).toBe(false);

      // Third call
      await act(async () => {
        await result.current.generate('C'.repeat(500));
      });
      expect(result.current.isLoading).toBe(false);
    });
  });
});

