import type { APIRoute } from 'astro';
import { FlashcardService } from '../../../../lib/services/flashcard.service';
import { updateSRSStateRequestSchema } from '../../../../lib/schemas/session';
import type { UpdateSRSStateRequestDto, UpdateSRSStateResponseDto } from '../../../../types';

/**
 * PUT /api/flashcards/:cardId/srs
 * Updates the SRS state of a flashcard after user review
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { cardId } = params;

    // Step 1: Validate cardId parameter
    if (!cardId) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Flashcard ID is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get authenticated user from locals
    const user = locals.user;
    const supabase = locals.supabase;

    if (!user || !supabase) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'You must be logged in to update flashcards',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Parse and validate request body
    let requestBody: UpdateSRSStateRequestDto;
    try {
      const body = await request.json();
      const validationResult = updateSRSStateRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            code: 'ValidationError',
            message: validationResult.error.errors[0].message,
            details: validationResult.error.errors,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      requestBody = validationResult.data;
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Invalid JSON in request body',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Update SRS state using FlashcardService
    const flashcardService = new FlashcardService(supabase);

    let updateResponse: UpdateSRSStateResponseDto;
    try {
      updateResponse = await flashcardService.updateSRSState(cardId, user.id, requestBody);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('not found')) {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'Flashcard not found',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (errorMessage.includes('Access denied')) {
        return new Response(
          JSON.stringify({
            code: 'Forbidden',
            message: 'You do not have access to this flashcard',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.error('Error updating flashcard SRS state:', error);

      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Failed to update flashcard SRS state',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Return updated flashcard data
    return new Response(JSON.stringify(updateResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/flashcards/:cardId/srs:', error);

    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Disable prerendering for this API route
export const prerender = false;

