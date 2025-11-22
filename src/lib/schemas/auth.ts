import { z } from 'zod';

/**
 * Schema for user registration validation
 */
export const RegisterSchema = z.object({
  email: z
    .string()
    .min(1, 'Adres e-mail jest wymagany')
    .email('Nieprawidłowy format adresu e-mail')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .max(100, 'Hasło nie może przekraczać 100 znaków'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
});

/**
 * Schema for user login validation
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Adres e-mail jest wymagany')
    .email('Nieprawidłowy format adresu e-mail')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane')
});

/**
 * Schema for forgot password request validation
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Adres e-mail jest wymagany')
    .email('Nieprawidłowy format adresu e-mail')
    .trim()
    .toLowerCase()
});

/**
 * Schema for password reset validation
 */
export const ResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .max(100, 'Hasło nie może przekraczać 100 znaków'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
});

/**
 * Types inferred from schemas
 */
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type LoginFormData = z.infer<typeof LoginSchema>;
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

