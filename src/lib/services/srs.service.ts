import { FSRS, Rating, createEmptyCard, generatorParameters, type Card, type RecordLog, type RecordLogItem, type FSRSParameters } from 'ts-fsrs';
import type { SRSStateDto, RatingValue, SRSCardState } from '../../types';

/**
 * Service for SRS (Spaced Repetition System) algorithm operations
 * Uses ts-fsrs library for scheduling flashcard reviews
 */
export class SRSService {
  private fsrs: FSRS;

  constructor() {
    // Initialize FSRS with default parameters
    const params: FSRSParameters = generatorParameters({
      enable_fuzz: false, // Disable random fuzz for consistent testing
      enable_short_term: true, // Enable short-term learning steps
    });
    this.fsrs = new FSRS(params);
  }

  /**
   * Map user rating to FSRS Rating enum
   */
  private mapRatingToFSRS(rating: RatingValue): Rating {
    const ratingMap: Record<RatingValue, Rating> = {
      hard: Rating.Hard,
      medium: Rating.Good,
      easy: Rating.Easy,
    };
    return ratingMap[rating];
  }

  /**
   * Map FSRS state to our SRS card state
   */
  private mapFSRSStateToSRSState(fsrsState: number): SRSCardState {
    // FSRS states: 0 = New, 1 = Learning, 2 = Review, 3 = Relearning
    const stateMap: Record<number, SRSCardState> = {
      0: 'new',
      1: 'learning',
      2: 'review',
      3: 'relearning',
    };
    return stateMap[fsrsState] ?? 'new';
  }

  /**
   * Map our SRS state to FSRS state number
   */
  private mapSRSStateToFSRSState(state: SRSCardState): number {
    const stateMap: Record<SRSCardState, number> = {
      new: 0,
      learning: 1,
      review: 2,
      relearning: 3,
    };
    return stateMap[state];
  }

  /**
   * Convert SRSStateDto to FSRS Card
   */
  private srsStateToCard(srsState: SRSStateDto): Card {
    return {
      due: new Date(srsState.next_review),
      stability: srsState.ease_factor,
      difficulty: 5.0, // Default difficulty, will be adjusted by FSRS
      elapsed_days: 0, // Will be calculated by FSRS
      scheduled_days: srsState.interval,
      learning_steps: 0, // Learning steps for new/learning cards
      reps: srsState.repetitions,
      lapses: 0, // Track failures (optional for MVP)
      state: this.mapSRSStateToFSRSState(srsState.state),
      last_review: srsState.last_reviewed_at ? new Date(srsState.last_reviewed_at) : undefined,
    };
  }

  /**
   * Convert FSRS Card to SRSStateDto
   */
  private cardToSRSState(card: Card): SRSStateDto {
    return {
      next_review: card.due.toISOString(),
      interval: Math.round(card.scheduled_days),
      ease_factor: Number(card.stability.toFixed(2)), // Round to 2 decimal places for database compatibility
      repetitions: card.reps,
      state: this.mapFSRSStateToSRSState(card.state),
      last_reviewed_at: card.last_review?.toISOString(),
    };
  }

  /**
   * Initialize a new flashcard with default SRS state
   */
  public initializeCard(): SRSStateDto {
    const now = new Date();
    const emptyCard = createEmptyCard(now);
    return {
      next_review: emptyCard.due.toISOString(),
      interval: 1,
      ease_factor: 2.5,
      repetitions: 0,
      state: 'new',
      last_reviewed_at: undefined,
    };
  }

  /**
   * Calculate next review state based on user rating
   * 
   * @param currentState Current SRS state of the flashcard
   * @param rating User's rating (easy/medium/hard)
   * @param reviewDate Date when the review happened (defaults to now)
   * @returns Updated SRS state with new schedule
   */
  public calculateNextReview(
    currentState: SRSStateDto,
    rating: RatingValue,
    reviewDate: Date = new Date()
  ): SRSStateDto {
    // Convert current state to FSRS card
    const card = this.srsStateToCard(currentState);

    // Map rating to FSRS rating
    const fsrsRating = this.mapRatingToFSRS(rating);

    // Calculate next review using FSRS algorithm
    const schedulingCards: RecordLog = this.fsrs.repeat(card, reviewDate);

    // Get the card for the selected rating
    // We need to handle the type properly since RecordLog is indexed by Grade (Again, Hard, Good, Easy)
    let recordLogItem: RecordLogItem;
    
    switch (fsrsRating) {
      case Rating.Hard:
        recordLogItem = schedulingCards[Rating.Hard];
        break;
      case Rating.Good:
        recordLogItem = schedulingCards[Rating.Good];
        break;
      case Rating.Easy:
        recordLogItem = schedulingCards[Rating.Easy];
        break;
      default:
        // Default to Good if something goes wrong
        recordLogItem = schedulingCards[Rating.Good];
        break;
    }
    
    const updatedCard = recordLogItem.card;

    // Convert back to SRS state
    const newState = this.cardToSRSState(updatedCard);

    // Update last reviewed timestamp
    newState.last_reviewed_at = reviewDate.toISOString();

    return newState;
  }

  /**
   * Get all possible next states for a card (for preview/debugging)
   * Returns what would happen for each rating option
   */
  public previewNextStates(
    currentState: SRSStateDto,
    reviewDate: Date = new Date()
  ): Record<RatingValue, SRSStateDto> {
    const card = this.srsStateToCard(currentState);
    const schedulingCards = this.fsrs.repeat(card, reviewDate);

    return {
      hard: this.cardToSRSState(schedulingCards[Rating.Hard].card),
      medium: this.cardToSRSState(schedulingCards[Rating.Good].card),
      easy: this.cardToSRSState(schedulingCards[Rating.Easy].card),
    };
  }

  /**
   * Check if a flashcard is due for review
   */
  public isDueForReview(srsState: SRSStateDto, currentDate: Date = new Date()): boolean {
    const nextReviewDate = new Date(srsState.next_review);
    return nextReviewDate <= currentDate;
  }

  /**
   * Get number of days until next review
   */
  public getDaysUntilReview(srsState: SRSStateDto, currentDate: Date = new Date()): number {
    const nextReviewDate = new Date(srsState.next_review);
    const diffMs = nextReviewDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
}

// Export singleton instance
export const srsService = new SRSService();


