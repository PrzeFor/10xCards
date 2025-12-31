import { useEffect } from 'react';
import type { RatingValue } from '../../types';

interface UseKeyboardShortcutsOptions {
  /** Whether the card is currently flipped */
  isFlipped: boolean;
  /** Callback to flip the card */
  onFlip: () => void;
  /** Callback to rate the card */
  onRate: (rating: RatingValue) => void;
  /** Callback to exit the session */
  onExit: () => void;
  /** Whether keyboard shortcuts are disabled */
  disabled?: boolean;
}

/**
 * Custom hook to handle keyboard shortcuts for session navigation
 * 
 * Shortcuts:
 * - Space/Enter: Flip card (when not flipped)
 * - 1 or E: Rate as Easy (when flipped)
 * - 2 or M: Rate as Medium (when flipped)
 * - 3 or H: Rate as Hard (when flipped)
 * - Escape: Exit session
 */
export function useKeyboardShortcuts({
  isFlipped,
  onFlip,
  onRate,
  onExit,
  disabled = false,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    // Don't attach listeners if disabled
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Flip card (Space or Enter) - only when not flipped
      if ((event.key === ' ' || event.key === 'Enter') && !isFlipped) {
        event.preventDefault();
        onFlip();
        return;
      }

      // Rating shortcuts - only when flipped
      if (isFlipped) {
        const key = event.key.toLowerCase();

        // Hard: 3 or H
        if (key === '3' || key === 'h') {
          event.preventDefault();
          onRate('hard');
          return;
        }

        // Medium: 2 or M
        if (key === '2' || key === 'm') {
          event.preventDefault();
          onRate('medium');
          return;
        }

        // Easy: 1 or E
        if (key === '1' || key === 'e') {
          event.preventDefault();
          onRate('easy');
          return;
        }
      }

      // Exit session (Escape)
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
        return;
      }
    };

    // Attach event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFlipped, disabled, onFlip, onRate, onExit]);
}

