import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const ExchangeCodeSchema = z.object({
  code: z.string().min(1, 'Kod jest wymagany'),
});

/**
 * POST /api/auth/exchange-code
 * Exchange PKCE code for session (server-side)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Validate input
    const validation = ExchangeCodeSchema.safeParse(body);

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

    const { code } = validation.data;

    console.log('🔄 [exchange-code] Starting code exchange...');
    console.log('🔄 [exchange-code] Code length:', code.length);

    // Import createSupabaseServerInstance inside the handler
    const { createSupabaseServerInstance } = await import('@/db/supabase.client');

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    console.log('🔄 [exchange-code] Calling exchangeCodeForSession...');

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ [exchange-code] Error exchanging code:', error);
      console.error('❌ [exchange-code] Error message:', error.message);
      console.error('❌ [exchange-code] Error status:', error.status);
      return new Response(
        JSON.stringify({
          error: error.message || 'Nie udało się wymienić kodu',
          details: error,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ [exchange-code] Code exchange successful');
    console.log('✅ [exchange-code] Session created:', !!data.session);
    console.log('✅ [exchange-code] User:', data.session?.user?.email);

    if (!data.session) {
      return new Response(
        JSON.stringify({
          error: 'Nie utworzono sesji',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Success! Session is now set in cookies
    return new Response(
      JSON.stringify({
        message: 'Sesja utworzona pomyślnie',
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Exchange code error:', error);

    return new Response(
      JSON.stringify({
        error: 'Wystąpił błąd serwera. Spróbuj ponownie później.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

