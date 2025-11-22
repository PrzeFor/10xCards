import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSaveFlashcards } from '@/lib/hooks/useSaveFlashcards';
import { toast } from 'sonner';
import type { FlashcardProposalViewModel } from '@/types/viewModels';
import type { CreateFlashcardsResponseDto } from '@/types';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSaveFlashcards', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createMockProposal = (
    overrides?: Partial<FlashcardProposalViewModel>
  ): FlashcardProposalViewModel => ({
    id: 'proposal-1',
    front: 'Test front',
    back: 'Test back',
    source: 'ai_full',
    isSelected: true,
    status: 'accepted',
    ...overrides,
  });

  describe('Initial state', () => {
    it('should have initial state with isSaving false and error null', () => {
      const { result } = renderHook(() => useSaveFlashcards());

      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.saveSelected).toBe('function');
    });
  });

  describe('Successful save', () => {
    it('should set isSaving to true during save', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [
        {
          id: 'fc-1',
          front: 'Test front',
          back: 'Test back',
          source: 'ai_full',
          generation_id: 'gen-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

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

      const { result } = renderHook(() => useSaveFlashcards());

      const proposals = [createMockProposal()];
      
      // Start save
      let savePromise!: Promise<any>;
      act(() => {
        savePromise = result.current.saveSelected(proposals, 'gen-1');
      });

      // Check that isSaving is true
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      // Now resolve the fetch and wait for completion
      await act(async () => {
        resolveResponse!();
        await savePromise;
      });
    });

    it('should set isSaving to false after successful save', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await result.current.saveSelected([createMockProposal()], 'gen-1');
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });

    it('should map proposals to correct API format for ai_full source', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      const proposals: FlashcardProposalViewModel[] = [
        createMockProposal({
          id: 'p1',
          front: 'Q1',
          back: 'A1',
          status: 'accepted',
        }),
      ];

      await act(async () => {
        await result.current.saveSelected(proposals, 'gen-1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/flashcards',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flashcards: [
              {
                front: 'Q1',
                back: 'A1',
                source: 'ai_full',
                generation_id: 'gen-1',
              },
            ],
          }),
        })
      );
    });

    it('should map proposals to ai_edited source when status is edited', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      const proposals: FlashcardProposalViewModel[] = [
        createMockProposal({
          id: 'p1',
          front: 'Original Q1',
          back: 'Original A1',
          status: 'edited',
          editedFront: 'Edited Q1',
          editedBack: 'Edited A1',
        }),
      ];

      await act(async () => {
        await result.current.saveSelected(proposals, 'gen-1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/flashcards',
        expect.objectContaining({
          body: JSON.stringify({
            flashcards: [
              {
                front: 'Edited Q1',
                back: 'Edited A1',
                source: 'ai_edited',
                generation_id: 'gen-1',
              },
            ],
          }),
        })
      );
    });

    it('should handle multiple proposals', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      const proposals: FlashcardProposalViewModel[] = [
        createMockProposal({ id: 'p1', front: 'Q1', back: 'A1', status: 'accepted' }),
        createMockProposal({ id: 'p2', front: 'Q2', back: 'A2', status: 'accepted' }),
        createMockProposal({
          id: 'p3',
          front: 'Q3',
          back: 'A3',
          status: 'edited',
          editedFront: 'Edited Q3',
          editedBack: 'Edited A3',
        }),
      ];

      await act(async () => {
        await result.current.saveSelected(proposals, 'gen-1');
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.flashcards).toHaveLength(3);
      expect(callBody.flashcards[0].source).toBe('ai_full');
      expect(callBody.flashcards[1].source).toBe('ai_full');
      expect(callBody.flashcards[2].source).toBe('ai_edited');
    });

    it('should return response data', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [
        {
          id: 'fc-1',
          front: 'Test front',
          back: 'Test back',
          source: 'ai_full',
          generation_id: 'gen-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      let data;
      await act(async () => {
        data = await result.current.saveSelected([createMockProposal()], 'gen-1');
      });

      expect(data).toEqual(mockResponse);
    });

    it('should show success toast with correct Polish pluralization for 1 flashcard', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [
        {
          id: 'fc-1',
          front: 'Test front',
          back: 'Test back',
          source: 'ai_full',
          generation_id: 'gen-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await result.current.saveSelected([createMockProposal()], 'gen-1');
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Fiszki zostały zapisane!',
          expect.objectContaining({
            description: 'Zapisano 1 fiszkę',
          })
        );
      });
    });

    it('should show success toast with correct Polish pluralization for 2-4 flashcards', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [
        {
          id: 'fc-1',
          front: 'Test front 1',
          back: 'Test back 1',
          source: 'ai_full',
          generation_id: 'gen-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'fc-2',
          front: 'Test front 2',
          back: 'Test back 2',
          source: 'ai_full',
          generation_id: 'gen-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'fc-3',
          front: 'Test front 3',
          back: 'Test back 3',
          source: 'ai_full',
          generation_id: 'gen-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await result.current.saveSelected(
          [createMockProposal(), createMockProposal(), createMockProposal()],
          'gen-1'
        );
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Fiszki zostały zapisane!',
          expect.objectContaining({
            description: 'Zapisano 3 fiszki',
          })
        );
      });
    });

    it('should show success toast with correct Polish pluralization for 5+ flashcards', async () => {
      const mockResponse: CreateFlashcardsResponseDto = Array.from({ length: 5 }, (_, i) => ({
        id: `fc-${i}`,
        front: `Test front ${i}`,
        back: `Test back ${i}`,
        source: 'ai_full' as const,
        generation_id: 'gen-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await result.current.saveSelected(
          Array.from({ length: 5 }, () => createMockProposal()),
          'gen-1'
        );
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Fiszki zostały zapisane!',
          expect.objectContaining({
            description: 'Zapisano 5 fiszek',
          })
        );
      });
    });

    it('should clear error on successful save', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [];

      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSaveFlashcards());

      // Trigger error
      await act(async () => {
        try {
          await result.current.saveSelected([createMockProposal()], 'gen-1');
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
        await result.current.saveSelected([createMockProposal()], 'gen-1');
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

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await expect(result.current.saveSelected([createMockProposal()], 'gen-1')).rejects.toThrow(
          'Nieprawidłowe dane fiszek. Sprawdź zawartość.'
        );
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
        expect(result.current.error).toBe('Nieprawidłowe dane fiszek. Sprawdź zawartość.');
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

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await expect(result.current.saveSelected([createMockProposal()], 'gen-1')).rejects.toThrow(
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

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await expect(result.current.saveSelected([createMockProposal()], 'gen-1')).rejects.toThrow(
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

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await expect(result.current.saveSelected([createMockProposal()], 'gen-1')).rejects.toThrow(
          customError
        );
      });

      await waitFor(() => {
        expect(result.current.error).toBe(customError);
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await expect(result.current.saveSelected([createMockProposal()], 'gen-1')).rejects.toThrow(
          'Network connection failed'
        );
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network connection failed');
        expect(result.current.isSaving).toBe(false);
      });
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => useSaveFlashcards());

      // The hook throws the original error, but sets state to translated message
      await act(async () => {
        await expect(result.current.saveSelected([createMockProposal()], 'gen-1')).rejects.toEqual(
          'Unknown error'
        );
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Nieznany błąd');
      });
    });

    it('should show error toast on failure', async () => {
      const errorMessage = 'Save failed';
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        try {
          await result.current.saveSelected([createMockProposal()], 'gen-1');
        } catch {}
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Błąd zapisywania fiszek',
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

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await expect(result.current.saveSelected([createMockProposal()], 'gen-1')).rejects.toThrow(
          'Błąd serwera. Spróbuj ponownie później.'
        );
      });
    });

    it('should set isSaving to false even when error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        try {
          await result.current.saveSelected([createMockProposal()], 'gen-1');
        } catch {}
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty proposals array', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        await result.current.saveSelected([], 'gen-1');
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.flashcards).toHaveLength(0);
    });

    it('should handle proposals with missing editedFront/editedBack', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      const proposals: FlashcardProposalViewModel[] = [
        createMockProposal({
          id: 'p1',
          front: 'Original',
          back: 'Original',
          status: 'edited',
          editedFront: 'Edited Front', // Need to provide edited values
          editedBack: 'Edited Back',
        }),
      ];

      await act(async () => {
        await result.current.saveSelected(proposals, 'gen-1');
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Should use edited values when status is 'edited'
      expect(callBody.flashcards[0].front).toBe('Edited Front');
      expect(callBody.flashcards[0].back).toBe('Edited Back');
      expect(callBody.flashcards[0].source).toBe('ai_edited');
    });

    it('should handle very large number of proposals', async () => {
      const mockResponse: CreateFlashcardsResponseDto = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSaveFlashcards());

      const proposals = Array.from({ length: 100 }, (_, i) =>
        createMockProposal({ id: `p${i}` })
      );

      await act(async () => {
        await result.current.saveSelected(proposals, 'gen-1');
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.flashcards).toHaveLength(100);
    });
  });

  describe('State management', () => {
    it('should reset error when starting new save', async () => {
      // First request fails
      mockFetch.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useSaveFlashcards());

      await act(async () => {
        try {
          await result.current.saveSelected([createMockProposal()], 'gen-1');
        } catch {}
      });

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Second request starts (should clear error immediately)
      const mockResponse: CreateFlashcardsResponseDto = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      let savePromise!: Promise<any>;
      act(() => {
        savePromise = result.current.saveSelected([createMockProposal()], 'gen-2');
      });

      // Error should be cleared at the start of new save
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      await savePromise;
    });
  });
});

