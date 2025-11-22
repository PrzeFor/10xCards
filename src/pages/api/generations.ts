import type { APIRoute } from 'astro';
import { createGenerationRequestSchema } from '../../lib/schemas/generation';
import { GenerationService } from '../../lib/services/generation.service';
import { DEFAULT_USER_ID } from '../../db/supabase.client';
import { OpenRouterError } from '../../lib/services/openRouter/openRouter.types';

const prerender = false;

/**
 * Error response structure
 */
type ErrorResponse = {
  code: string;
  message: string;
};

/**
 * POST /api/generations - Create a new flashcard generation
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check if Supabase client is available
    if (!locals.supabase) {
      return new Response(
        JSON.stringify({
          code: 'InternalError',
          message: 'Database connection not available'
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For development phase, use default user ID
    // TODO: Replace with real authentication when auth system is implemented
    const userId = DEFAULT_USER_ID;

    console.log(`Processing generation request for user: ${userId}`);

    // Check Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(
        JSON.stringify({
          code: 'InvalidContentType',
          message: 'Content-Type must be application/json'
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          code: 'InvalidJSON',
          message: 'Request body must be valid JSON'
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate request data
    const validationResult = createGenerationRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          code: 'InvalidSourceText',
          message: firstError?.message || 'Invalid source text'
        } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { source_text } = validationResult.data;

    // Initialize generation service
    const generationService = new GenerationService(locals.supabase);

    // Create generation
    const result = await generationService.createGeneration(source_text);

    // Return successful response
    return new Response(
      JSON.stringify(result),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error('Generation endpoint error:', error);

    // Handle OpenRouterError specifically
    if (error instanceof OpenRouterError) {
      const statusCode = error.statusCode || 500;

      switch (error.code) {
        case 'MISSING_API_KEY':
        case 'AUTHENTICATION_FAILED':
          return new Response(
            JSON.stringify({
              code: 'ConfigurationError',
              message: 'AI service configuration error'
            } as ErrorResponse),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );

        case 'RATE_LIMIT_EXCEEDED':
          return new Response(
            JSON.stringify({
              code: 'RateLimitExceeded',
              message: 'Too many requests. Please try again later.'
            } as ErrorResponse),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60'
              }
            }
          );

        case 'NETWORK_ERROR':
          return new Response(
            JSON.stringify({
              code: 'NetworkError',
              message: 'Network error occurred. Please check your connection.'
            } as ErrorResponse),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );

        case 'MAX_RETRIES_EXCEEDED':
        case 'SERVER_ERROR':
          return new Response(
            JSON.stringify({
              code: 'AIServiceError',
              message: 'AI service is temporarily unavailable. Please try again later.'
            } as ErrorResponse),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );

        case 'SCHEMA_VALIDATION_FAILED':
        case 'INVALID_RESPONSE_FORMAT':
          return new Response(
            JSON.stringify({
              code: 'AIServiceError',
              message: 'AI service returned invalid data. Please try again.'
            } as ErrorResponse),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );

        default:
          return new Response(
            JSON.stringify({
              code: 'AIServiceError',
              message: error.message || 'Failed to generate flashcards. Please try again.'
            } as ErrorResponse),
            {
              status: statusCode >= 400 ? statusCode : 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
      }
    }

    // Determine error type and response for other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Check for specific error types
    if (errorMessage.includes('OPENROUTER_API_KEY')) {
      return new Response(
        JSON.stringify({
          code: 'ConfigurationError',
          message: 'AI service configuration error'
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (errorMessage.includes('AI service') || errorMessage.includes('timeout')) {
      return new Response(
        JSON.stringify({
          code: 'AIServiceError',
          message: 'Failed to generate flashcards. Please try again.'
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (errorMessage.includes('database') || errorMessage.includes('insert') || errorMessage.includes('update')) {
      return new Response(
        JSON.stringify({
          code: 'DatabaseError',
          message: 'Database operation failed. Please try again.'
        } as ErrorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        code: 'InternalError',
        message: 'An unexpected error occurred. Please try again.'
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Handle unsupported methods
 */
export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      code: 'MethodNotAllowed',
      message: 'GET method not supported for this endpoint'
    } as ErrorResponse),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    }
  );
};

export const PUT: APIRoute = () => {
  return new Response(
    JSON.stringify({
      code: 'MethodNotAllowed',
      message: 'PUT method not supported for this endpoint'
    } as ErrorResponse),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    }
  );
};

export const DELETE: APIRoute = () => {
  return new Response(
    JSON.stringify({
      code: 'MethodNotAllowed',
      message: 'DELETE method not supported for this endpoint'
    } as ErrorResponse),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    }
  );
};
