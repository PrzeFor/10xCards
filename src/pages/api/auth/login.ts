import type { APIRoute } from 'astro';
import { LoginSchema } from '@/lib/schemas/auth';

export const prerender = false;

/**
 * POST /api/auth/login
 * Handles user login with email and password
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = LoginSchema.safeParse(body);
    
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

    // Import createSupabaseServerInstance inside the handler to avoid edge case issues
    const { createSupabaseServerInstance } = await import('@/db/supabase.client');
    
    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    // Attempt to sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication errors
    if (error) {
      // Provide user-friendly error messages
      let errorMessage = 'Nieprawidłowy e-mail lub hasło';
      
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Potwierdź swój adres e-mail przed zalogowaniem';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Nieprawidłowy e-mail lub hasło';
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
        JSON.stringify({ error: 'Błąd podczas logowania' }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return success response with user data
    return new Response(
      JSON.stringify({ 
        user: {
          id: data.user.id,
          email: data.user.email,
        }
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Wystąpił błąd serwera. Spróbuj ponownie później.' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

