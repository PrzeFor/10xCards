import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlashcardService } from '@/lib/services/flashcard.service';
import type { SupabaseClient } from '@/db/supabase.client';
import type { Database } from '@/db/database.types';
import { createTestFlashcard, resetFactoryCounters } from '../../helpers/factories';

describe('FlashcardService.listFlashcards', () => {
  let mockSupabase: any;
  let service: FlashcardService;

  beforeEach(() => {
    resetFactoryCounters();

    // Create a complete mock Supabase client with chaining
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
    } as unknown as SupabaseClient<Database>;

    service = new FlashcardService(mockSupabase);
  });

  describe('Basic functionality', () => {
    it('should return paginated flashcards with default parameters', async () => {
      const mockData = [
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
          generation_id: 'gen-1',
        }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.items[0].id).toBe('flashcard-1');
      expect(result.items[1].id).toBe('flashcard-2');
    });

    it('should return empty array when no flashcards exist', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle null data gracefully', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: null,
        count: 0,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Filtering', () => {
    it('should apply source filter when provided', async () => {
      const mockData = [
        createTestFlashcard({ source: 'ai_full' }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        filter_source: 'ai_full',
        sort_created_at: 'desc',
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('source', 'ai_full');
    });

    it('should not apply filter when filter_source is undefined', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      // eq should only be called once for user_id
      expect(mockSupabase.eq).toHaveBeenCalledTimes(1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should filter by manual source', async () => {
      const mockData = [
        createTestFlashcard({ source: 'manual', generation_id: null }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        filter_source: 'manual',
        sort_created_at: 'desc',
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('source', 'manual');
      expect(result.items[0].source).toBe('manual');
    });

    it('should filter by ai_edited source', async () => {
      const mockData = [
        createTestFlashcard({ source: 'ai_edited' }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        filter_source: 'ai_edited',
        sort_created_at: 'desc',
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('source', 'ai_edited');
      expect(result.items[0].source).toBe('ai_edited');
    });
  });

  describe('Sorting', () => {
    it('should sort descending by default', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should sort ascending when specified', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'asc',
      });

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });
  });

  describe('Pagination', () => {
    it('should apply correct range for first page', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 19);
    });

    it('should apply correct range for second page', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 20,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39);
    });

    it('should handle custom limit', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 50,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
    });

    it('should handle custom offset', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 10,
        offset: 100,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.range).toHaveBeenCalledWith(100, 109);
    });

    it('should return correct pagination metadata', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) =>
        createTestFlashcard({ id: `flashcard-${i}` })
      );

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 142, // Total count
      });

      const result = await service.listFlashcards('user-123', {
        limit: 10,
        offset: 20,
        sort_created_at: 'desc',
      });

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(142);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });
  });

  describe('User isolation', () => {
    it('should always filter by user_id', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should use the provided user_id', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('different-user-456', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'different-user-456');
    });
  });

  describe('Data transformation', () => {
    it('should transform database records to FlashcardDto format', async () => {
      const mockData = [
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
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      const flashcard = result.items[0];
      expect(flashcard).toEqual({
        id: 'test-id',
        front: 'Test Front',
        back: 'Test Back',
        source: 'manual',
        generation_id: null,
        created_at: '2025-12-30T10:00:00.000Z',
        updated_at: '2025-12-30T11:00:00.000Z',
      });
    });

    it('should correctly type cast source field', async () => {
      const mockData = [
        createTestFlashcard({ source: 'ai_full' }),
        createTestFlashcard({ source: 'ai_edited' }),
        createTestFlashcard({ source: 'manual', generation_id: null }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 3,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(result.items[0].source).toBe('ai_full');
      expect(result.items[1].source).toBe('ai_edited');
      expect(result.items[2].source).toBe('manual');
    });
  });

  describe('Error handling', () => {
    it('should throw error when database query fails', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      await expect(
        service.listFlashcards('user-123', {
          limit: 20,
          offset: 0,
          sort_created_at: 'desc',
        })
      ).rejects.toThrow('Failed to list flashcards: Database connection failed');
    });

    it('should log error when database query fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      await expect(
        service.listFlashcards('user-123', {
          limit: 20,
          offset: 0,
          sort_created_at: 'desc',
        })
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database error listing flashcards:',
        { message: 'Database error' }
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle null count gracefully', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: null,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(result.total).toBe(0);
    });
  });

  describe('Query building', () => {
    it('should request exact count', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.select).toHaveBeenCalledWith(
        'id, front, back, source, generation_id, created_at, updated_at',
        { count: 'exact' }
      );
    });

    it('should select only necessary columns', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards('user-123', {
        limit: 20,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('id'),
        expect.anything()
      );
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('front'),
        expect.anything()
      );
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('back'),
        expect.anything()
      );
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('source'),
        expect.anything()
      );
    });
  });

  describe('Complex scenarios', () => {
    it('should handle filtering, sorting, and pagination together', async () => {
      const mockData = [
        createTestFlashcard({ source: 'ai_full' }),
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 50,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 10,
        offset: 20,
        filter_source: 'ai_full',
        sort_created_at: 'asc',
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('source', 'ai_full');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(50);
    });

    it('should handle maximum limit', async () => {
      const mockData = Array.from({ length: 100 }, (_, i) =>
        createTestFlashcard({ id: `flashcard-${i}` })
      );

      mockSupabase.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1000,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 100,
        offset: 0,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 99);
      expect(result.items).toHaveLength(100);
      expect(result.total).toBe(1000);
    });

    it('should handle large offset', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 1000,
      });

      const result = await service.listFlashcards('user-123', {
        limit: 20,
        offset: 900,
        sort_created_at: 'desc',
      });

      expect(mockSupabase.range).toHaveBeenCalledWith(900, 919);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(1000);
    });
  });
});

