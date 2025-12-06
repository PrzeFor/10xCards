/**
 * Mock responses from OpenRouter API
 * Used with MSW (Mock Service Worker) to simulate AI responses
 * NEVER use real API in tests to avoid costs!
 */

export const successfulFlashcardGeneration = {
  id: 'gen-mock-123',
  model: 'meta-llama/llama-3.1-8b-instruct:free',
  created: Date.now(),
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify([
          {
            front: 'What is TypeScript?',
            back: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
          },
          {
            front: 'What is Astro?',
            back: 'Astro is a modern web framework for building fast, content-focused websites.',
          },
          {
            front: 'What is Vitest?',
            back: 'Vitest is a blazing fast unit test framework powered by Vite.',
          },
        ]),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 150,
    completion_tokens: 200,
    total_tokens: 350,
  },
};

export const emptyFlashcardGeneration = {
  id: 'gen-mock-empty',
  model: 'meta-llama/llama-3.1-8b-instruct:free',
  created: Date.now(),
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify([]),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 50,
    completion_tokens: 10,
    total_tokens: 60,
  },
};

export const invalidJsonGeneration = {
  id: 'gen-mock-invalid',
  model: 'meta-llama/llama-3.1-8b-instruct:free',
  created: Date.now(),
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'This is not valid JSON',
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 50,
    completion_tokens: 10,
    total_tokens: 60,
  },
};

export const rateLimitError = {
  error: {
    code: 429,
    message: 'Rate limit exceeded. Please try again later.',
  },
};

export const authenticationError = {
  error: {
    code: 401,
    message: 'Invalid API key',
  },
};

export const serverError = {
  error: {
    code: 500,
    message: 'Internal server error',
  },
};
