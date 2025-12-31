import { CardFront } from './CardFront';
import { CardBack } from './CardBack';
import { cn } from '../../lib/utils';
import type { FlashcardDto } from '../../types';

interface FlashcardDisplayProps {
  flashcard: FlashcardDto;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}

/**
 * Displays a flashcard with flip animation
 * Shows front only when not flipped, front + back when flipped
 * Clicking the card also triggers flip (when not flipped)
 */
export function FlashcardDisplay({
  flashcard,
  isFlipped,
  onFlip,
  className,
}: FlashcardDisplayProps) {
  const handleClick = () => {
    // Only allow flip when card is not already flipped
    if (!isFlipped) {
      onFlip();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow Space or Enter to flip the card when focused
    if (!isFlipped && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      onFlip();
    }
  };

  return (
    <div
      className={cn('w-full max-w-2xl', className)}
      style={{ perspective: '1000px' }}
    >
      <div
        className={cn(
          'relative h-96 w-full cursor-pointer transition-transform duration-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isFlipped && 'pointer-events-none'
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={isFlipped ? -1 : 0}
        role="button"
        aria-label={isFlipped ? 'Flashcard revealed' : 'Click to reveal answer'}
      >
        {/* Front side */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <CardFront text={flashcard.front} />
        </div>

        {/* Back side - only rendered when flipped */}
        {isFlipped && (
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardBack text={flashcard.back} />
          </div>
        )}
      </div>

      {/* Accessibility hint */}
      {!isFlipped && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Kliknij kartę lub naciśnij spację, aby odkryć odpowiedź
        </p>
      )}
    </div>
  );
}

