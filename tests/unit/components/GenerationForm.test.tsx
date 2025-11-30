import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../helpers/test-utils';
import userEvent from '@testing-library/user-event';
import { GenerationForm } from '@/components/GenerationForm';

describe('GenerationForm', () => {
  const mockOnGenerate = vi.fn();

  const defaultProps = {
    onGenerate: mockOnGenerate,
    isGenerating: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render textarea and button', () => {
      render(<GenerationForm {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Wklej tutaj tekst/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generuj fiszki/i })).toBeInTheDocument();
    });

    it('should show character counter', () => {
      render(<GenerationForm {...defaultProps} />);

      expect(screen.getByText(/Znaki: 0 \/ 15,000/i)).toBeInTheDocument();
    });

    it('should start with empty textarea', () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      expect(textarea).toHaveValue('');
    });
  });

  describe('Text validation', () => {
    it('should disable button when text is empty', () => {
      render(<GenerationForm {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Generuj fiszki/i });
      expect(button).toBeDisabled();
    });

    it('should disable button when text is below 500 characters', () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(499) } });

      const button = screen.getByRole('button', { name: /Generuj fiszki/i });
      expect(button).toBeDisabled();
    });

    it('should enable button when text is between 500-15000 characters', async () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });

      const button = screen.getByRole('button', { name: /Generuj fiszki/i });
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should disable button when text exceeds 15000 characters', () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(15001) } });

      const button = screen.getByRole('button', { name: /Generuj fiszki/i });
      expect(button).toBeDisabled();
    });

    it('should show validation error when submitting text below 500 characters', async () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      const form = textarea.closest('form')!;

      fireEvent.change(textarea, { target: { value: 'A'.repeat(400) } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Tekst musi mieć co najmniej 500 znaków/i)).toBeInTheDocument();
      });
      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it('should show validation error when submitting text over 15000 characters', async () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      const form = textarea.closest('form')!;

      fireEvent.change(textarea, { target: { value: 'A'.repeat(16000) } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Tekst nie może przekraczać 15,000 znaków/i)).toBeInTheDocument();
      });
      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it('should clear validation error when user types valid text', async () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      const form = textarea.closest('form')!;

      // Trigger validation error
      fireEvent.change(textarea, { target: { value: 'A'.repeat(400) } });
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText(/Tekst musi mieć co najmniej 500 znaków/i)).toBeInTheDocument();
      });

      // Type valid length text
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Tekst musi mieć co najmniej 500 znaków/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Character counter feedback', () => {
    it('should show "Potrzebujesz jeszcze X znaków" when below 500 characters', () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(300) } });

      expect(screen.getByText(/Potrzebujesz jeszcze 200 znaków/i)).toBeInTheDocument();
    });

    it('should show "Gotowe do generacji" when at least 500 characters', () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(500) } });

      expect(screen.getByText(/Gotowe do generacji/i)).toBeInTheDocument();
    });

    it('should update character count as user types', () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      
      fireEvent.change(textarea, { target: { value: 'A'.repeat(750) } });
      expect(screen.getByText(/Znaki: 750 \/ 15,000/i)).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: 'A'.repeat(1000) } });
      expect(screen.getByText(/Znaki: 1,000 \/ 15,000/i)).toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should call onGenerate with valid text', async () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      const validText = 'A'.repeat(500);
      
      fireEvent.change(textarea, { target: { value: validText } });
      
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(validText);
      });
      expect(mockOnGenerate).toHaveBeenCalledTimes(1);
    });

    it('should not call onGenerate when text is invalid', async () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(100) } });
      
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Tekst musi mieć co najmniej 500 znaków/i)).toBeInTheDocument();
      });
      
      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it('should reset form after successful submission', async () => {
      mockOnGenerate.mockResolvedValueOnce(undefined);
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      const validText = 'A'.repeat(500);
      
      fireEvent.change(textarea, { target: { value: validText } });
      
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(validText);
      });

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('Generating state', () => {
    it('should show "Generuję fiszki..." when isGenerating is true', () => {
      render(<GenerationForm {...defaultProps} isGenerating={true} />);

      expect(screen.getByRole('button', { name: /Generuję fiszki\.\.\./i })).toBeInTheDocument();
    });

    it('should disable textarea when isGenerating is true', () => {
      render(<GenerationForm {...defaultProps} isGenerating={true} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      expect(textarea).toBeDisabled();
    });

    it('should disable button when isGenerating is true', () => {
      render(<GenerationForm {...defaultProps} isGenerating={true} />);

      const button = screen.getByRole('button', { name: /Generuję fiszki\.\.\./i });
      expect(button).toBeDisabled();
    });
  });

  describe('Error handling', () => {
    it('should display errorMessage prop', () => {
      const errorMessage = 'Błąd generowania fiszek';
      render(<GenerationForm {...defaultProps} errorMessage={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should prioritize validation error over prop error', async () => {
      render(<GenerationForm {...defaultProps} errorMessage="API Error" />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(100) } });
      
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Tekst musi mieć co najmniej 500 znaków/i)).toBeInTheDocument();
      });
      expect(screen.queryByText('API Error')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should link error message with textarea using aria-describedby', async () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(100) } });
      
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(textarea).toHaveAttribute('aria-describedby', 'sourceTextError');
        expect(screen.getByRole('alert')).toHaveAttribute('id', 'sourceTextError');
      });
    });

    it('should mark textarea as invalid when there is an error', async () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      fireEvent.change(textarea, { target: { value: 'A'.repeat(100) } });
      
      const form = textarea.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(textarea).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should not have aria-describedby when there is no error', () => {
      render(<GenerationForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Wklej tutaj tekst/i);
      expect(textarea).not.toHaveAttribute('aria-describedby');
    });
  });
});

