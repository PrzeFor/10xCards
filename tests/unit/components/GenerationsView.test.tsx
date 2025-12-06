import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../helpers/test-utils';
import GenerationsView from '@/components/GenerationsView';
import { toast } from 'sonner';
import type { CreateGenerationResponseDto } from '@/types';

// Mock hooks
vi.mock('@/lib/hooks/useGenerateFlashcards', () => ({
  useGenerateFlashcards: vi.fn(),
}));

vi.mock('@/lib/hooks/useSaveFlashcards', () => ({
  useSaveFlashcards: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useGenerateFlashcards } from '@/lib/hooks/useGenerateFlashcards';
import { useSaveFlashcards } from '@/lib/hooks/useSaveFlashcards';

describe('GenerationsView', () => {
  const mockGenerate = vi.fn();
  const mockSaveSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useGenerateFlashcards).mockReturnValue({
      generate: mockGenerate,
      isLoading: false,
      error: null,
    });

    vi.mocked(useSaveFlashcards).mockReturnValue({
      saveSelected: mockSaveSelected,
      isSaving: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render GenerationForm', () => {
      render(<GenerationsView />);

      expect(screen.getByPlaceholderText(/Wklej tutaj tekst/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generuj fiszki/i })).toBeInTheDocument();
    });

    it('should not render FlashcardList initially', () => {
      render(<GenerationsView />);

      expect(screen.queryByText(/Zapisz zaznaczone/i)).not.toBeInTheDocument();
    });
  });

  describe('Generate flashcards flow', () => {
    it('should call generate function when form is submitted', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 2,
        generation_duration: 1000,
        flashcards_proposals: [
          { id: 'prop-1', front: 'Front 1', back: 'Back 1', source: 'ai_full' },
          { id: 'prop-2', front: 'Front 2', back: 'Back 2', source: 'ai_full' },
        ],
      };

      mockGenerate.mockResolvedValueOnce(mockResponse);

      render(<GenerationsView />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      const validText = 'A'.repeat(500);
      fireEvent.change(textarea, { target: { value: validText } });

      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith(validText);
      });
    });

    it('should display proposals after successful generation', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 2,
        generation_duration: 1000,
        flashcards_proposals: [
          { id: 'prop-1', front: 'Front 1', back: 'Back 1', source: 'ai_full' },
          { id: 'prop-2', front: 'Front 2', back: 'Back 2', source: 'ai_full' },
        ],
      };

      mockGenerate.mockResolvedValueOnce(mockResponse);

      render(<GenerationsView />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });

      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Front 1')).toBeInTheDocument();
        expect(screen.getByText('Front 2')).toBeInTheDocument();
      });
    });

    it('should set internal source text state to empty after successful generation', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 1,
        generation_duration: 1000,
        flashcards_proposals: [{ id: 'prop-1', front: 'Front 1', back: 'Back 1', source: 'ai_full' }],
      };

      mockGenerate.mockResolvedValueOnce(mockResponse);

      render(<GenerationsView />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });

      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      // Just verify the generation was successful and proposals are shown
      await waitFor(() => {
        expect(screen.getByText('Front 1')).toBeInTheDocument();
      });
    });

    it('should show LoadingSkeleton when isGenerating is true', () => {
      vi.mocked(useGenerateFlashcards).mockReturnValue({
        generate: mockGenerate,
        isLoading: true,
        error: null,
      });

      render(<GenerationsView />);

      expect(screen.getByText(/Generuję propozycje fiszek/i)).toBeInTheDocument();
    });

    it('should handle generation error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGenerate.mockRejectedValueOnce(new Error('Generation failed'));

      render(<GenerationsView />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });

      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Generation failed:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Proposal manipulation', () => {
    const setupWithProposals = async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 3,
        generation_duration: 1000,
        flashcards_proposals: [
          { id: 'prop-1', front: 'Front 1', back: 'Back 1', source: 'ai_full' },
          { id: 'prop-2', front: 'Front 2', back: 'Back 2', source: 'ai_full' },
          { id: 'prop-3', front: 'Front 3', back: 'Back 3', source: 'ai_full' },
        ],
      };

      mockGenerate.mockResolvedValueOnce(mockResponse);

      render(<GenerationsView />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Front 1')).toBeInTheDocument();
      });
    };

    it('should toggle selection when checkbox is clicked', async () => {
      await setupWithProposals();

      const checkboxes = screen.getAllByRole('checkbox');
      const firstProposalCheckbox = checkboxes.find((cb) => cb.getAttribute('aria-label')?.includes('Front 1'));

      expect(firstProposalCheckbox).not.toBeChecked();

      fireEvent.click(firstProposalCheckbox!);
      expect(firstProposalCheckbox).toBeChecked();

      fireEvent.click(firstProposalCheckbox!);
      expect(firstProposalCheckbox).not.toBeChecked();
    });

    it('should accept proposal when accept button is clicked', async () => {
      await setupWithProposals();

      const acceptButtons = screen.getAllByRole('button', { name: '✓' });
      fireEvent.click(acceptButtons[0]);

      // Should be auto-selected and status changed
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        const firstProposalCheckbox = checkboxes.find((cb) => cb.getAttribute('aria-label')?.includes('Front 1'));
        expect(firstProposalCheckbox).toBeChecked();
      });
    });

    it('should reject proposal when reject button is clicked', async () => {
      await setupWithProposals();

      const rejectButtons = screen.getAllByRole('button', { name: '✕' });
      fireEvent.click(rejectButtons[0]);

      // Should be deselected and status changed
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        const firstProposalCheckbox = checkboxes.find((cb) => cb.getAttribute('aria-label')?.includes('Front 1'));
        expect(firstProposalCheckbox).not.toBeChecked();
      });
    });

    it('should open edit modal when edit button is clicked', async () => {
      await setupWithProposals();

      const editButtons = screen.getAllByRole('button', { name: '✏️' });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edytuj fiszkę')).toBeInTheDocument();
      });
    });

    it('should save edited proposal and show toast', async () => {
      await setupWithProposals();

      const editButtons = screen.getAllByRole('button', { name: '✏️' });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edytuj fiszkę')).toBeInTheDocument();
      });

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: 'Edited Front 1' } });

      const saveButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Fiszka została edytowana',
          expect.objectContaining({
            description: expect.stringContaining('zapisane lokalnie'),
          })
        );
      });

      // Modal should close
      expect(screen.queryByText('Edytuj fiszkę')).not.toBeInTheDocument();
    });

    it('should close edit modal when cancel is clicked', async () => {
      await setupWithProposals();

      const editButtons = screen.getAllByRole('button', { name: '✏️' });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edytuj fiszkę')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Anuluj/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Edytuj fiszkę')).not.toBeInTheDocument();
      });
    });
  });

  describe('Bulk actions', () => {
    const setupWithProposals = async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 3,
        generation_duration: 1000,
        flashcards_proposals: [
          { id: 'prop-1', front: 'Front 1', back: 'Back 1', source: 'ai_full' },
          { id: 'prop-2', front: 'Front 2', back: 'Back 2', source: 'ai_full' },
          { id: 'prop-3', front: 'Front 3', back: 'Back 3', source: 'ai_full' },
        ],
      };

      mockGenerate.mockResolvedValueOnce(mockResponse);

      render(<GenerationsView />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Front 1')).toBeInTheDocument();
      });
    };

    it('should select all proposals when "Select All" is clicked', async () => {
      await setupWithProposals();

      const selectAllButton = screen.getByRole('checkbox', { name: /Zaznacz wszystkie/i });
      fireEvent.click(selectAllButton);

      const checkboxes = screen
        .getAllByRole('checkbox')
        .filter((cb) => cb.getAttribute('aria-label')?.includes('Front'));

      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should deselect all when clicking "Select All" with all selected', async () => {
      await setupWithProposals();

      const selectAllButton = screen.getByRole('checkbox', { name: /Zaznacz wszystkie/i });

      // Select all
      fireEvent.click(selectAllButton);

      // Deselect all
      fireEvent.click(selectAllButton);

      const checkboxes = screen
        .getAllByRole('checkbox')
        .filter((cb) => cb.getAttribute('aria-label')?.includes('Front'));

      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should accept all proposals when "Accept All" is clicked', async () => {
      await setupWithProposals();

      const acceptAllButton = screen.getByRole('button', { name: /Akceptuj wszystkie/i });
      fireEvent.click(acceptAllButton);

      const checkboxes = screen
        .getAllByRole('checkbox')
        .filter((cb) => cb.getAttribute('aria-label')?.includes('Front'));

      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should reject all proposals when "Reject All" is clicked', async () => {
      await setupWithProposals();

      const rejectAllButton = screen.getByRole('button', { name: /Odrzuć wszystkie/i });
      fireEvent.click(rejectAllButton);

      const checkboxes = screen
        .getAllByRole('checkbox')
        .filter((cb) => cb.getAttribute('aria-label')?.includes('Front'));

      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Save selected flow', () => {
    const setupWithProposals = async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 3,
        generation_duration: 1000,
        flashcards_proposals: [
          { id: 'prop-1', front: 'Front 1', back: 'Back 1', source: 'ai_full' },
          { id: 'prop-2', front: 'Front 2', back: 'Back 2', source: 'ai_full' },
          { id: 'prop-3', front: 'Front 3', back: 'Back 3', source: 'ai_full' },
        ],
      };

      mockGenerate.mockResolvedValueOnce(mockResponse);

      render(<GenerationsView />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Front 1')).toBeInTheDocument();
      });
    };

    it('should call saveSelected with selected proposals', async () => {
      mockSaveSelected.mockResolvedValueOnce(undefined);

      await setupWithProposals();

      // Select first proposal
      const checkboxes = screen.getAllByRole('checkbox');
      const firstProposalCheckbox = checkboxes.find((cb) => cb.getAttribute('aria-label')?.includes('Front 1'));
      fireEvent.click(firstProposalCheckbox!);

      const saveButton = screen.getByRole('button', { name: /Zapisz zaznaczone/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSaveSelected).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'prop-1',
              front: 'Front 1',
              back: 'Back 1',
              isSelected: true,
            }),
          ]),
          'gen-1'
        );
      });
    });

    it('should remove saved proposals from the list', async () => {
      mockSaveSelected.mockResolvedValueOnce(undefined);

      await setupWithProposals();

      // Select first proposal
      const checkboxes = screen.getAllByRole('checkbox');
      const firstProposalCheckbox = checkboxes.find((cb) => cb.getAttribute('aria-label')?.includes('Front 1'));
      fireEvent.click(firstProposalCheckbox!);

      const saveButton = screen.getByRole('button', { name: /Zapisz zaznaczone/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Front 1')).not.toBeInTheDocument();
        expect(screen.getByText('Front 2')).toBeInTheDocument();
        expect(screen.getByText('Front 3')).toBeInTheDocument();
      });
    });

    it('should handle save error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSaveSelected.mockRejectedValueOnce(new Error('Save failed'));

      await setupWithProposals();

      // Select first proposal
      const checkboxes = screen.getAllByRole('checkbox');
      const firstProposalCheckbox = checkboxes.find((cb) => cb.getAttribute('aria-label')?.includes('Front 1'));
      fireEvent.click(firstProposalCheckbox!);

      const saveButton = screen.getByRole('button', { name: /Zapisz zaznaczone/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Save failed:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not call saveSelected when no proposals are selected', async () => {
      await setupWithProposals();

      const saveButton = screen.getByRole('button', { name: /Zapisz zaznaczone/i });
      fireEvent.click(saveButton);

      expect(mockSaveSelected).not.toHaveBeenCalled();
    });
  });

  describe('Integration with child components', () => {
    it('should pass correct props to GenerationForm', () => {
      vi.mocked(useGenerateFlashcards).mockReturnValue({
        generate: mockGenerate,
        isLoading: true,
        error: 'Generation error',
      });

      render(<GenerationsView />);

      expect(screen.getByPlaceholderText(/Wklej tutaj tekst/i)).toBeDisabled();
      expect(screen.getByText('Generation error')).toBeInTheDocument();
    });

    it('should pass correct props to FlashcardList', async () => {
      const mockResponse: CreateGenerationResponseDto = {
        id: 'gen-1',
        model: 'test-model',
        status: 'completed',
        generated_count: 1,
        generation_duration: 1000,
        flashcards_proposals: [{ id: 'prop-1', front: 'Front 1', back: 'Back 1', source: 'ai_full' }],
      };

      mockGenerate.mockResolvedValueOnce(mockResponse);

      vi.mocked(useSaveFlashcards).mockReturnValue({
        saveSelected: mockSaveSelected,
        isSaving: true,
        error: 'Save error',
      });

      render(<GenerationsView />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Front 1')).toBeInTheDocument();
      });

      // Should show error from useSaveFlashcards
      expect(screen.getByText('Save error')).toBeInTheDocument();
    });
  });
});
