import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { successfulFlashcardGeneration } from '../fixtures/openrouter-responses';

/**
 * MSW (Mock Service Worker) setup for mocking HTTP requests
 * This prevents real API calls during tests (avoiding costs and network dependencies)
 */

export const handlers = [
  // Mock OpenRouter API
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json(successfulFlashcardGeneration);
  }),

  // Add more mock handlers here as needed
  // Example: Mock Supabase auth endpoints
  // http.post('http://localhost:54321/auth/v1/token', () => {
  //   return HttpResponse.json({ access_token: 'mock-token' });
  // }),
];

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});
