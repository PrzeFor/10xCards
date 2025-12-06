import type { APIRoute } from 'astro';
import { createFlashcardsRequestSchema } from '../../lib/schemas/flashcards';
import { FlashcardService } from '../../lib/services/flashcard.service';

const prerender = false;

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
