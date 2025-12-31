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

describe('FlashcardService.updateFlashcard', () => {
  let mockSupabase: any;
  let service: FlashcardService;
  const userId = 'user-123';
  const cardId = 'card-456';

  beforeEach(() => {
    resetFactoryCounters();

    // Create a complete mock Supabase client with chaining
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    } as unknown as SupabaseClient<Database>;

    service = new FlashcardService(mockSupabase);
  });

  describe('Successful update', () => {
    it('should successfully update a flashcard', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        front: 'Old front',
        back: 'Old back',
        source: 'manual',
        generation_id: null,
      });

      const updatedFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        front: 'New front',
        back: 'New back',
        source: 'manual',
        generation_id: null,
        updated_at: new Date().toISOString(),
      });

      // Mock getFlashcard (select query)
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update query
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      const result = await service.updateFlashcard(userId, cardId, {
        front: 'New front',
        back: 'New back',
        source: 'manual',
      });

      expect(result).toEqual({
        id: cardId,
        front: 'New front',
        back: 'New back',
        source: 'manual',
        generation_id: null,
        created_at: updatedFlashcard.created_at,
        updated_at: updatedFlashcard.updated_at,
      });

      // Verify update was called
      expect(mockSupabase.update).toHaveBeenCalledWith({
        front: 'New front',
        back: 'New back',
        source: 'manual',
        generation_id: null,
        updated_at: expect.any(String),
      });
    });

    it('should update flashcard with AI source and generation_id', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        source: 'manual',
        generation_id: null,
      });

      const updatedFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        source: 'ai_full',
        generation_id: 'gen-123',
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock generation validation
      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: userId },
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      const result = await service.updateFlashcard(userId, cardId, {
        front: 'AI front',
        back: 'AI back',
        source: 'ai_full',
        generation_id: 'gen-123',
      });

      expect(result.source).toBe('ai_full');
      expect(result.generation_id).toBe('gen-123');
    });

    it('should update flashcard to ai_edited source', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        source: 'ai_full',
        generation_id: 'gen-123',
      });

      const updatedFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        front: 'Edited front',
        back: 'Edited back',
        source: 'ai_edited',
        generation_id: 'gen-123',
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock generation validation
      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: userId },
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      // Mock generation fetch for updateGenerationStatsAfterEdit
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          accepted_unedited_count: 5,
          accepted_edited_count: 2,
        },
        error: null,
      });

      const result = await service.updateFlashcard(userId, cardId, {
        front: 'Edited front',
        back: 'Edited back',
        source: 'ai_edited',
        generation_id: 'gen-123',
      });

      expect(result.source).toBe('ai_edited');
      expect(result.front).toBe('Edited front');
    });

    it('should clear generation_id when source is manual', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        source: 'ai_full',
        generation_id: 'gen-123',
      });

      const updatedFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        source: 'manual',
        generation_id: null,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      const result = await service.updateFlashcard(userId, cardId, {
        front: 'Manual front',
        back: 'Manual back',
        source: 'manual',
      });

      expect(result.source).toBe('manual');
      expect(result.generation_id).toBeNull();
      
      // Verify generation_id was set to null in update
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          generation_id: null,
        })
      );
    });
  });

  describe('Flashcard not found', () => {
    it('should throw error if flashcard does not exist', async () => {
      // Mock getFlashcard returning null
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      await expect(
        service.updateFlashcard(userId, cardId, {
          front: 'New front',
          back: 'New back',
          source: 'manual',
        })
      ).rejects.toThrow('Flashcard not found');
    });

    it('should throw error if flashcard belongs to another user', async () => {
      // When querying with user_id filter, getFlashcard returns null
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      await expect(
        service.updateFlashcard(userId, 'other-users-card', {
          front: 'New front',
          back: 'New back',
          source: 'manual',
        })
      ).rejects.toThrow('Flashcard not found');
    });
  });

  describe('Generation validation', () => {
    it('should throw error if generation_id does not exist', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock generation not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      await expect(
        service.updateFlashcard(userId, cardId, {
          front: 'AI front',
          back: 'AI back',
          source: 'ai_full',
          generation_id: 'non-existent-gen',
        })
      ).rejects.toThrow('Generation not found');
    });

    it('should throw error if generation belongs to another user', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock generation belonging to another user
      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: 'other-user-789' },
        error: null,
      });

      await expect(
        service.updateFlashcard(userId, cardId, {
          front: 'AI front',
          back: 'AI back',
          source: 'ai_full',
          generation_id: 'other-users-gen',
        })
      ).rejects.toThrow('Generation forbidden');
    });

    it('should not validate generation_id when source is manual', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      const updatedFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        source: 'manual',
        generation_id: null,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update (no generation validation should happen)
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      await service.updateFlashcard(userId, cardId, {
        front: 'Manual front',
        back: 'Manual back',
        source: 'manual',
      });

      // Verify generation validation query was NOT made
      // single should be called only twice: getFlashcard and update
      expect(mockSupabase.single).toHaveBeenCalledTimes(2);
    });
  });

  describe('Database errors', () => {
    it('should throw error when update fails', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update failure
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(
        service.updateFlashcard(userId, cardId, {
          front: 'New front',
          back: 'New back',
          source: 'manual',
        })
      ).rejects.toThrow('Failed to update flashcard: Database connection failed');
    });

    it('should log error when generation validation fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock generation query error (not PGRST116)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST301', message: 'Database error' },
      });

      await expect(
        service.updateFlashcard(userId, cardId, {
          front: 'AI front',
          back: 'AI back',
          source: 'ai_full',
          generation_id: 'gen-123',
        })
      ).rejects.toThrow('Failed to validate generation');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching generation:',
        expect.objectContaining({ code: 'PGRST301' })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw error when update returns no data', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update returning null data
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(
        service.updateFlashcard(userId, cardId, {
          front: 'New front',
          back: 'New back',
          source: 'manual',
        })
      ).rejects.toThrow('Flashcard not found after update');
    });
  });

  describe('Query construction', () => {
    it('should include user_id in update query for double-check', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      const updatedFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      await service.updateFlashcard(userId, cardId, {
        front: 'New front',
        back: 'New back',
        source: 'manual',
      });

      // Verify eq was called with both id and user_id
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', cardId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should select correct fields after update', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      const updatedFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      await service.updateFlashcard(userId, cardId, {
        front: 'New front',
        back: 'New back',
        source: 'manual',
      });

      // Verify select includes all DTO fields
      expect(mockSupabase.select).toHaveBeenCalledWith(
        'id, front, back, source, generation_id, created_at, updated_at'
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle updating with same values', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        front: 'Same front',
        back: 'Same back',
        source: 'manual',
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      const result = await service.updateFlashcard(userId, cardId, {
        front: 'Same front',
        back: 'Same back',
        source: 'manual',
      });

      expect(result.front).toBe('Same front');
      expect(result.back).toBe('Same back');
    });

    it('should handle updating with maximum length content', async () => {
      const existingFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
      });

      const updatedFlashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        front: 'A'.repeat(300),
        back: 'B'.repeat(500),
      });

      // Mock getFlashcard
      mockSupabase.single.mockResolvedValueOnce({
        data: existingFlashcard,
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedFlashcard,
        error: null,
      });

      const result = await service.updateFlashcard(userId, cardId, {
        front: 'A'.repeat(300),
        back: 'B'.repeat(500),
        source: 'manual',
      });

      expect(result.front.length).toBe(300);
      expect(result.back.length).toBe(500);
    });
  });
});

describe('FlashcardService.deleteFlashcard', () => {
  let mockSupabase: any;
  let mockSelectChain: any;
  let mockDeleteChain: any;
  let mockUpdateChain: any;
  let service: FlashcardService;
  const userId = 'user-123';
  const cardId = 'card-456';
  const generationId = 'gen-789';

  beforeEach(() => {
    resetFactoryCounters();

    // Create mock chains for different query types
    mockSelectChain = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    // Delete chain needs to support chaining .eq() twice: .eq('id').eq('user_id')
    // The last .eq() call should return a promise-like object with error
    mockDeleteChain = {
      eq: vi.fn(function(this: any) {
        // Return this for chaining, but the last call will be mocked differently in tests
        return this;
      }),
    };

    mockUpdateChain = {
      eq: vi.fn(),
    };

    // Create mock Supabase client that returns appropriate chains
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn(() => mockSelectChain),
      delete: vi.fn(() => mockDeleteChain),
      update: vi.fn(() => mockUpdateChain),
    } as unknown as SupabaseClient<Database>;

    service = new FlashcardService(mockSupabase);
  });

  describe('Successful deletion', () => {
    it('should delete flashcard without generation_id', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: null,
        source: 'manual',
      });

      // Mock select query (fetch flashcard)
      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      // Mock delete operation - .eq() is called twice, so we need to chain properly
      // First .eq('id', cardId) returns mockDeleteChain
      // Second .eq('user_id', userId) returns the final result
      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain) // First .eq() returns chain for second .eq()
        .mockResolvedValueOnce({ error: null }); // Second .eq() returns result

      await service.deleteFlashcard(userId, cardId);

      // Verify select was called
      expect(mockSupabase.from).toHaveBeenCalledWith('flashcards');
      expect(mockSupabase.select).toHaveBeenCalledWith('id, generation_id, source, user_id');
      
      // Verify delete was called
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('should delete flashcard and update generation stats for ai_full source', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: generationId,
        source: 'ai_full',
      });

      const generation = {
        generated_count: 5,
        accepted_unedited_count: 3,
        accepted_edited_count: 1,
      };

      // Mock select query (fetch flashcard) - 1st single() call
      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      // Mock delete operation - .eq() called twice
      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      // Mock generation fetch - 2nd single() call (reuse mockSelectChain)
      mockSelectChain.single.mockResolvedValueOnce({
        data: generation,
        error: null,
      });

      // Mock generation update
      mockUpdateChain.eq.mockResolvedValueOnce({
        error: null,
      });

      await service.deleteFlashcard(userId, cardId);

      // Verify update was called with correct values
      expect(mockSupabase.update).toHaveBeenCalledWith({
        generated_count: 4,
        accepted_unedited_count: 2,
      });
    });

    it('should delete flashcard and update generation stats for ai_edited source', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: generationId,
        source: 'ai_edited',
      });

      const generation = {
        generated_count: 5,
        accepted_unedited_count: 2,
        accepted_edited_count: 2,
      };

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      mockSelectChain.single.mockResolvedValueOnce({
        data: generation,
        error: null,
      });

      mockUpdateChain.eq.mockResolvedValueOnce({
        error: null,
      });

      await service.deleteFlashcard(userId, cardId);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        generated_count: 4,
        accepted_edited_count: 1,
      });
    });

    it('should handle deletion when generation no longer exists', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: generationId,
        source: 'ai_full',
      });

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      mockSelectChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.deleteFlashcard(userId, cardId)).resolves.toBeUndefined();
    });

    it('should prevent counters from going negative', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: generationId,
        source: 'ai_full',
      });

      const generation = {
        generated_count: 1,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
      };

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      mockSelectChain.single.mockResolvedValueOnce({
        data: generation,
        error: null,
      });

      mockUpdateChain.eq.mockResolvedValueOnce({
        error: null,
      });

      await service.deleteFlashcard(userId, cardId);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        generated_count: 0,
        accepted_unedited_count: 0,
      });
    });
  });

  describe('Not found errors', () => {
    it('should throw NOT_FOUND error when flashcard does not exist', async () => {
      mockSelectChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      const error = await service.deleteFlashcard(userId, cardId).catch(e => e);
      
      expect(error.message).toBe('Flashcard not found');
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('Forbidden errors', () => {
    it('should throw FORBIDDEN error when user does not own flashcard', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: 'other-user-789',
        generation_id: null,
        source: 'manual',
      });

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      const error = await service.deleteFlashcard(userId, cardId).catch(e => e);
      
      expect(error.message).toBe("You don't have permission to delete this flashcard");
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('Database errors', () => {
    it('should throw error when delete operation fails', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: null,
        source: 'manual',
      });

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({
          error: { message: 'Database connection failed' },
        });

      await expect(service.deleteFlashcard(userId, cardId)).rejects.toThrow();
    });

    it('should throw error when fetch operation fails with non-PGRST116 code', async () => {
      mockSelectChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST301', message: 'Database error' },
      });

      await expect(service.deleteFlashcard(userId, cardId)).rejects.toThrow();
    });

    it('should log but not throw when generation stats update fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: generationId,
        source: 'ai_full',
      });

      const generation = {
        generated_count: 5,
        accepted_unedited_count: 3,
        accepted_edited_count: 1,
      };

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      mockSelectChain.single.mockResolvedValueOnce({
        data: generation,
        error: null,
      });

      mockUpdateChain.eq.mockResolvedValueOnce({
        error: { message: 'Update failed' },
      });

      await expect(service.deleteFlashcard(userId, cardId)).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update generation stats:',
        expect.objectContaining({ message: 'Update failed' })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Query construction', () => {
    it('should include user_id in delete query for double-check', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: null,
        source: 'manual',
      });

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      await service.deleteFlashcard(userId, cardId);

      expect(mockDeleteChain.eq).toHaveBeenCalledWith('id', cardId);
      expect(mockDeleteChain.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should select correct fields when fetching flashcard', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: null,
        source: 'manual',
      });

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      await service.deleteFlashcard(userId, cardId);

      expect(mockSupabase.select).toHaveBeenCalledWith('id, generation_id, source, user_id');
    });
  });

  describe('Edge cases', () => {
    it('should handle deletion of flashcard with null generation_id', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: null,
        source: 'manual',
      });

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      await expect(service.deleteFlashcard(userId, cardId)).resolves.toBeUndefined();

      expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it('should handle manual source with generation_id', async () => {
      const flashcard = createTestFlashcard({
        id: cardId,
        user_id: userId,
        generation_id: generationId,
        source: 'manual',
      });

      const generation = {
        generated_count: 5,
        accepted_unedited_count: 3,
        accepted_edited_count: 1,
      };

      mockSelectChain.single.mockResolvedValueOnce({
        data: flashcard,
        error: null,
      });

      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      mockSelectChain.single.mockResolvedValueOnce({
        data: generation,
        error: null,
      });

      mockUpdateChain.eq.mockResolvedValueOnce({
        error: null,
      });

      await service.deleteFlashcard(userId, cardId);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        generated_count: 4,
      });
    });
  });
});

