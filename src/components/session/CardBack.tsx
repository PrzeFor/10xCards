import { cn } from '../../lib/utils';

interface CardSideProps {
  text: string;
  className?: string;
}

/**
 * Displays the back side of a flashcard
 * Used within FlashcardDisplay component
 */
export function CardBack({ text, className }: CardSideProps) {
  // Validation
  if (!text || text.trim() === '') {
    return null;
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center p-8',
        'bg-primary/5 text-foreground',
        'rounded-lg border-2 border-primary',
        className
      )}
    >
      <div className="max-h-full overflow-y-auto text-center">
        <p className="text-xl leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

