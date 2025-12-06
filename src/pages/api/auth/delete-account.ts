import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/auth/delete-account
 * Deletes the user account and all associated data
 * Requires authentication
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  try {
    // Check if user is authenticated
    const { user, supabase } = locals;

    if (!user) {
      return new Response(JSON.stringify({ error: 'Nie jesteś zalogowany' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete user's flashcards
    const { error: flashcardsError } = await supabase.from('flashcards').delete().eq('user_id', user.id);

    if (flashcardsError) {
      console.error('Error deleting flashcards:', flashcardsError);
    }

    // Delete user's generations
    const { error: generationsError } = await supabase.from('generations').delete().eq('user_id', user.id);

    if (generationsError) {
      console.error('Error deleting generations:', generationsError);
    }

    // Delete user's generation error logs
    const { error: logsError } = await supabase.from('generation_error_logs').delete().eq('user_id', user.id);

    if (logsError) {
      console.error('Error deleting logs:', logsError);
    }

    // Delete the user account from Supabase Auth
    // Note: This requires the service role key or admin privileges
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user account:', deleteError);
      return new Response(JSON.stringify({ error: 'Wystąpił błąd podczas usuwania konta' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sign out and redirect to home page
    await supabase.auth.signOut();
    return redirect('/', 302);
  } catch (error) {
    console.error('Delete account error:', error);

    return new Response(JSON.stringify({ error: 'Wystąpił błąd serwera. Spróbuj ponownie później.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
