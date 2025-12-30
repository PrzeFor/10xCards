import { describe, it, expect } from 'vitest';
import {
  flashcardSourceSchema,
  createFlashcardRequestSchema,
  createFlashcardsRequestSchema,
  listFlashcardsQuerySchema,
} from '@/lib/schemas/flashcards';

describe('Flashcard Schemas', () => {
  describe('flashcardSourceSchema', () => {
    it('should validate all valid source types', () => {
      const validSources = ['manual', 'ai_full', 'ai_edited'] as const;

      validSources.forEach((source) => {
        const result = flashcardSourceSchema.safeParse(source);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid source type', () => {
      const invalidSource = 'invalid_source';

      const result = flashcardSourceSchema.safeParse(invalidSource);

      expect(result.success).toBe(false);
    });
  });

  describe('createFlashcardRequestSchema', () => {
    it('should validate manual flashcard without generation_id', () => {
      const validData = {
        front: 'What is JavaScript?',
        back: 'JavaScript is a programming language.',
        source: 'manual' as const,
      };

      const result = createFlashcardRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate ai_full flashcard with generation_id', () => {
      const validData = {
        front: 'What is TypeScript?',
        back: 'TypeScript is a strongly typed programming language.',
        source: 'ai_full' as const,
        generation_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createFlashcardRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate ai_edited flashcard with generation_id', () => {
      const validData = {
        front: 'What is React?',
        back: 'React is a JavaScript library for building user interfaces.',
        source: 'ai_edited' as const,
        generation_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createFlashcardRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject ai_full flashcard without generation_id', () => {
      const invalidData = {
        front: 'What is TypeScript?',
        back: 'TypeScript is a strongly typed programming language.',
        source: 'ai_full' as const,
      };

      const result = createFlashcardRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Generation ID is required');
      }
    });

    it('should reject ai_edited flashcard without generation_id', () => {
      const invalidData = {
        front: 'What is React?',
        back: 'React is a JavaScript library.',
        source: 'ai_edited' as const,
      };

      const result = createFlashcardRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Generation ID is required');
      }
    });

    it('should reject invalid UUID for generation_id', () => {
      const invalidData = {
        front: 'What is TypeScript?',
        back: 'TypeScript is a strongly typed programming language.',
        source: 'ai_full' as const,
        generation_id: 'not-a-uuid',
      };

      const result = createFlashcardRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject front text exceeding 300 characters', () => {
      const invalidData = {
        front: 'a'.repeat(301),
        back: 'Test back',
        source: 'manual' as const,
      };

      const result = createFlashcardRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('300');
      }
    });

    it('should reject back text exceeding 500 characters', () => {
      const invalidData = {
        front: 'Test front',
        back: 'a'.repeat(501),
        source: 'manual' as const,
      };

      const result = createFlashcardRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500');
      }
    });

    it('should reject empty front text', () => {
      const invalidData = {
        front: '',
        back: 'Test back',
        source: 'manual' as const,
      };

      const result = createFlashcardRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('empty');
      }
    });

    it('should reject empty back text', () => {
      const invalidData = {
        front: 'Test front',
        back: '',
        source: 'manual' as const,
      };

      const result = createFlashcardRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('empty');
      }
    });

    it('should trim front and back text', () => {
      const data = {
        front: '  Test front  ',
        back: '  Test back  ',
        source: 'manual' as const,
      };

      const result = createFlashcardRequestSchema.parse(data);

      expect(result.front).toBe('Test front');
      expect(result.back).toBe('Test back');
    });
  });

  describe('createFlashcardsRequestSchema', () => {
    it('should validate array of flashcards', () => {
      const validData = {
        flashcards: [
          {
            front: 'What is JavaScript?',
            back: 'JavaScript is a programming language.',
            source: 'manual' as const,
          },
          {
            front: 'What is TypeScript?',
            back: 'TypeScript is a strongly typed programming language.',
            source: 'manual' as const,
          },
        ],
      };

      const result = createFlashcardsRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty flashcards array', () => {
      const invalidData = {
        flashcards: [],
      };

      const result = createFlashcardsRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one');
      }
    });

    it('should reject more than 100 flashcards', () => {
      const flashcards = Array.from({ length: 101 }, (_, i) => ({
        front: `Front ${i}`,
        back: `Back ${i}`,
        source: 'manual' as const,
      }));

      const invalidData = { flashcards };

      const result = createFlashcardsRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100');
      }
    });

    it('should validate exactly 100 flashcards', () => {
      const flashcards = Array.from({ length: 100 }, (_, i) => ({
        front: `Front ${i}`,
        back: `Back ${i}`,
        source: 'manual' as const,
      }));

      const validData = { flashcards };

      const result = createFlashcardsRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid flashcard in array', () => {
      const invalidData = {
        flashcards: [
          {
            front: 'Valid front',
            back: 'Valid back',
            source: 'manual' as const,
          },
          {
            front: '', // Invalid: empty
            back: 'Valid back',
            source: 'manual' as const,
          },
        ],
      };

      const result = createFlashcardsRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('listFlashcardsQuerySchema', () => {
    it('should validate with default values', () => {
      const data = {};

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.sort_created_at).toBe('desc');
      expect(result.filter_source).toBeUndefined();
    });

    it('should validate custom limit', () => {
      const data = {
        limit: '50',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0); // Should use default
    });

    it('should validate custom offset', () => {
      const data = {
        offset: '100',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.offset).toBe(100);
      expect(result.limit).toBe(20); // Should use default
    });

    it('should coerce string to number for limit', () => {
      const data = {
        limit: '25',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.limit).toBe(25);
      expect(typeof result.limit).toBe('number');
    });

    it('should coerce string to number for offset', () => {
      const data = {
        offset: '50',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.offset).toBe(50);
      expect(typeof result.offset).toBe('number');
    });

    it('should validate filter_source as manual', () => {
      const data = {
        filter_source: 'manual',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.filter_source).toBe('manual');
    });

    it('should validate filter_source as ai_full', () => {
      const data = {
        filter_source: 'ai_full',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.filter_source).toBe('ai_full');
    });

    it('should validate filter_source as ai_edited', () => {
      const data = {
        filter_source: 'ai_edited',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.filter_source).toBe('ai_edited');
    });

    it('should validate sort_created_at as asc', () => {
      const data = {
        sort_created_at: 'asc',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.sort_created_at).toBe('asc');
    });

    it('should validate sort_created_at as desc', () => {
      const data = {
        sort_created_at: 'desc',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.sort_created_at).toBe('desc');
    });

    it('should validate all parameters together', () => {
      const data = {
        limit: '10',
        offset: '20',
        filter_source: 'ai_full',
        sort_created_at: 'asc',
      };

      const result = listFlashcardsQuerySchema.parse(data);

      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
      expect(result.filter_source).toBe('ai_full');
      expect(result.sort_created_at).toBe('asc');
    });

    it('should reject limit less than 1', () => {
      const data = {
        limit: '0',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 1');
      }
    });

    it('should reject limit greater than 100', () => {
      const data = {
        limit: '101',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 100');
      }
    });

    it('should reject negative offset', () => {
      const data = {
        offset: '-1',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('non-negative');
      }
    });

    it('should reject invalid filter_source', () => {
      const data = {
        filter_source: 'invalid',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject invalid sort_created_at', () => {
      const data = {
        sort_created_at: 'invalid',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject non-integer limit', () => {
      const data = {
        limit: '10.5',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });

    it('should reject non-integer offset', () => {
      const data = {
        offset: '20.7',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });

    it('should accept limit at boundary (1)', () => {
      const data = {
        limit: '1',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it('should accept limit at boundary (100)', () => {
      const data = {
        limit: '100',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('should accept offset at boundary (0)', () => {
      const data = {
        offset: '0',
      };

      const result = listFlashcardsQuerySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
      }
    });
  });
});
