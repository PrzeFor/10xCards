import type { Database } from './db/database.types';

// Extract row and insert types for convenience
type GenerationRow = Database['public']['Tables']['generations']['Row'];
type FlashcardRow = Database['public']['Tables']['flashcards']['Row'];
type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert'];
type GenerationErrorRow = Database['public']['Tables']['generation_error_logs']['Row'];

/**
 * Request payload to create a new flashcard generation.
 */
export type CreateGenerationRequestDto = {
    source_text: string;
}

/**
 * Common pagination parameters for list endpoints.
 */
export type PaginationParamsDto = {
    limit?: number;
    offset?: number;
};

/**
 * Query parameters for listing generation requests.
 * filter_status corresponds to filter[status]
 * sort_created_at corresponds to sort[created_at]
 */
export type ListGenerationsRequestDto = PaginationParamsDto & {
    filter_status?: GenerationStatus;
    sort_created_at?: 'asc' | 'desc';
};

/**
 * Query parameters for listing flashcards.
 * filter_source corresponds to filter[source]
 * sort_created_at corresponds to sort[created_at]
 */
export type ListFlashcardsRequestDto = PaginationParamsDto & {
    filter_source?: FlashcardSource;
    sort_created_at?: 'asc' | 'desc';
};

/**
 * Query parameters for listing flashcards of a specific generation.
 */
export type ListGenerationFlashcardsRequestDto = PaginationParamsDto;

/**
 * A proposed flashcard returned from AI generation.
 */
export type FlashcardProposalDto = {
    id: string;
    front: string;
    back: string;
    source: FlashcardSource;
};

/**
 * Response payload after creating a generation request.
 */
export type CreateGenerationResponseDto = {
    id: string;
    model: string;
    status: GenerationStatus;
    generated_count: number;
    flashcards_proposals: FlashcardProposalDto[];
};

export type GenerationStatus = 'pending' | 'completed' | 'failed';

/**
 * A summary item in the list of generations.
 */
export type GenerationListItemDto = {
    id: string;
    model: string;
    status: GenerationStatus;
    generated_count: number;
    accepted_unedited_count: number;
    accepted_edited_count: number;
    source_text_length: number;
    created_at: string;
};

/**
 * Generic paginated response wrapper.
 */
export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    limit: number;
    offset: number;
};

/**
 * List of generation summaries.
 */
export type ListGenerationsResponseDto = PaginatedResponse<GenerationListItemDto>;

/**
 * Detailed generation metadata.
 */
export type GetGenerationResponseDto = Pick<
    GenerationRow,
    | 'id'
    | 'status'
    | 'generated_count'
    | 'accepted_unedited_count'
    | 'accepted_edited_count'
>;

/**
 * Query parameters for listing flashcards of a specific generation.
 */
export type ListGenerationFlashcardsResponseDto = PaginatedResponse<FlashcardProposalDto>;

/**
 * Command to accept or reject all proposals in a generation.
 */
export type BulkFlashcardActionRequestDto = {
    action: 'accept_all' | 'reject_all';
};

/**
 * Result of a bulk accept/reject operation.
 */
export type BulkFlashcardActionResponseDto = {
    accepted: number;
    rejected: number;
};

/**
 * Error log entry for a failed generation.
 */
export type GenerationErrorDto = Pick<
    GenerationErrorRow,
    'id' | 'error_message'
>;

/**
 * List of errors for a failed generation.
 */
export type ListGenerationErrorsResponseDto = GenerationErrorDto[];

/**
 * Full flashcard object as stored in the database.
 */
export type FlashcardDto = Pick<FlashcardRow, 'id' | 'front' | 'back' | 'source' | 'generation_id' | 'created_at' | 'updated_at'>;

/**
 * List all flashcards for a user.
 */
export type ListFlashcardsResponseDto = PaginatedResponse<FlashcardDto>;

/**
 * Payload for creating a single flashcard.
 */
export type CreateFlashcardRequestDto = {
    front: string;
    back: string;
    source: FlashcardSource;
    generation_id?: string;
};

/**
 * Payload to create one or more flashcards.
 * Uses CreateFlashcardRequest for each item in the list.
 */
export type CreateFlashcardsRequestDto = {
    flashcards: CreateFlashcardRequestDto[];
};

/**
 * Response after creating flashcards.
 */
export type CreateFlashcardsResponseDto = FlashcardDto[];

/**
 * Retrieve a single flashcard.
 */
export type GetFlashcardResponseDto = FlashcardDto;

/**
 * Payload to update an existing flashcard.
 */
export type UpdateFlashcardRequestDto = Pick<
    FlashcardInsert,
    'front' | 'back' | 'source' | 'generation_id'
>;

/**
 * Response after updating a flashcard.
 */
export type UpdateFlashcardResponseDto = FlashcardDto;

/**
 * Response after deleting a flashcard (204 No Content).
 */
export type DeleteFlashcardResponseDto = void;

/**
 * Generation metrics for user dashboard.
 * Keys: total requests, accepted generations, edited generations, rejected generations.
 */
export type GenerationStatsResponseDto = {
    total: number;
    accepted: number;
    edited: number;
    rejected: number;
};

/**
 * Flashcard acceptance/edit statistics.
 */
export type FlashcardStatsResponseDto = {
    total: number;
    accepted: number;
    edited: number;
    rejected: number;
};

/**
 * Possible flashcard sources.
 */
export type FlashcardSource = 'manual' | 'ai_full' | 'ai_edited';
