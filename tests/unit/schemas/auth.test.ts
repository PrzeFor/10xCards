import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  RegisterApiSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@/lib/schemas/auth';

describe('Auth Schemas', () => {
  describe('RegisterSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const result = RegisterSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should convert email to lowercase and trim', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const result = RegisterSchema.parse(data);

      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const result = RegisterSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('format');
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Pass1!',
        confirmPassword: 'Pass1!',
      };

      const result = RegisterSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('8');
      }
    });

    it('should reject password longer than 100 characters', () => {
      const longPassword = 'a'.repeat(101);
      const invalidData = {
        email: 'test@example.com',
        password: longPassword,
        confirmPassword: longPassword,
      };

      const result = RegisterSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100');
      }
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      };

      const result = RegisterSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('identyczne');
      }
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const result = RegisterSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('RegisterApiSchema', () => {
    it('should validate correct API registration data without confirmPassword', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = RegisterApiSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should apply same email and password validation rules', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short',
      };

      const result = RegisterApiSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = LoginSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'Password123!',
      };

      const result = LoginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = LoginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should convert email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
      };

      const result = LoginSchema.parse(data);

      expect(result.email).toBe('test@example.com');
    });
  });

  describe('ForgotPasswordSchema', () => {
    it('should validate correct forgot password data', () => {
      const validData = {
        email: 'test@example.com',
      };

      const result = ForgotPasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
      };

      const result = ForgotPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
      };

      const result = ForgotPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('ResetPasswordSchema', () => {
    it('should validate correct reset password data', () => {
      const validData = {
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };

      const result = ResetPasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        newPassword: 'Pass1!',
        confirmPassword: 'Pass1!',
      };

      const result = ResetPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      };

      const result = ResetPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('identyczne');
      }
    });

    it('should reject password longer than 100 characters', () => {
      const longPassword = 'a'.repeat(101);
      const invalidData = {
        newPassword: longPassword,
        confirmPassword: longPassword,
      };

      const result = ResetPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
