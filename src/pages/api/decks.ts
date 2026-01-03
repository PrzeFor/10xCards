import type { APIRoute } from 'astro';
import { createDeckRequestSchema } from '../../lib/schemas/decks';
import { DeckService } from '../../lib/services/deck.service';

export const prerender = false;

/**
 * Error response structure
 */
interface ErrorResponse {
  code: string;
  message: string;
}

/**
 * GET /api/decks - List all decks for the user
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Guard clause: Check Supabase client availability
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Database connection not available',
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Guard clause: Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = locals.user.id;
    console.log(`Processing decks list request for user: ${userId}`);

    // Initialize deck service
    const deckService = new DeckService(locals.supabase);

    // Get all decks
    const decks = await deckService.listDecks(userId);

    console.log(`Returned ${decks.length} decks`);

    // Return successful response
    return new Response(JSON.stringify(decks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error in GET /api/decks:', {
      userId: locals.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'An unexpected error occurred',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /api/decks - Create a new deck
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if Supabase client is available
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalServerError',
          message: 'Database connection not available',
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: 'Unauthorized',
          message: 'Authentication required',
        } as ErrorResponse),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = locals.user.id;
    console.log(`Processing deck creation request for user: ${userId}`);

    // Check Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Content-Type must be application/json',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Invalid JSON in request body',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate request schema
    const validationResult = createDeckRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: `Validation failed: ${errorMessages}`,
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create deck service instance
    const deckService = new DeckService(locals.supabase);

    // Create deck
    const createdDeck = await deckService.createDeck(userId, validationResult.data);

    console.log(`Successfully created deck: ${createdDeck.id} for user: ${userId}`);

    // Return created deck
    return new Response(JSON.stringify(createdDeck), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating deck:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for duplicate name error
      if (error.message.includes('już istnieje')) {
        return new Response(
          JSON.stringify({
            code: 'ConflictError',
            message: error.message,
          } as ErrorResponse),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check for validation errors
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return new Response(
          JSON.stringify({
            code: 'ValidationError',
            message: `Błąd walidacji: ${error.message}`,
          } as ErrorResponse),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'Wystąpił nieoczekiwany błąd wewnętrzny.',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

