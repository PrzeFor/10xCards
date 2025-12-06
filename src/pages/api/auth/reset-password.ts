import type { APIRoute } from 'astro';
import { ResetPasswordSchema } from '@/lib/schemas/auth';
import { z } from 'zod';

export const prerender = false;

// Schema for the full reset password request (includes token)
const ResetPasswordRequestSchema = ResetPasswordSchema.extend({
  token: z.string().min(1, 'Token jest wymagany'),
});

/**
 * POST /api/auth/reset-password
 * Resets user password using the token from email
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = ResetPasswordRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Nieprawidłowe dane wejściowe',
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { token, newPassword } = validation.data;

    // Import createSupabaseServerInstance inside the handler
    const { createSupabaseServerInstance } = await import('@/db/supabase.client');

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Exchange token for session
    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (sessionError) {
      return new Response(
        JSON.stringify({
          error: 'Token resetowania jest nieprawidłowy lub wygasł',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Wystąpił błąd podczas aktualizacji hasła',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Hasło zostało pomyślnie zmienione',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Reset password error:', error);

    return new Response(JSON.stringify({ error: 'Wystąpił błąd serwera. Spróbuj ponownie później.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
