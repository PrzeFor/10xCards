import type { APIRoute } from 'astro';
import { ForgotPasswordSchema } from '@/lib/schemas/auth';

export const prerender = false;

/**
 * POST /api/auth/forgot-password
 * Sends password reset email to the user
 */
export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = ForgotPasswordSchema.safeParse(body);

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

    const { email } = validation.data;

    // Import createSupabaseServerInstance inside the handler
    const { createSupabaseServerInstance } = await import('@/db/supabase.client');

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get the base URL for the redirect
    // Use the full URL including protocol, domain, and path
    const origin = url.origin;
    const redirectTo = `${origin}/auth/reset-password`;

    // Send password reset email
    // Note: The redirectTo URL must be configured in Supabase dashboard under:
    // Authentication > URL Configuration > Redirect URLs
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Note: Supabase returns success even if email doesn't exist (security best practice)
    // Don't expose whether the email exists or not
    if (error) {
      console.error('Password reset error:', error);
      // Still return success to not leak email existence
    }

    // Always return success response for security
    return new Response(
      JSON.stringify({
        message: 'Jeśli konto istnieje, wysłano e-mail z linkiem do resetowania hasła',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Forgot password error:', error);

    return new Response(JSON.stringify({ error: 'Wystąpił błąd serwera. Spróbuj ponownie później.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
