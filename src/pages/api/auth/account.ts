import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { UserService } from '../../../lib/services/userService';
import { deleteAccountSchema } from '../../../lib/schemas/userSchemas';
import type { ApiErrorResponse } from '../../../types';

export const prerender = false;

/**
 * GET /api/auth/account
 * Retrieves authenticated user's account information
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
    const userAccount = await userService.getUserAccount(session.data.session.user.id);

    return new Response(JSON.stringify(userAccount), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET /api/auth/account] Error:', error);

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

/**
 * DELETE /api/auth/account
 * Permanently deletes user account and all associated data (GDPR compliant)
 * Requires password confirmation and explicit confirmation flag
 */
export const DELETE: APIRoute = async ({ request, locals }) => {
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

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Invalid JSON in request body',
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validatedData = deleteAccountSchema.parse(body);

    const userService = new UserService(supabase);
    await userService.deleteUserAccount(session.data.session.user.id, validatedData.password);

    // Sign out the user after account deletion
    await supabase.auth.signOut();

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error('[DELETE /api/auth/account] Error:', error);

    if (error instanceof ZodError) {
      const firstError = error.errors[0];

      if (firstError.path.includes('confirmation')) {
        return new Response(
          JSON.stringify({
            code: 'ConfirmationRequired',
            message: 'Confirmation must be true to delete account.',
          } as ApiErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: `Validation failed: ${firstError.message}`,
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof Error && error.message === 'INVALID_PASSWORD') {
      return new Response(
        JSON.stringify({
          code: 'InvalidPassword',
          message: 'Password is incorrect.',
        } as ApiErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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

