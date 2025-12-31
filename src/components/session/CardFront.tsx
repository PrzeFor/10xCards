import { cn } from '../../lib/utils';

interface CardSideProps {
  text: string;
  className?: string;
}

/**
 * Displays the front side of a flashcard
 * Used within FlashcardDisplay component
 */
export function CardFront({ text, className }: CardSideProps) {
  // Validation
  if (!text || text.trim() === '') {
    return null;
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center p-8',
        'bg-card text-card-foreground',
        'rounded-lg border-2 border-primary/20',
        className
      )}
    >
      <div className="max-h-full overflow-y-auto text-center">
        <p className="text-2xl font-medium leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

