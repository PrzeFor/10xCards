import { SessionButton } from './SessionButton';
import type { RatingValue } from '../../types';

interface RatingButtonsProps {
  onRatingSelect: (rating: RatingValue) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * Group of three rating buttons (Easy, Medium, Hard)
 * Displayed after flashcard is revealed
 */
export function RatingButtons({ onRatingSelect, disabled = false, isLoading = false }: RatingButtonsProps) {
  return (
    <div className="w-full max-w-2xl">
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Oceń, jak dobrze znasz tę fiszkę
      </p>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SessionButton
          label="Trudna"
          shortcut="3 lub H"
          variant="hard"
          onClick={() => onRatingSelect('hard')}
          disabled={disabled}
          isLoading={isLoading}
        />
        
        <SessionButton
          label="Średnia"
          shortcut="2 lub M"
          variant="medium"
          onClick={() => onRatingSelect('medium')}
          disabled={disabled}
          isLoading={isLoading}
        />
        
        <SessionButton
          label="Łatwa"
          shortcut="1 lub E"
          variant="easy"
          onClick={() => onRatingSelect('easy')}
          disabled={disabled}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

