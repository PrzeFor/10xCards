import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  FlashcardWithSRSDto,
  SessionCardResultDto,
  RatingValue,
  SessionStatsDto,
} from '../../types';
import type { SessionState, SessionViewModel } from '../../types/viewModels';
import { getInitialSessionState, calculateSessionStats } from '../../types/viewModels';

interface UseSessionOptions {
  sessionId: string;
  initialFlashcards?: FlashcardWithSRSDto[];
}

interface UseSessionReturn {
  session: SessionViewModel | null;
  currentFlashcard: FlashcardWithSRSDto | null;
  isFlipped: boolean;
  isLoading: boolean;
  isSavingRating: boolean;
  error: string | null;
  showSummary: boolean;
  stats: SessionStatsDto | null;
  flipCard: () => void;
  rateCard: (rating: RatingValue) => Promise<void>;
  exitSession: () => void;
  retryAfterError: () => void;
  completeSession: () => Promise<void>;
  startNewSession: () => void;
}

/**
 * Main hook for managing SRS session state and logic
 * Handles card flipping, rating, API calls, and session completion
 */
export function useSession({ sessionId, initialFlashcards }: UseSessionOptions): UseSessionReturn {
  const [state, setState] = useState<SessionState>(getInitialSessionState());
  const sessionCompletedRef = useRef(false);

  /**
   * Initialize session with flashcards
   */
  const initializeSession = useCallback((flashcards: FlashcardWithSRSDto[]) => {
    // Validate flashcards
    if (!flashcards || flashcards.length === 0) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'No flashcards in session',
      }));
      return;
    }

    // Create session view model
    const sessionViewModel: SessionViewModel = {
      sessionId,
      flashcards,
      currentIndex: 0,
      isFlipped: false,
      completedResults: [],
      status: 'active',
      startedAt: new Date().toISOString(),
      currentCardStartedAt: new Date().toISOString(),
    };

    setState({
      session: sessionViewModel,
      isLoading: false,
      isSavingRating: false,
      error: null,
      showSummary: false,
    });
  }, [sessionId]);

  /**
   * Fetch session data from API
   */
  const fetchSession = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/sessions/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch session: ${response.status}`);
      }

      const sessionData = await response.json();

      // For now, we expect flashcards to be included in session creation
      // In a real implementation, you might need a separate endpoint to get session flashcards
      throw new Error('Session fetching not fully implemented - use initial flashcards');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    if (initialFlashcards && initialFlashcards.length > 0) {
      // Use SSR data
      initializeSession(initialFlashcards);
    } else {
      // Fetch from API
      fetchSession(sessionId);
    }
  }, [sessionId, initialFlashcards, initializeSession, fetchSession]);

  /**
   * Flip the current card to reveal the back
   */
  const flipCard = useCallback(() => {
    setState((prev) => {
      // Guard clauses
      if (!prev.session) return prev;
      if (prev.session.isFlipped) {
        console.warn('Card already flipped');
        return prev;
      }
      if (prev.isSavingRating) {
        console.warn('Cannot flip while saving rating');
        return prev;
      }

      // Update session
      return {
        ...prev,
        session: {
          ...prev.session,
          isFlipped: true,
          currentCardStartedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  /**
   * Get current flashcard
   */
  const currentFlashcard = state.session
    ? state.session.flashcards[state.session.currentIndex]
    : null;

  /**
   * Calculate review duration in seconds
   */
  const calculateReviewDuration = useCallback((): number => {
    if (!state.session?.currentCardStartedAt) return 0;

    const startTime = new Date(state.session.currentCardStartedAt).getTime();
    const endTime = new Date().getTime();
    const durationMs = endTime - startTime;
    return Math.floor(durationMs / 1000);
  }, [state.session]);

  /**
   * Rate the current card and move to next
   */
  const rateCard = useCallback(
    async (rating: RatingValue) => {
      // Guard clauses
      if (!state.session) {
        console.error('No active session');
        return;
      }

      if (!state.session.isFlipped) {
        console.warn('Cannot rate card before flipping');
        return;
      }

      if (state.isSavingRating) {
        console.warn('Rating already in progress');
        return;
      }

      if (!currentFlashcard) {
        console.error('No current flashcard');
        return;
      }

      // Validate rating
      if (!['easy', 'medium', 'hard'].includes(rating)) {
        console.error(`Invalid rating: ${rating}`);
        return;
      }

      // Start saving
      setState((prev) => ({ ...prev, isSavingRating: true, error: null }));

      const reviewDuration = calculateReviewDuration();
      const cardResult: SessionCardResultDto = {
        flashcard_id: currentFlashcard.id,
        rating,
        timestamp: new Date().toISOString(),
        review_duration: reviewDuration,
      };

      try {
        // Call API to update SRS state
        const response = await fetch(`/api/flashcards/${currentFlashcard.id}/srs`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating,
            review_duration: reviewDuration,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update flashcard');
        }

        // Success - move to next card
        setState((prev) => {
          if (!prev.session) return prev;

          const newCompletedResults = [...prev.session.completedResults, cardResult];
          const nextIndex = prev.session.currentIndex + 1;

          // Check if session is complete
          if (nextIndex >= prev.session.flashcards.length) {
            // Session complete - show summary
            const stats = calculateSessionStats(
              newCompletedResults,
              prev.session.startedAt,
              new Date().toISOString()
            );

            return {
              ...prev,
              session: {
                ...prev.session,
                completedResults: newCompletedResults,
                status: 'completed',
              },
              isSavingRating: false,
              showSummary: true,
            };
          }

          // Move to next card
          return {
            ...prev,
            session: {
              ...prev.session,
              currentIndex: nextIndex,
              isFlipped: false,
              completedResults: newCompletedResults,
              currentCardStartedAt: new Date().toISOString(),
            },
            isSavingRating: false,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error rating card:', error);

        setState((prev) => ({
          ...prev,
          isSavingRating: false,
          error: errorMessage,
        }));

        // TODO: Implement offline fallback (save to localStorage)
      }
    },
    [state.session, state.isSavingRating, currentFlashcard, calculateReviewDuration]
  );

  /**
   * Exit the session
   */
  const exitSession = useCallback(() => {
    // Navigate to flashcards page
    window.location.href = '/flashcards';
  }, []);

  /**
   * Retry after error
   */
  const retryAfterError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Complete the session and save statistics to server
   */
  const completeSession = useCallback(async () => {
    if (!state.session) {
      console.error('No active session to complete');
      return;
    }

    const stats = calculateSessionStats(
      state.session.completedResults,
      state.session.startedAt,
      new Date().toISOString()
    );

    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: state.session.completedResults,
          stats,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to complete session:', errorData);
        // Don't throw - we still want to show summary even if server save fails
      }
    } catch (error) {
      console.error('Error completing session:', error);
      // Don't throw - we still want to show summary even if server save fails
    }
  }, [state.session, sessionId]);

  /**
   * Start a new session
   */
  const startNewSession = useCallback(() => {
    // Redirect to create new session
    window.location.href = '/sessions/new';
  }, []);

  /**
   * Calculate stats for summary
   */
  const stats = state.showSummary && state.session
    ? calculateSessionStats(
        state.session.completedResults,
        state.session.startedAt,
        new Date().toISOString()
      )
    : null;

  // Auto-complete session when showing summary
  // We only want to trigger this when showSummary becomes true
  // Using a ref to prevent duplicate API calls
  useEffect(() => {
    if (state.showSummary && !sessionCompletedRef.current) {
      sessionCompletedRef.current = true;
      completeSession();
    }
  }, [state.showSummary, completeSession]);

  return {
    session: state.session,
    currentFlashcard,
    isFlipped: state.session?.isFlipped ?? false,
    isLoading: state.isLoading,
    isSavingRating: state.isSavingRating,
    error: state.error,
    showSummary: state.showSummary,
    stats,
    flipCard,
    rateCard,
    exitSession,
    retryAfterError,
    completeSession,
    startNewSession,
  };
}

