import type { APIRoute } from 'astro';
import { UserService } from '../../../lib/services/userService';
import type { ApiErrorResponse } from '../../../types';

export const prerender = false;

/**
 * GET /api/stats/user
 * Retrieves user statistics (total flashcards, sessions, generations)
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required.',
        } as ApiErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userService = new UserService(supabase);
    const userStats = await userService.getUserStats(session.data.session.user.id);

    return new Response(JSON.stringify(userStats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET /api/stats/user] Error:', error);

    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred. Please try again.',
      } as ApiErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

