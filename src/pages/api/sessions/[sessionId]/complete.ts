import type { APIRoute } from 'astro';
import { SessionService } from '../../../../lib/services/session.service';
import { completeSessionRequestSchema, validateSessionStats } from '../../../../lib/schemas/session';
import type { CompleteSessionRequestDto, SessionDto } from '../../../../types';

/**
 * POST /api/sessions/:sessionId/complete
 * Completes a session and saves statistics
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const { sessionId } = params;

    // Step 1: Validate sessionId parameter
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Session ID is required',
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
          message: 'You must be logged in to complete sessions',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Parse and validate request body
    let requestBody: CompleteSessionRequestDto;
    try {
      const body = await request.json();
      const validationResult = completeSessionRequestSchema.safeParse(body);

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

      // Additional validation: check if stats match
      if (!validateSessionStats(requestBody.stats)) {
        return new Response(
          JSON.stringify({
            code: 'ValidationError',
            message: 'Session statistics are inconsistent (sum of ratings does not match total cards)',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Invalid JSON in request body',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Complete session using SessionService
    const sessionService = new SessionService(supabase);

    let completedSession: SessionDto;
    try {
      completedSession = await sessionService.completeSession(sessionId, user.id, requestBody);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('not found')) {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'Session not found',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (errorMessage.includes('Access denied')) {
        return new Response(
          JSON.stringify({
            code: 'Forbidden',
            message: 'You do not have access to this session',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (errorMessage.includes('already completed')) {
        return new Response(
          JSON.stringify({
            code: 'ConflictError',
            message: 'Session has already been completed',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.error('Error completing session:', error);

      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Failed to complete session',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Return completed session data
    return new Response(
      JSON.stringify({
        success: true,
        session: completedSession,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/sessions/:sessionId/complete:', error);

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

