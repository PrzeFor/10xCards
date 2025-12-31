import { useSession } from '../lib/hooks/useSession';
import { useKeyboardShortcuts } from '../lib/hooks/useKeyboardShortcuts';
import { FullscreenWrapper } from './session/FullscreenWrapper';
import { FlashcardDisplay } from './session/FlashcardDisplay';
import { RevealButton } from './session/RevealButton';
import { RatingButtons } from './session/RatingButtons';
import { SessionSummary } from './session/SessionSummary';
import { Button } from './ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { SessionContainerProps } from '../types/viewModels';

/**
 * Main container component for SRS review session
 * Orchestrates all session logic, state management, and UI components
 */
export function SessionContainer({ sessionId, initialFlashcards }: SessionContainerProps) {
  // Session state management
  const {
    session,
    currentFlashcard,
    isFlipped,
    isLoading,
    isSavingRating,
    error,
    showSummary,
    stats,
    flipCard,
    rateCard,
    exitSession,
    retryAfterError,
    startNewSession,
  } = useSession({ sessionId, initialFlashcards });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isFlipped,
    onFlip: flipCard,
    onRate: rateCard,
    onExit: exitSession,
    disabled: isLoading || isSavingRating || showSummary,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Ładowanie sesji...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Wystąpił błąd</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={retryAfterError}>Spróbuj ponownie</Button>
            <Button onClick={exitSession} variant="outline">
              Wróć do fiszek
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No session data
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Brak danych sesji</h1>
          <p className="mt-2 text-muted-foreground">
            Nie udało się załadować sesji. Spróbuj rozpocząć nową sesję.
          </p>
          <Button onClick={exitSession} className="mt-6">
            Wróć do fiszek
          </Button>
        </div>
      </div>
    );
  }

  // Show summary after session completion
  if (showSummary && stats) {
    return (
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4">
        <SessionSummary stats={stats} onFinish={exitSession} onStartNew={startNewSession} />
      </div>
    );
  }

  // No current flashcard (shouldn't happen but handle gracefully)
  if (!currentFlashcard) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Brak fiszki</h1>
          <p className="mt-2 text-muted-foreground">
            Nie można znaleźć bieżącej fiszki. Sesja może być zakończona.
          </p>
          <Button onClick={exitSession} className="mt-6">
            Wróć do fiszek
          </Button>
        </div>
      </div>
    );
  }

  // Active session view
  return (
    <FullscreenWrapper
      onExit={exitSession}
      currentIndex={session.currentIndex + 1} // Display as 1-based
      totalCards={session.flashcards.length}
      requireExitConfirmation={session.completedResults.length > 0}
    >
      <div className="flex w-full max-w-4xl flex-col items-center gap-6">
        {/* Flashcard Display */}
        <FlashcardDisplay
          flashcard={currentFlashcard}
          isFlipped={isFlipped}
          onFlip={flipCard}
        />

        {/* Action Buttons */}
        <div className="w-full max-w-2xl">
          {!isFlipped ? (
            // Show reveal button when card is not flipped
            <div className="flex justify-center">
              <RevealButton onClick={flipCard} disabled={isSavingRating} />
            </div>
          ) : (
            // Show rating buttons when card is flipped
            <RatingButtons
              onRatingSelect={rateCard}
              disabled={isSavingRating}
              isLoading={isSavingRating}
            />
          )}
        </div>

        {/* Error Toast (inline) */}
        {error && session && (
          <div className="w-full max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Nie udało się zapisać oceny</p>
                <p className="mt-1 text-sm text-destructive/80">{error}</p>
              </div>
              <Button
                onClick={retryAfterError}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                Zamknij
              </Button>
            </div>
          </div>
        )}

        {/* Saving indicator */}
        {isSavingRating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Zapisywanie...</span>
          </div>
        )}
      </div>
    </FullscreenWrapper>
  );
}

