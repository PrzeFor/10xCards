import type { FlashcardProposalDto } from '../types';

/**
 * Extended flashcard proposal with UI state for the generations view
 */
export interface FlashcardProposalViewModel extends FlashcardProposalDto {
  isSelected: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  editedFront?: string;
  editedBack?: string;
}
