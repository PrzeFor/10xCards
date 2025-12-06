import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/auth/logout
 * Handles user logout and session cleanup
 */
export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  try {
    // Import createSupabaseServerInstance inside the handler
    const { createSupabaseServerInstance } = await import('@/db/supabase.client');

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return new Response(JSON.stringify({ error: 'Wystąpił błąd podczas wylogowania' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Redirect to home page after successful logout
    return redirect('/', 302);
  } catch (error) {
    console.error('Logout error:', error);

    return new Response(JSON.stringify({ error: 'Wystąpił błąd serwera. Spróbuj ponownie później.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
