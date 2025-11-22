import type { APIRoute } from 'astro';
import { RegisterApiSchema } from '@/lib/schemas/auth';

export const prerender = false;

/**
 * POST /api/auth/register
 * Handles user registration with email and password
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = RegisterApiSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe dane wejściowe',
          details: validation.error.errors
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { email, password } = validation.data;

    // Import createSupabaseServerInstance inside the handler
    const { createSupabaseServerInstance } = await import('@/db/supabase.client');
    
    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    // Attempt to register with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/generations`,
      }
    });

    // Handle registration errors
    if (error) {
      // Provide user-friendly error messages
      let errorMessage = 'Wystąpił błąd podczas rejestracji';
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'Użytkownik o podanym adresie e-mail już istnieje';
      } else if (error.message.includes('Password should be')) {
        errorMessage = 'Hasło nie spełnia wymagań bezpieczeństwa';
      } else if (error.message.includes('already registered')) {
        errorMessage = 'Ten adres e-mail jest już zarejestrowany';
      }

      return new Response(
        JSON.stringify({ error: errorMessage }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user data exists
    if (!data.user) {
      return new Response(
        JSON.stringify({ error: 'Błąd podczas rejestracji' }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return success response with user data
    // Note: requiresEmailConfirmation indicates whether the user needs to confirm their email
    // If email confirmation is required, the user won't be logged in until they click the link
    return new Response(
      JSON.stringify({ 
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        requiresEmailConfirmation: !data.session, // No session means email confirmation is required
        message: !data.session 
          ? 'Na Twój adres e-mail został wysłany link aktywacyjny. Potwierdź swoje konto, aby się zalogować.'
          : 'Rejestracja zakończona pomyślnie!'
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Wystąpił błąd serwera. Spróbuj ponownie później.' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

