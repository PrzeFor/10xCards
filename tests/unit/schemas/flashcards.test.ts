import { describe, it, expect } from 'vitest';
import {
  flashcardSourceSchema,
  createFlashcardRequestSchema,
  createFlashcardsRequestSchema,
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
});
