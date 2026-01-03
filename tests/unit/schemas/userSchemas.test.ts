import { describe, it, expect } from 'vitest';
import { changePasswordSchema, deleteAccountSchema } from '@/lib/schemas/userSchemas';

describe('User Schemas', () => {
  describe('changePasswordSchema', () => {
    it('should validate correct password change data', () => {
      const validData = {
        current_password: 'oldPassword123',
        new_password: 'newPassword123',
        new_password_confirmation: 'newPassword123',
      };

      const result = changePasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty current password', () => {
      const invalidData = {
        current_password: '',
        new_password: 'newPassword123',
        new_password_confirmation: 'newPassword123',
      };

      const result = changePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Current password is required');
      }
    });

    it('should reject new password shorter than 8 characters', () => {
      const invalidData = {
        current_password: 'oldPassword123',
        new_password: 'short',
        new_password_confirmation: 'short',
      };

      const result = changePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject when new password and confirmation do not match', () => {
      const invalidData = {
        current_password: 'oldPassword123',
        new_password: 'newPassword123',
        new_password_confirmation: 'differentPassword123',
      };

      const result = changePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((issue) => issue.path.includes('new_password_confirmation'));
        expect(error?.message).toContain('do not match');
      }
    });

    it('should reject when new password is same as current password', () => {
      const invalidData = {
        current_password: 'samePassword123',
        new_password: 'samePassword123',
        new_password_confirmation: 'samePassword123',
      };

      const result = changePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((issue) => issue.path.includes('new_password'));
        expect(error?.message).toContain('different from the current password');
      }
    });

    it('should reject empty password confirmation', () => {
      const invalidData = {
        current_password: 'oldPassword123',
        new_password: 'newPassword123',
        new_password_confirmation: '',
      };

      const result = changePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password confirmation is required');
      }
    });

    it('should accept new password with exactly 8 characters', () => {
      const validData = {
        current_password: 'oldPassword123',
        new_password: '12345678',
        new_password_confirmation: '12345678',
      };

      const result = changePasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteAccountSchema', () => {
    it('should validate correct delete account data', () => {
      const validData = {
        password: 'userPassword123',
        confirmation: true,
      };

      const result = deleteAccountSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalidData = {
        password: '',
        confirmation: true,
      };

      const result = deleteAccountSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password is required');
      }
    });

    it('should reject when confirmation is false', () => {
      const invalidData = {
        password: 'userPassword123',
        confirmation: false,
      };

      const result = deleteAccountSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Confirmation must be true');
      }
    });

    it('should reject when confirmation is missing', () => {
      const invalidData = {
        password: 'userPassword123',
      };

      const result = deleteAccountSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject when confirmation is not a boolean', () => {
      const invalidData = {
        password: 'userPassword123',
        confirmation: 'yes' as any,
      };

      const result = deleteAccountSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject when password is only whitespace', () => {
      const invalidData = {
        password: '   ',
        confirmation: true,
      };

      const result = deleteAccountSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});

