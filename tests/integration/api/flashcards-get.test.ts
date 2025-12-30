import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/pages/api/flashcards';
import { createTestFlashcard, createTestUser, resetFactoryCounters } from '../../helpers/factories';
import type { APIContext } from 'astro';

describe('GET /api/flashcards', () => {
  let mockLocals: any;
  let mockRequest: Request;
  let mockSupabase: any;

  beforeEach(() => {
    resetFactoryCounters();

    // Mock Supabase client with chaining
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    // Mock authenticated user
    const testUser = createTestUser();

    mockLocals = {
      supabase: mockSupabase,
      user: testUser,
    };

    // Mock request with base URL
    mockRequest = new Request('http://localhost:4321/api/flashcards');
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockLocals.user = null;

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        code: 'Unauthorized',
        message: 'Authentication required',
      });
    });

    it('should return 500 when Supabase client is not available', async () => {
      mockLocals.supabase = null;

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        code: 'InternalServerError',
        message: 'Database connection not available',
      });
    });
  });

  describe('Success responses', () => {
    it('should return 200 with empty list when no flashcards exist', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      });
    });

    it('should return 200 with flashcards list', async () => {
      const mockFlashcards = [
        createTestFlashcard({
          id: 'flashcard-1',
          front: 'Front 1',
          back: 'Back 1',
          source: 'manual',
          generation_id: null,
        }),
        createTestFlashcard({
          id: 'flashcard-2',
          front: 'Front 2',
          back: 'Back 2',
          source: 'ai_full',
        }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockFlashcards,
        error: null,
        count: 2,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.items[0].id).toBe('flashcard-1');
      expect(data.items[1].id).toBe('flashcard-2');
    });

    it('should include correct response headers', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Query parameter validation', () => {
    it('should use default values when no parameters provided', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 19); // limit: 20, offset: 0
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false }); // sort: desc
    });

    it('should accept valid limit parameter', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new Request('http://localhost:4321/api/flashcards?limit=50');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
    });

    it('should accept valid offset parameter', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new Request('http://localhost:4321/api/flashcards?offset=20');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39);
    });

    it('should accept valid filter[source] parameter', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new Request('http://localhost:4321/api/flashcards?filter[source]=ai_full');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(mockSupabase.eq).toHaveBeenCalledWith('source', 'ai_full');
    });

    it('should accept valid sort[created_at] parameter', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new Request('http://localhost:4321/api/flashcards?sort[created_at]=asc');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('should accept combination of parameters', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new Request(
        'http://localhost:4321/api/flashcards?limit=10&offset=20&filter[source]=manual&sort[created_at]=asc'
      );
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(mockSupabase.eq).toHaveBeenCalledWith('source', 'manual');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('Query parameter validation errors', () => {
    it('should return 400 when limit is less than 1', async () => {
      const request = new Request('http://localhost:4321/api/flashcards?limit=0');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('ValidationError');
      expect(data.message).toContain('limit');
    });

    it('should return 400 when limit exceeds 100', async () => {
      const request = new Request('http://localhost:4321/api/flashcards?limit=101');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('ValidationError');
      expect(data.message).toContain('limit');
    });

    it('should return 400 when offset is negative', async () => {
      const request = new Request('http://localhost:4321/api/flashcards?offset=-1');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('ValidationError');
      expect(data.message).toContain('offset');
    });

    it('should return 400 when filter[source] is invalid', async () => {
      const request = new Request('http://localhost:4321/api/flashcards?filter[source]=invalid');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('ValidationError');
      expect(data.message).toContain('filter_source');
    });

    it('should return 400 when sort[created_at] is invalid', async () => {
      const request = new Request('http://localhost:4321/api/flashcards?sort[created_at]=invalid');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('ValidationError');
      expect(data.message).toContain('sort_created_at');
    });

    it('should return 400 when limit is not a number', async () => {
      const request = new Request('http://localhost:4321/api/flashcards?limit=abc');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('ValidationError');
    });

    it('should return 400 when offset is not a number', async () => {
      const request = new Request('http://localhost:4321/api/flashcards?offset=xyz');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('ValidationError');
    });
  });

  describe('Pagination', () => {
    it('should return correct pagination metadata', async () => {
      const mockFlashcards = Array.from({ length: 10 }, (_, i) =>
        createTestFlashcard({ id: `flashcard-${i}` })
      );

      mockSupabase.range.mockResolvedValue({
        data: mockFlashcards,
        error: null,
        count: 142,
      });

      const request = new Request('http://localhost:4321/api/flashcards?limit=10&offset=20');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(10);
      expect(data.total).toBe(142);
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(20);
    });

    it('should handle maximum limit of 100', async () => {
      const mockFlashcards = Array.from({ length: 100 }, (_, i) =>
        createTestFlashcard({ id: `flashcard-${i}` })
      );

      mockSupabase.range.mockResolvedValue({
        data: mockFlashcards,
        error: null,
        count: 1000,
      });

      const request = new Request('http://localhost:4321/api/flashcards?limit=100');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(100);
      expect(data.limit).toBe(100);
    });
  });

  describe('Filtering', () => {
    it('should filter by manual source', async () => {
      const mockFlashcards = [
        createTestFlashcard({ source: 'manual', generation_id: null }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockFlashcards,
        error: null,
        count: 1,
      });

      const request = new Request('http://localhost:4321/api/flashcards?filter[source]=manual');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items[0].source).toBe('manual');
      expect(mockSupabase.eq).toHaveBeenCalledWith('source', 'manual');
    });

    it('should filter by ai_full source', async () => {
      const mockFlashcards = [
        createTestFlashcard({ source: 'ai_full' }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockFlashcards,
        error: null,
        count: 1,
      });

      const request = new Request('http://localhost:4321/api/flashcards?filter[source]=ai_full');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items[0].source).toBe('ai_full');
    });

    it('should filter by ai_edited source', async () => {
      const mockFlashcards = [
        createTestFlashcard({ source: 'ai_edited' }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockFlashcards,
        error: null,
        count: 1,
      });

      const request = new Request('http://localhost:4321/api/flashcards?filter[source]=ai_edited');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items[0].source).toBe('ai_edited');
    });
  });

  describe('Sorting', () => {
    it('should sort descending by default', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should sort ascending when specified', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const request = new Request('http://localhost:4321/api/flashcards?sort[created_at]=asc');
      const context = {
        request,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        code: 'InternalServerError',
        message: 'An unexpected error occurred',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should log errors with user context', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      await GET(context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in GET /api/flashcards:',
        expect.objectContaining({
          userId: mockLocals.user.id,
        })
      );

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response structure', () => {
    it('should return correct response structure', async () => {
      const mockFlashcards = [
        createTestFlashcard({
          id: 'test-id',
          front: 'Test Front',
          back: 'Test Back',
          source: 'manual',
          generation_id: null,
          created_at: '2025-12-30T10:00:00.000Z',
          updated_at: '2025-12-30T11:00:00.000Z',
        }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockFlashcards,
        error: null,
        count: 1,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();

      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('offset');
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.total).toBe('number');
      expect(typeof data.limit).toBe('number');
      expect(typeof data.offset).toBe('number');
    });

    it('should return flashcards with correct structure', async () => {
      const mockFlashcards = [
        createTestFlashcard({
          id: 'test-id',
          front: 'Test Front',
          back: 'Test Back',
          source: 'manual',
          generation_id: null,
          created_at: '2025-12-30T10:00:00.000Z',
          updated_at: '2025-12-30T11:00:00.000Z',
        }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockFlashcards,
        error: null,
        count: 1,
      });

      const context = {
        request: mockRequest,
        locals: mockLocals,
      } as unknown as APIContext;

      const response = await GET(context);
      const data = await response.json();
      const flashcard = data.items[0];

      expect(flashcard).toHaveProperty('id');
      expect(flashcard).toHaveProperty('front');
      expect(flashcard).toHaveProperty('back');
      expect(flashcard).toHaveProperty('source');
      expect(flashcard).toHaveProperty('generation_id');
      expect(flashcard).toHaveProperty('created_at');
      expect(flashcard).toHaveProperty('updated_at');
    });
  });
});

