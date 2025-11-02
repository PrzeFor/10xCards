import { useState } from 'react';
import { toast } from 'sonner';
import type { 
  CreateFlashcardsRequestDto, 
  CreateFlashcardsResponseDto,
  CreateFlashcardRequestDto 
} from '../../types';
import type { FlashcardProposalViewModel } from '../../types/viewModels';

interface UseSaveFlashcardsReturn {
  saveSelected: (proposals: FlashcardProposalViewModel[], generationId: string) => Promise<CreateFlashcardsResponseDto>;
  isSaving: boolean;
  error: string | null;
}

export function useSaveFlashcards(): UseSaveFlashcardsReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveSelected = async (
    proposals: FlashcardProposalViewModel[], 
    generationId: string
  ): Promise<CreateFlashcardsResponseDto> => {
    setIsSaving(true);
    setError(null);

    try {
      const flashcards: CreateFlashcardRequestDto[] = proposals.map(proposal => ({
        front: proposal.status === 'edited' ? proposal.editedFront! : proposal.front,
        back: proposal.status === 'edited' ? proposal.editedBack! : proposal.back,
        source: proposal.status === 'edited' ? 'ai_edited' : 'ai_full',
        generation_id: generationId,
      }));

      const payload: CreateFlashcardsRequestDto = {
        flashcards,
      };

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas zapisywania fiszek';
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Fallback to status-based messages
          switch (response.status) {
            case 400:
              errorMessage = 'Nieprawidłowe dane fiszek. Sprawdź zawartość.';
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

      const data: CreateFlashcardsResponseDto = await response.json();
      
      toast.success('Fiszki zostały zapisane!', {
        description: `Zapisano ${data.length} ${data.length === 1 ? 'fiszkę' : data.length < 5 ? 'fiszki' : 'fiszek'}`,
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      
      toast.error('Błąd zapisywania fiszek', {
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
      setIsSaving(false);
    }
  };

  return {
    saveSelected,
    isSaving,
    error,
  };
}
