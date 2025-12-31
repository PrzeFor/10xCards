import type { FlashcardWithSRSDto, SessionStatsDto, SessionCardResultDto } from '../../types';

/**
 * Format session duration from seconds to readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string (MM:SS or HH:MM:SS)
 */
export function formatSessionDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate flashcards data for session
 * @param flashcards - Array of flashcards to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateFlashcards(flashcards: FlashcardWithSRSDto[]): string[] {
  const errors: string[] = [];

  if (!flashcards || flashcards.length === 0) {
    errors.push('Session must contain at least one flashcard');
    return errors;
  }

  flashcards.forEach((card, index) => {
    if (!card.id) {
      errors.push(`Flashcard at index ${index} is missing ID`);
    }

    if (!card.front || card.front.trim() === '') {
      errors.push(`Flashcard ${card.id || index} has empty front`);
    }

    if (!card.back || card.back.trim() === '') {
      errors.push(`Flashcard ${card.id || index} has empty back`);
    }

    if (!card.srs_state) {
      errors.push(`Flashcard ${card.id || index} is missing SRS state`);
    } else {
      // Validate SRS state
      if (typeof card.srs_state.interval !== 'number' || card.srs_state.interval < 0) {
        errors.push(`Flashcard ${card.id || index} has invalid interval`);
      }

      if (typeof card.srs_state.ease_factor !== 'number' || card.srs_state.ease_factor <= 0) {
        errors.push(`Flashcard ${card.id || index} has invalid ease factor`);
      }

      if (typeof card.srs_state.repetitions !== 'number' || card.srs_state.repetitions < 0) {
        errors.push(`Flashcard ${card.id || index} has invalid repetitions count`);
      }

      const validStates = ['new', 'learning', 'review', 'relearning'];
      if (!validStates.includes(card.srs_state.state)) {
        errors.push(`Flashcard ${card.id || index} has invalid state: ${card.srs_state.state}`);
      }
    }
  });

  return errors;
}

/**
 * Calculate time spent reviewing a card
 * @param startTime - ISO timestamp when card was revealed
 * @param endTime - ISO timestamp when card was rated (defaults to now)
 * @returns Duration in seconds
 */
export function calculateReviewDuration(startTime: string, endTime?: string): number {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationMs = end - start;
  return Math.max(0, Math.floor(durationMs / 1000));
}

/**
 * Validate session statistics
 * @param stats - Session statistics to validate
 * @returns True if valid, false otherwise
 */
export function validateSessionStats(stats: SessionStatsDto): boolean {
  // Check that sum of ratings equals total cards
  const sumRatings = stats.easy_count + stats.medium_count + stats.hard_count;
  if (sumRatings !== stats.total_cards) {
    console.error(
      `Invalid stats: sum of ratings (${sumRatings}) != total cards (${stats.total_cards})`
    );
    return false;
  }

  // Check that duration is positive
  if (stats.duration < 0) {
    console.error(`Invalid stats: negative duration (${stats.duration})`);
    return false;
  }

  // Check that timestamps are valid
  try {
    const startTime = new Date(stats.started_at).getTime();
    const endTime = new Date(stats.completed_at).getTime();

    if (isNaN(startTime) || isNaN(endTime)) {
      console.error('Invalid stats: invalid timestamp format');
      return false;
    }

    if (endTime < startTime) {
      console.error('Invalid stats: completed_at is before started_at');
      return false;
    }
  } catch (error) {
    console.error('Invalid stats: error parsing timestamps', error);
    return false;
  }

  return true;
}

/**
 * Calculate average review duration per card
 * @param results - Array of card results
 * @returns Average duration in seconds
 */
export function calculateAverageReviewDuration(results: SessionCardResultDto[]): number {
  if (results.length === 0) return 0;

  const totalDuration = results.reduce((sum, result) => sum + result.review_duration, 0);
  return Math.round(totalDuration / results.length);
}

/**
 * Get performance level based on rating distribution
 * @param stats - Session statistics
 * @returns Performance level string
 */
export function getPerformanceLevel(stats: SessionStatsDto): 'excellent' | 'good' | 'needs-work' {
  const easyPercent = (stats.easy_count / stats.total_cards) * 100;
  const hardPercent = (stats.hard_count / stats.total_cards) * 100;

  if (easyPercent >= 70) {
    return 'excellent';
  } else if (hardPercent >= 50) {
    return 'needs-work';
  } else {
    return 'good';
  }
}

/**
 * Format card count with proper plural form (Polish)
 * @param count - Number of cards
 * @returns Formatted string
 */
export function formatCardCount(count: number): string {
  if (count === 1) return '1 fiszka';
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return `${count} fiszki`;
  }
  return `${count} fiszek`;
}

