import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../helpers/test-utils';
import { FlashcardEditModal } from '@/components/FlashcardEditModal';
import { createTestFlashcardProposal } from '../../helpers/factories';

describe('FlashcardEditModal', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProposal = createTestFlashcardProposal({
    id: 'test-1',
    front: 'Test front',
    back: 'Test back',
  });

  const defaultProps = {
    proposal: defaultProposal,
    onSave: mockOnSave,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal with proposal content', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      expect(screen.getByText('Edytuj fiszkę')).toBeInTheDocument();
      expect(screen.getByLabelText(/Przód fiszki/i)).toHaveValue('Test front');
      expect(screen.getByLabelText(/Tył fiszki/i)).toHaveValue('Test back');
    });

    it('should render edited values if available', () => {
      const editedProposal = createTestFlashcardProposal({
        front: 'Original front',
        back: 'Original back',
        editedFront: 'Edited front',
        editedBack: 'Edited back',
      });

      render(<FlashcardEditModal {...defaultProps} proposal={editedProposal} />);

      expect(screen.getByLabelText(/Przód fiszki/i)).toHaveValue('Edited front');
      expect(screen.getByLabelText(/Tył fiszki/i)).toHaveValue('Edited back');
    });

    it('should show character counters', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      expect(screen.getByText(/Znaki: 10 \/ 300/i)).toBeInTheDocument();
      expect(screen.getByText(/Znaki: 9 \/ 500/i)).toBeInTheDocument();
    });

    it('should render buttons', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Zapisz zmiany/i })).toBeInTheDocument();
    });
  });

  describe('Front field validation', () => {
    it('should show error when front is empty', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: '' } });

      const form = frontInput.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText(/Przód fiszki nie może być pusty/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when front has only whitespace', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: '   ' } });

      const form = frontInput.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText(/Przód fiszki nie może być pusty/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when front exceeds 300 characters', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      const longText = 'A'.repeat(301);
      fireEvent.change(frontInput, { target: { value: longText } });

      const form = frontInput.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText(/Przód fiszki nie może przekraczać 300 znaków/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear error while typing after validation error', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);

      // Trigger error
      fireEvent.change(frontInput, { target: { value: '' } });
      const form = frontInput.closest('form')!;
      fireEvent.submit(form);
      expect(screen.getByText(/Przód fiszki nie może być pusty/i)).toBeInTheDocument();

      // Start typing
      fireEvent.change(frontInput, { target: { value: 'New text' } });
      expect(screen.queryByText(/Przód fiszki nie może być pusty/i)).not.toBeInTheDocument();
    });

    it('should show warning when approaching character limit', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: 'A'.repeat(280) } });

      expect(screen.getByText(/Zbliżasz się do limitu/i)).toBeInTheDocument();
    });

    it('should show danger message when exceeding character limit', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: 'A'.repeat(310) } });

      expect(screen.getByText(/Przekroczono limit!/i)).toBeInTheDocument();
    });
  });

  describe('Back field validation', () => {
    it('should show error when back is empty', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const backInput = screen.getByLabelText(/Tył fiszki/i);
      fireEvent.change(backInput, { target: { value: '' } });

      const form = backInput.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText(/Tył fiszki nie może być pusty/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when back has only whitespace', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const backInput = screen.getByLabelText(/Tył fiszki/i);
      fireEvent.change(backInput, { target: { value: '   ' } });

      const form = backInput.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText(/Tył fiszki nie może być pusty/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when back exceeds 500 characters', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const backInput = screen.getByLabelText(/Tył fiszki/i);
      const longText = 'A'.repeat(501);
      fireEvent.change(backInput, { target: { value: longText } });

      const form = backInput.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText(/Tył fiszki nie może przekraczać 500 znaków/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear error while typing after validation error', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const backInput = screen.getByLabelText(/Tył fiszki/i);

      // Trigger error
      fireEvent.change(backInput, { target: { value: '' } });
      const form = backInput.closest('form')!;
      fireEvent.submit(form);
      expect(screen.getByText(/Tył fiszki nie może być pusty/i)).toBeInTheDocument();

      // Start typing
      fireEvent.change(backInput, { target: { value: 'New content' } });
      expect(screen.queryByText(/Tył fiszki nie może być pusty/i)).not.toBeInTheDocument();
    });

    it('should show warning when approaching character limit', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const backInput = screen.getByLabelText(/Tył fiszki/i);
      fireEvent.change(backInput, { target: { value: 'A'.repeat(450) } });

      expect(screen.getByText(/Zbliżasz się do limitu/i)).toBeInTheDocument();
    });
  });

  describe('Save functionality', () => {
    it('should call onSave with trimmed values when valid', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      const backInput = screen.getByLabelText(/Tył fiszki/i);

      fireEvent.change(frontInput, { target: { value: '  New front  ' } });
      fireEvent.change(backInput, { target: { value: '  New back  ' } });

      const form = frontInput.closest('form')!;
      fireEvent.submit(form);

      expect(mockOnSave).toHaveBeenCalledWith('test-1', 'New front', 'New back');
    });

    it('should disable save button when no changes made', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when changes are made', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: 'Modified front' } });

      const saveButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should disable save button when values are invalid', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: '' } });

      const saveButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      expect(saveButton).toBeDisabled();
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Anuluj/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should call onClose when Escape is pressed', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      // Dialog component calls onClose internally on Escape, might be called once or twice
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should submit form when Ctrl+Enter is pressed', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: 'Modified front' } });

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter', ctrlKey: true });

      expect(mockOnSave).toHaveBeenCalledWith('test-1', 'Modified front', 'Test back');
    });

    it('should submit form when Meta+Enter is pressed', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: 'Modified front' } });

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter', metaKey: true });

      expect(mockOnSave).toHaveBeenCalledWith('test-1', 'Modified front', 'Test back');
    });

    it('should not submit when Enter is pressed without modifier keys', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: 'Modified front' } });

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter' });

      // Should not save
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Form reset on proposal change', () => {
    it('should reset form when proposal changes', async () => {
      const { rerender } = render(<FlashcardEditModal {...defaultProps} />);

      // Modify fields
      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: 'Modified' } });
      expect(frontInput).toHaveValue('Modified');

      // Change proposal
      const newProposal = createTestFlashcardProposal({
        id: 'test-2',
        front: 'New front',
        back: 'New back',
      });

      rerender(<FlashcardEditModal {...defaultProps} proposal={newProposal} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Przód fiszki/i)).toHaveValue('New front');
        expect(screen.getByLabelText(/Tył fiszki/i)).toHaveValue('New back');
      });
    });

    it('should clear validation errors when proposal changes', async () => {
      const { rerender } = render(<FlashcardEditModal {...defaultProps} />);

      // Trigger validation error
      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: '' } });
      const form = frontInput.closest('form')!;
      fireEvent.submit(form);
      expect(screen.getByText(/Przód fiszki nie może być pusty/i)).toBeInTheDocument();

      // Change proposal
      const newProposal = createTestFlashcardProposal({
        id: 'test-2',
        front: 'New front',
        back: 'New back',
      });

      rerender(<FlashcardEditModal {...defaultProps} proposal={newProposal} />);

      await waitFor(() => {
        expect(screen.queryByText(/Przód fiszki nie może być pusty/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'edit-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'edit-modal-description');
    });

    it('should link validation errors with inputs', () => {
      render(<FlashcardEditModal {...defaultProps} />);

      const frontInput = screen.getByLabelText(/Przód fiszki/i);
      fireEvent.change(frontInput, { target: { value: '' } });

      const form = frontInput.closest('form')!;
      fireEvent.submit(form);

      expect(frontInput).toHaveAttribute('aria-describedby', 'front-error');
      expect(frontInput).toHaveAttribute('aria-invalid', 'true');

      const errorAlert = screen.getByText(/Przód fiszki nie może być pusty/i).closest('[role="alert"]');
      expect(errorAlert).toHaveAttribute('id', 'front-error');
    });
  });
});
