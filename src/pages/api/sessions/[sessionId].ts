import type { APIRoute } from 'astro';
import { SessionService } from '../../../lib/services/session.service';
import type { SessionDto } from '../../../types';

/**
 * GET /api/sessions/:sessionId
 * Retrieves session details by ID
 */
export const GET: APIRoute = async ({ params, locals }) => {
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
          message: 'You must be logged in to view sessions',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Get session using SessionService
    const sessionService = new SessionService(supabase);

    let session: SessionDto | null;
    try {
      session = await sessionService.getSession(sessionId, user.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Access denied')) {
        return new Response(
          JSON.stringify({
            code: 'Forbidden',
            message: 'You do not have access to this session',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.error('Error retrieving session:', error);

      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Failed to retrieve session',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Check if session exists
    if (!session) {
      return new Response(
        JSON.stringify({
          code: 'NotFound',
          message: 'Session not found',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Return session data
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/sessions/:sessionId:', error);

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

