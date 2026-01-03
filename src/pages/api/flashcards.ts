import type { APIRoute } from 'astro';
import { createFlashcardsRequestSchema, listFlashcardsQuerySchema } from '../../lib/schemas/flashcards';
import { FlashcardService } from '../../lib/services/flashcard.service';

export const prerender = false;

/**
 * Error response structure
 */
interface ErrorResponse {
  code: string;
  message: string;
}

/**
 * POST /api/flashcards - Create one or more flashcards
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if Supabase client is available
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Database connection not available',
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = locals.user.id;

    console.log(`Processing flashcards creation request for user: ${userId}`);

    // Check Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Content-Type must be application/json',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Invalid JSON in request body',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate request schema
    const validationResult = createFlashcardsRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: `Validation failed: ${errorMessages}`,
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { flashcards } = validationResult.data;

    // Create flashcard service instance
    const flashcardService = new FlashcardService(locals.supabase);

    // Create flashcards
    const createdFlashcards = await flashcardService.createFlashcards(userId, flashcards);

    console.log(`Successfully created ${createdFlashcards.length} flashcards for user: ${userId}`);

    // Return created flashcards
    return new Response(JSON.stringify(createdFlashcards), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating flashcards:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for generation not found error
      if (error.message.includes('Generation not found') || error.message.includes('access denied')) {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'Generacja nie znaleziona lub brak dostępu.',
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // UUID validation is handled by Zod schema, so this error type is no longer needed

      // Check for database constraint violations
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        return new Response(
          JSON.stringify({
            code: 'ConflictError',
            message: 'Fiszka o takiej treści już istnieje.',
          } as ErrorResponse),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check for database connection errors
      if (error.message.includes('Database error') || error.message.includes('connection')) {
        return new Response(
          JSON.stringify({
            code: 'ServiceUnavailable',
            message: 'Tymczasowy problem z bazą danych. Spróbuj ponownie.',
          } as ErrorResponse),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check for validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return new Response(
          JSON.stringify({
            code: 'ValidationError',
            message: `Błąd walidacji: ${error.message}`,
          } as ErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check for timeout errors
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return new Response(
          JSON.stringify({
            code: 'RequestTimeout',
            message: 'Przekroczono limit czasu żądania. Spróbuj ponownie.',
          } as ErrorResponse),
          {
            status: 408,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'Wystąpił nieoczekiwany błąd wewnętrzny.',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /api/flashcards - List user's flashcards with pagination
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Guard clause: Check Supabase client availability
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Database connection not available',
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Guard clause: Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = locals.user.id;

    console.log(`Processing flashcards list request for user: ${userId}`);

    // Parse query parameters from URL
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined,
      filter_source: url.searchParams.get('filter[source]') || undefined,
      filter_deck_id: url.searchParams.get('filter[deck_id]') || undefined,
      sort_created_at: url.searchParams.get('sort[created_at]') || undefined,
    };

    // Validate query parameters
    const validationResult = listFlashcardsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: `Invalid query parameter: ${firstError.path.join('.')} - ${firstError.message}`,
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Get paginated flashcards
    const result = await flashcardService.listFlashcards(userId, validationResult.data);

    console.log(`Returned ${result.items.length} flashcards (total: ${result.total})`);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error in GET /api/flashcards:', {
      userId: locals.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
