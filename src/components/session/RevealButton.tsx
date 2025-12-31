import { Eye } from 'lucide-react';
import { Button } from '../ui/button';

interface RevealButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Button to reveal the back of a flashcard
 * Shown only when card is not flipped
 */
export function RevealButton({ onClick, disabled = false }: RevealButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      className="h-14 px-8 text-base font-semibold"
      aria-label="Reveal answer (Space or Enter)"
    >
      <Eye className="mr-2 h-5 w-5" />
      Pokaż odpowiedź
      <span className="ml-2 text-xs opacity-80">(Spacja)</span>
    </Button>
  );
}

