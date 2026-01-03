import type { APIRoute } from 'astro';
import { updateDeckRequestSchema } from '../../../lib/schemas/decks';
import { DeckService } from '../../../lib/services/deck.service';

export const prerender = false;

/**
 * Error response structure
 */
interface ErrorResponse {
  code: string;
  message: string;
}

/**
 * GET /api/decks/[deckId] - Get a single deck
 */
export const GET: APIRoute = async ({ params, locals }) => {
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
    const deckId = params.deckId;

    if (!deckId) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Deck ID is required',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing get deck request for deck: ${deckId}, user: ${userId}`);

    // Initialize deck service
    const deckService = new DeckService(locals.supabase);

    // Get the deck
    const deck = await deckService.getDeck(userId, deckId);

    console.log(`Successfully retrieved deck: ${deckId}`);

    // Return successful response
    return new Response(JSON.stringify(deck), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/decks/[deckId]:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          code: 'NotFound',
          message: 'Zestaw nie został znaleziony',
        } as ErrorResponse),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
 * PUT /api/decks/[deckId] - Update a deck
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
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
    const deckId = params.deckId;

    if (!deckId) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Deck ID is required',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing update deck request for deck: ${deckId}, user: ${userId}`);

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
    const validationResult = updateDeckRequestSchema.safeParse(requestBody);
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

    // Update deck
    const updatedDeck = await deckService.updateDeck(userId, deckId, validationResult.data);

    console.log(`Successfully updated deck: ${deckId}`);

    // Return updated deck
    return new Response(JSON.stringify(updatedDeck), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating deck:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for not found error
      if (error.message.includes('not found')) {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'Zestaw nie został znaleziony',
          } as ErrorResponse),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

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

/**
 * DELETE /api/decks/[deckId] - Delete a deck
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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
    const deckId = params.deckId;

    if (!deckId) {
      return new Response(
        JSON.stringify({
          code: 'ValidationError',
          message: 'Deck ID is required',
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing delete deck request for deck: ${deckId}, user: ${userId}`);

    // Create deck service instance
    const deckService = new DeckService(locals.supabase);

    // Delete deck
    await deckService.deleteDeck(userId, deckId);

    console.log(`Successfully deleted deck: ${deckId}`);

    // Return 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error('Error deleting deck:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for not found error
      if (error.message.includes('not found')) {
        return new Response(
          JSON.stringify({
            code: 'NotFound',
            message: 'Zestaw nie został znaleziony',
          } as ErrorResponse),
          {
            status: 404,
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

