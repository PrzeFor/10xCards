import type { SupabaseClient } from '../../db/supabase.client';
import type { Database } from '../../db/database.types';
import type { 
  GetUserAccountResponseDto,
  ChangePasswordResponseDto
} from '../../types';
import type { UserStats } from '../hooks/useUserSettings';

/**
 * Service for handling user account operations
 */
export class UserService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Retrieves user account information
   * @param userId - The authenticated user ID
   * @returns User account data
   * @throws Error if user not found or fetch fails
   */
  async getUserAccount(userId: string): Promise<GetUserAccountResponseDto> {
    const { data, error } = await this.supabase.auth.getUser();
    
    if (error || !data.user) {
      throw new Error('Failed to fetch user account');
    }

    // Verify the user ID matches
    if (data.user.id !== userId) {
      throw new Error('User ID mismatch');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at || data.user.created_at,
    };
  }

  /**
   * Changes user password
   * @param currentPassword - The current password for verification
   * @param newPassword - The new password to set
   * @returns Success message
   * @throws Error with 'INVALID_CURRENT_PASSWORD' if current password is wrong
   * @throws Error for other failures
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResponseDto> {
    // First, verify the current password by getting user and attempting re-authentication
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user?.email) {
      throw new Error('User not found');
    }

    // Verify current password via sign in attempt
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: user.user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }

    // Now update the password
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('[UserService] Failed to update password:', updateError);
      throw new Error('Failed to update password');
    }

    return {
      message: 'Password changed successfully.',
    };
  }

  /**
   * Deletes user account and all associated data (GDPR compliant)
   * @param userId - The authenticated user ID
   * @param password - User's password for verification
   * @throws Error with 'INVALID_PASSWORD' if password is wrong
   * @throws Error for other failures
   */
  async deleteUserAccount(userId: string, password: string): Promise<void> {
    // Verify password by attempting to re-authenticate
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user?.email) {
      throw new Error('User not found');
    }

    // Verify password via sign in attempt
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: user.user.email,
      password: password,
    });

    if (signInError) {
      throw new Error('INVALID_PASSWORD');
    }

    // Delete all user data in correct order (respecting foreign key constraints)
    
    // 1. Delete sessions (references flashcards via flashcard_ids array)
    const { error: sessionsError } = await this.supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionsError) {
      console.error('[UserService] Failed to delete sessions:', sessionsError);
      throw new Error('Failed to delete user sessions');
    }

    // 2. Delete flashcards (references generations)
    const { error: flashcardsError } = await this.supabase
      .from('flashcards')
      .delete()
      .eq('user_id', userId);

    if (flashcardsError) {
      console.error('[UserService] Failed to delete flashcards:', flashcardsError);
      throw new Error('Failed to delete user flashcards');
    }

    // 3. Delete generation error logs (references generations)
    const { error: errorLogsError } = await this.supabase
      .from('generation_error_logs')
      .delete()
      .eq('user_id', userId);

    if (errorLogsError) {
      console.error('[UserService] Failed to delete error logs:', errorLogsError);
      throw new Error('Failed to delete user error logs');
    }

    // 4. Delete generations
    const { error: generationsError } = await this.supabase
      .from('generations')
      .delete()
      .eq('user_id', userId);

    if (generationsError) {
      console.error('[UserService] Failed to delete generations:', generationsError);
      throw new Error('Failed to delete user generations');
    }

    // 5. Finally, delete the user account from Supabase Auth
    // Note: This requires admin privileges
    const { error: deleteError } = await this.supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('[UserService] Failed to delete user account:', deleteError);
      throw new Error('Failed to delete user account from authentication system');
    }

    // Audit log
    console.info(`[UserService] Account deletion completed for user: ${userId}`);
  }

  /**
   * Retrieves user statistics (total flashcards, sessions, generations)
   * @param userId - The authenticated user ID
   * @returns User statistics
   * @throws Error if fetch fails
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Count total flashcards
      const { count: flashcardsCount, error: flashcardsError } = await this.supabase
        .from('flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (flashcardsError) {
        throw new Error(`Failed to count flashcards: ${flashcardsError.message}`);
      }

      // Count total sessions (completed only)
      const { count: sessionsCount, error: sessionsError } = await this.supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (sessionsError) {
        throw new Error(`Failed to count sessions: ${sessionsError.message}`);
      }

      // Count total generations (completed only)
      const { count: generationsCount, error: generationsError } = await this.supabase
        .from('generations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (generationsError) {
        throw new Error(`Failed to count generations: ${generationsError.message}`);
      }

      return {
        totalFlashcards: flashcardsCount || 0,
        totalSessions: sessionsCount || 0,
        totalGenerations: generationsCount || 0,
      };
    } catch (error) {
      console.error('[UserService] Failed to fetch user stats:', error);
      throw error;
    }
  }
}

