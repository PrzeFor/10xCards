import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InlineError } from './InlineError';
import type { ChangePasswordRequestDto } from '../types';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

/**
 * Formularz zmiany hasła użytkownika
 * Waliduje pola po stronie klienta i wywołuje API
 */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!currentPassword.trim()) {
      setError('Obecne hasło jest wymagane');
      return;
    }

    if (newPassword.length < 8) {
      setError('Nowe hasło musi mieć co najmniej 8 znaków');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nowe hasła nie są zgodne');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Nowe hasło musi być inne niż obecne');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: ChangePasswordRequestDto = {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      };

      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Wystąpił błąd podczas zmiany hasła');
        return;
      }

      // Success
      setSuccess('Hasło zostało pomyślnie zmienione');
      toast.success('Hasło zostało pomyślnie zmienione');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Call optional success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Wystąpił błąd połączenia. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Obecne hasło</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isSubmitting}
          placeholder="Wprowadź obecne hasło"
          aria-required="true"
          aria-describedby={error ? 'password-error' : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">Nowe hasło</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isSubmitting}
          placeholder="Minimum 8 znaków"
          aria-required="true"
          aria-describedby={error ? 'password-error' : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Potwierdź nowe hasło</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
          placeholder="Wprowadź nowe hasło ponownie"
          aria-required="true"
          aria-describedby={error ? 'password-error' : undefined}
        />
      </div>

      {error && <InlineError id="password-error" message={error} />}
      {success && (
        <div className="text-sm text-green-600 dark:text-green-400" role="alert">
          {success}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? 'Zmienianie...' : 'Zmień hasło'}
        </Button>
      </div>
    </form>
  );
}

