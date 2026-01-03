import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '@/lib/services/userService';
import type { SupabaseClient } from '@/db/supabase.client';
import type { Database } from '@/db/database.types';

describe('UserService', () => {
  let mockSupabase: any;
  let service: UserService;

  beforeEach(() => {
    // Create a complete mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
        updateUser: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        admin: {
          deleteUser: vi.fn(),
        },
      },
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    } as unknown as SupabaseClient<Database>;

    service = new UserService(mockSupabase);
  });

  describe('getUserAccount', () => {
    it('should return user account data successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.getUserAccount('user-123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
      expect(result.updated_at).toBe('2024-01-02T00:00:00Z');
    });

    it('should throw error when user not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.getUserAccount('user-123')).rejects.toThrow('Failed to fetch user account');
    });

    it('should throw error when getUser fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      await expect(service.getUserAccount('user-123')).rejects.toThrow('Failed to fetch user account');
    });

    it('should throw error when user ID does not match', async () => {
      const mockUser = {
        id: 'different-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(service.getUserAccount('user-123')).rejects.toThrow('User ID mismatch');
    });

    it('should use created_at as updated_at when updated_at is null', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.getUserAccount('user-123');

      expect(result.updated_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.changePassword('oldPassword123', 'newPassword123');

      expect(result.message).toBe('Password changed successfully.');
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'oldPassword123',
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      });
    });

    it('should throw INVALID_CURRENT_PASSWORD when current password is wrong', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      await expect(service.changePassword('wrongPassword', 'newPassword123')).rejects.toThrow(
        'INVALID_CURRENT_PASSWORD'
      );
    });

    it('should throw error when user not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.changePassword('oldPassword123', 'newPassword123')).rejects.toThrow('User not found');
    });

    it('should throw error when updateUser fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(service.changePassword('oldPassword123', 'newPassword123')).rejects.toThrow(
        'Failed to update password'
      );
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete user account and all data successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      mockSupabase.auth.admin.deleteUser.mockResolvedValue({
        data: {},
        error: null,
      });

      // Mock from().delete().eq() chain for all tables
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      await service.deleteUserAccount('user-123', 'userPassword123');

      // Verify password was checked
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'userPassword123',
      });

      // Verify all tables were deleted from
      expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
      expect(mockSupabase.from).toHaveBeenCalledWith('flashcards');
      expect(mockSupabase.from).toHaveBeenCalledWith('generation_error_logs');
      expect(mockSupabase.from).toHaveBeenCalledWith('generations');

      // Verify user was deleted
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-123');
    });

    it('should throw INVALID_PASSWORD when password is wrong', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      await expect(service.deleteUserAccount('user-123', 'wrongPassword')).rejects.toThrow('INVALID_PASSWORD');
    });

    it('should throw error when user not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.deleteUserAccount('user-123', 'password123')).rejects.toThrow('User not found');
    });

    it('should throw error when sessions deletion fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      await expect(service.deleteUserAccount('user-123', 'password123')).rejects.toThrow(
        'Failed to delete user sessions'
      );
    });

    it('should throw error when auth account deletion fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      mockSupabase.auth.admin.deleteUser.mockResolvedValue({
        data: null,
        error: { message: 'Delete user failed' },
      });

      await expect(service.deleteUserAccount('user-123', 'password123')).rejects.toThrow(
        'Failed to delete user account from authentication system'
      );
    });
  });
});

