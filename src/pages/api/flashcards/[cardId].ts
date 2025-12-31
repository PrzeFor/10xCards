import type { APIRoute } from 'astro';
import { z } from 'zod';
import { FlashcardService } from '../../../lib/services/flashcard.service';
import { createFlashcardRequestSchema, flashcardIdParamSchema, deleteFlashcardParamsSchema } from '../../../lib/schemas/flashcards';

export const prerender = false;

interface ErrorResponse {
  code: string;
  message: string;
}

/**
 * Zod schema for validating UUID format
 */
const cardIdSchema = z.string().uuid();

/**
 * GET /api/flashcards/{cardId}
 * Retrieves a single flashcard by ID for the authenticated user.
 * 
 * @returns 200 - Flashcard found and returned
 * @returns 400 - Invalid UUID format
 * @returns 401 - User not authenticated
 * @returns 404 - Flashcard not found or access denied
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Guard: Supabase client availability
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Database connection not available',
        } as ErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Guard: User authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = locals.user.id;
    const cardId = params.cardId;

    // Validate cardId format
    const validationResult = cardIdSchema.safeParse(cardId);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Invalid flashcard ID format',
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Retrieve flashcard from database
    const flashcard = await flashcardService.getFlashcard(userId, cardId);

    // Handle not found case
    if (!flashcard) {
      return new Response(
        JSON.stringify({
          code: 'NotFound',
          message: 'Flashcard not found',
        } as ErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return success response with flashcard data
    return new Response(
      JSON.stringify(flashcard),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Error retrieving flashcard:', {
      userId: locals.user?.id,
      cardId: params.cardId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

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

/**
 * PUT /api/flashcards/{cardId}
 * Updates an existing flashcard for the authenticated user.
 * 
 * @returns 200 - Flashcard updated successfully
 * @returns 400 - Invalid request (bad UUID, validation error, missing fields)
 * @returns 401 - User not authenticated
 * @returns 403 - Forbidden (generation_id belongs to another user)
 * @returns 404 - Flashcard or generation not found
 * @returns 500 - Internal server error
 */
export const PUT: APIRoute = async ({ request, locals, params }) => {
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

    // Guard clause: Validate cardId parameter
    const paramValidation = flashcardIdParamSchema.safeParse(params);
    if (!paramValidation.success) {
      const firstError = paramValidation.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: firstError.message,
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { cardId } = paramValidation.data;

    console.log(`Processing flashcard update request for user: ${userId}, cardId: ${cardId}`);

    // Guard clause: Check Content-Type
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
    const validationResult = createFlashcardRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: `${firstError.path.join('.')}: ${firstError.message}`,
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const updateData = validationResult.data;

    // Initialize service and update flashcard
    const flashcardService = new FlashcardService(locals.supabase);

    const updatedFlashcard = await flashcardService.updateFlashcard(
      userId,
      cardId,
      updateData
    );

    console.log(`Flashcard updated successfully: ${cardId}`);

    // Return success response
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Update flashcard error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Map service errors to HTTP status codes
    if (error instanceof Error) {
      if (error.message === 'Flashcard not found') {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'Flashcard not found',
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (error.message === 'Generation not found') {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'The specified generation does not exist',
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (error.message === 'Generation forbidden') {
        return new Response(
          JSON.stringify({
            code: 'Forbidden',
            message: 'The specified generation does not belong to you',
          } as ErrorResponse),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred. Please try again.',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * DELETE /api/flashcards/{cardId}
 * Deletes a flashcard for the authenticated user.
 * Also updates related generation statistics if the flashcard was part of a generation.
 * 
 * @returns 204 - Flashcard deleted successfully (No Content)
 * @returns 400 - Invalid UUID format
 * @returns 401 - User not authenticated
 * @returns 403 - Forbidden (user doesn't own the flashcard)
 * @returns 404 - Flashcard not found
 * @returns 500 - Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // Validate cardId parameter
    const paramValidation = deleteFlashcardParamsSchema.safeParse(params);
    if (!paramValidation.success) {
      const firstError = paramValidation.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: firstError?.message || 'Invalid flashcard ID format',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { cardId } = paramValidation.data;

    console.log(`Processing flashcard deletion request for user: ${userId}, cardId: ${cardId}`);

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Delete flashcard
    await flashcardService.deleteFlashcard(userId, cardId);

    console.log(`Flashcard deleted successfully: ${cardId}`);

    // Return 204 No Content
    return new Response(null, { status: 204 });

  } catch (error: any) {
    console.error('Delete flashcard error:', {
      userId: locals.user?.id,
      cardId: params.cardId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle not found
    if (error.code === 'NOT_FOUND') {
      return new Response(
        JSON.stringify({
          code: 'NotFound',
          message: 'Flashcard not found',
        } as ErrorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle forbidden
    if (error.code === 'FORBIDDEN') {
      return new Response(
        JSON.stringify({
          code: 'Forbidden',
          message: "You don't have permission to delete this flashcard",
        } as ErrorResponse),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred. Please try again.',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
