import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { changePasswordSchema } from '../../../lib/schemas/userSchemas';
import { UserService } from '../../../lib/services/userService';
import type { ApiErrorResponse } from '../../../types';

export const prerender = false;

/**
 * PUT /api/auth/password
 * Changes the authenticated user's password
 * Requires current password and new password with confirmation
 */
export const PUT: APIRoute = async ({ request, locals }) => {
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

    // Parse request body
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

    // Validate request body with Zod schema
    const validatedData = changePasswordSchema.parse(body);

    const userService = new UserService(supabase);
    const result = await userService.changePassword(
      validatedData.current_password,
      validatedData.new_password
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PUT /api/auth/password] Error:', error);

    if (error instanceof ZodError) {
      const firstError = error.errors[0];

      // Check for password mismatch error
      if (firstError.path.includes('new_password_confirmation')) {
        return new Response(
          JSON.stringify({
            code: 'PasswordMismatch',
            message: firstError.message,
          } as ApiErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check for same password error
      if (firstError.path.includes('new_password') && firstError.message.includes('different')) {
        return new Response(
          JSON.stringify({
            code: 'SamePassword',
            message: firstError.message,
          } as ApiErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generic validation error
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

    // Check for invalid current password
    if (error instanceof Error && error.message === 'INVALID_CURRENT_PASSWORD') {
      return new Response(
        JSON.stringify({
          code: 'InvalidCurrentPassword',
          message: 'Current password is incorrect.',
        } as ApiErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic server error
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

