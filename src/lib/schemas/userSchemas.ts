import { z } from 'zod';

/**
 * Schema for changing user password
 * Validates current password, new password, and confirmation
 */
export const changePasswordSchema = z.object({
  current_password: z.string().trim().min(1, 'Current password is required'),
  new_password: z.string().trim().min(8, 'New password must be at least 8 characters'),
  new_password_confirmation: z.string().trim().min(1, 'Password confirmation is required'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: 'New password and confirmation do not match',
  path: ['new_password_confirmation'],
}).refine((data) => data.new_password !== data.current_password, {
  message: 'New password must be different from the current password',
  path: ['new_password'],
});

/**
 * Schema for deleting user account
 * Requires password and explicit confirmation
 */
export const deleteAccountSchema = z.object({
  password: z.string().trim().min(1, 'Password is required'),
  confirmation: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation must be true to delete account' }),
  }),
});

/**
 * Types inferred from schemas
 */
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type DeleteAccountData = z.infer<typeof deleteAccountSchema>;

