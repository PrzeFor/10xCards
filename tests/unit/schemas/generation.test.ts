import { describe, it, expect } from 'vitest';
import {
  createGenerationRequestSchema,
  flashcardProposalSchema,
  createGenerationResponseSchema,
} from '@/lib/schemas/generation';

describe('Generation Schemas', () => {
  describe('createGenerationRequestSchema', () => {
    it('should validate correct source_text with minimum length', () => {
      const validData = { source_text: 'a'.repeat(500) };

      const result = createGenerationRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate correct source_text with maximum length', () => {
      const validData = { source_text: 'a'.repeat(15000) };

      const result = createGenerationRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject source_text shorter than 500 characters', () => {
      const invalidData = { source_text: 'too short' };

      const result = createGenerationRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('co najmniej 500 znaków');
      }
    });

    it('should reject source_text longer than 15000 characters', () => {
      const invalidData = { source_text: 'a'.repeat(15001) };

      const result = createGenerationRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('nie może przekraczać 15,000 znaków');
      }
    });

    it('should trim whitespace from source_text', () => {
      const dataWithWhitespace = { source_text: '  ' + 'a'.repeat(500) + '  ' };

      const result = createGenerationRequestSchema.parse(dataWithWhitespace);

      expect(result.source_text).toBe('a'.repeat(500));
    });

    it('should reject empty source_text', () => {
      const invalidData = { source_text: '' };

      const result = createGenerationRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing source_text', () => {
      const invalidData = {};

      const result = createGenerationRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('flashcardProposalSchema', () => {
    it('should validate correct flashcard proposal', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        front: 'What is TypeScript?',
        back: 'TypeScript is a strongly typed programming language.',
        source: 'ai_full' as const,
      };

      const result = flashcardProposalSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate all valid source types', () => {
      const sources = ['manual', 'ai_full', 'ai_edited'] as const;

      sources.forEach((source) => {
        const validData = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          front: 'Test front',
          back: 'Test back',
          source,
        };

        const result = flashcardProposalSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        id: 'not-a-uuid',
        front: 'Test front',
        back: 'Test back',
        source: 'ai_full' as const,
      };

      const result = flashcardProposalSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject front text exceeding 1000 characters', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        front: 'a'.repeat(1001),
        back: 'Test back',
        source: 'ai_full' as const,
      };

      const result = flashcardProposalSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject back text exceeding 2000 characters', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        front: 'Test front',
        back: 'a'.repeat(2001),
        source: 'ai_full' as const,
      };

      const result = flashcardProposalSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject empty front text', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        front: '',
        back: 'Test back',
        source: 'ai_full' as const,
      };

      const result = flashcardProposalSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject invalid source value', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        front: 'Test front',
        back: 'Test back',
        source: 'invalid_source',
      };

      const result = flashcardProposalSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('createGenerationResponseSchema', () => {
    it('should validate correct generation response', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        status: 'completed' as const,
        generated_count: 5,
        source_text_length: 1000,
        flashcards_proposals: [],
      };

      const result = createGenerationResponseSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate all valid status types', () => {
      const statuses = ['pending', 'completed', 'failed'] as const;

      statuses.forEach((status) => {
        const validData = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          model: 'test-model',
          status,
          generated_count: 0,
          source_text_length: 500,
          flashcards_proposals: [],
        };

        const result = createGenerationResponseSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    it('should reject negative generated_count', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        model: 'test-model',
        status: 'completed' as const,
        generated_count: -1,
        source_text_length: 500,
        flashcards_proposals: [],
      };

      const result = createGenerationResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject source_text_length below minimum', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        model: 'test-model',
        status: 'completed' as const,
        generated_count: 0,
        source_text_length: 499,
        flashcards_proposals: [],
      };

      const result = createGenerationResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject source_text_length above maximum', () => {
      const invalidData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        model: 'test-model',
        status: 'completed' as const,
        generated_count: 0,
        source_text_length: 15001,
        flashcards_proposals: [],
      };

      const result = createGenerationResponseSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
