import type { APIRoute } from 'astro';
import { ResetPasswordApiSchema } from '@/lib/schemas/auth';

export const prerender = false;

/**
 * POST /api/auth/reset-password-session
 * Resets user password using an active recovery session (PKCE flow)
 * No token needed - user must have an active session from clicking reset link
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema (only newPassword needed, no confirmPassword or token)
    const validation = ResetPasswordApiSchema.safeParse(body);

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

    const { newPassword } = validation.data;

    // Import createSupabaseServerInstance inside the handler
    const { createSupabaseServerInstance } = await import('@/db/supabase.client');

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check if user has an active session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: 'Brak aktywnej sesji. Kliknij ponownie link z emaila.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update password using the active session
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
    console.error('Reset password (session) error:', error);

    return new Response(JSON.stringify({ error: 'Wystąpił błąd serwera. Spróbuj ponownie później.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

