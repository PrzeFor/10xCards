import { useState } from 'react';
import { toast } from 'sonner';
import type { CreateGenerationRequestDto, CreateGenerationResponseDto } from '../../types';

interface UseGenerateFlashcardsReturn {
  generate: (sourceText: string) => Promise<CreateGenerationResponseDto>;
  isLoading: boolean;
  error: string | null;
}

export function useGenerateFlashcards(): UseGenerateFlashcardsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (sourceText: string): Promise<CreateGenerationResponseDto> => {
    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateGenerationRequestDto = {
        source_text: sourceText,
      };

      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas generowania fiszek';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Fallback to status-based messages
          switch (response.status) {
            case 400:
              errorMessage = 'Nieprawidłowe dane wejściowe. Sprawdź długość tekstu.';
              break;
            case 429:
              errorMessage = 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.';
              break;
            case 500:
              errorMessage = 'Błąd serwera. Spróbuj ponownie później.';
              break;
          }
        }

        throw new Error(errorMessage);
      }

      const data: CreateGenerationResponseDto = await response.json();

      toast.success('Fiszki zostały wygenerowane!', {
        description: `Wygenerowano ${data.generated_count} propozycji fiszek`,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);

      toast.error('Błąd generowania fiszek', {
        description: errorMessage,
        action: {
          label: 'Spróbuj ponownie',
          onClick: () => {
            // This will be handled by the component
          },
        },
      });

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generate,
    isLoading,
    error,
  };
}
