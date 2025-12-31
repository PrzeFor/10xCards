import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface SessionButtonProps {
  label: string;
  shortcut: string;
  variant: 'easy' | 'medium' | 'hard';
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

/**
 * Specialized button for rating flashcard difficulty
 * Each variant has a distinctive color and shows keyboard shortcut
 */
export function SessionButton({
  label,
  shortcut,
  variant,
  onClick,
  disabled = false,
  isLoading = false,
  className,
}: SessionButtonProps) {
  const variantStyles = {
    easy: 'bg-green-600 hover:bg-green-700 text-white border-green-700 focus-visible:ring-green-500',
    medium: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-700 focus-visible:ring-yellow-500',
    hard: 'bg-red-600 hover:bg-red-700 text-white border-red-700 focus-visible:ring-red-500',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'relative h-14 text-base font-semibold transition-all',
        variantStyles[variant],
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={`${label} (Press ${shortcut})`}
    >
      <span className="flex flex-col items-center gap-1">
        <span>{label}</span>
        <span className="text-xs opacity-80">({shortcut})</span>
      </span>

      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </span>
      )}
    </Button>
  );
}

