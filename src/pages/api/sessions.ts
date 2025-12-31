import type { APIRoute } from 'astro';
import { SessionService } from '../../lib/services/session.service';
import { createSessionRequestSchema } from '../../lib/schemas/session';
import type { CreateSessionRequestDto, CreateSessionResponseDto } from '../../types';

/**
 * POST /api/sessions
 * Creates a new SRS review session with flashcards due for review
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get authenticated user from locals (set by middleware)
    const user = locals.user;
    const supabase = locals.supabase;

    if (!user || !supabase) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'You must be logged in to create a session',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Parse and validate request body
    let requestBody: CreateSessionRequestDto;
    try {
      const body = await request.json();
      const validationResult = createSessionRequestSchema.safeParse(body);

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

    // Step 3: Create session using SessionService
    const sessionService = new SessionService(supabase);

    let sessionResponse: CreateSessionResponseDto;
    try {
      sessionResponse = await sessionService.createSession(user.id, requestBody);
    } catch (error) {
      // Check for specific error cases
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('No flashcards available')) {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'No flashcards available for review at this time',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Log unexpected errors
      console.error('Error creating session:', error);

      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Failed to create session',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Return session data
    return new Response(JSON.stringify(sessionResponse), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/sessions:', error);

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

