import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { InlineError } from './InlineError';
import { ResetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas/auth';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-redirect after successful password change
  useEffect(() => {
    if (isSuccess) {
      const isAlreadyLoggedIn = token === 'session';
      const redirectUrl = isAlreadyLoggedIn ? '/generations' : '/auth/login';
      
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name as keyof ResetPasswordFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setServerError('');

    // Validate form data
    const result = ResetPasswordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ResetPasswordFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof ResetPasswordFormData;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // If token is 'session', use the session-based endpoint
      const endpoint = token === 'session' 
        ? '/api/auth/reset-password-session'
        : '/api/auth/reset-password';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          token === 'session'
            ? { newPassword: formData.newPassword }
            : { token, newPassword: formData.newPassword }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setServerError(data.message || 'Wystąpił błąd podczas resetowania hasła');
        }
        return;
      }

      // Success
      setIsSuccess(true);
    } catch (error) {
      setServerError('Wystąpił błąd połączenia. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    // If token is 'session', user is already logged in via PKCE flow
    const isAlreadyLoggedIn = token === 'session';
    const redirectUrl = isAlreadyLoggedIn ? '/generations' : '/auth/login';
    const buttonText = isAlreadyLoggedIn ? 'Przejdź do aplikacji' : 'Przejdź do logowania';
    const message = isAlreadyLoggedIn 
      ? 'Twoje hasło zostało pomyślnie zmienione. Jesteś już zalogowany.' 
      : 'Twoje hasło zostało pomyślnie zmienione. Możesz teraz zalogować się używając nowego hasła.';

    return (
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-brand">Hasło zostało zmienione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-body text-foreground">
            {message}
          </p>
          <p className="text-caption text-muted-foreground">
            Przekierowanie za chwilę...
          </p>
          <Button onClick={() => (window.location.href = redirectUrl)} className="w-full" size="lg">
            {buttonText}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Ustaw nowe hasło</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* New Password field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nowe hasło</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Minimum 8 znaków"
                aria-invalid={!!errors.newPassword}
                aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {errors.newPassword && <InlineError id="newPassword-error" message={errors.newPassword} />}
            </div>

            {/* Confirm Password field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Powtórz nowe hasło"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <InlineError id="confirmPassword-error" message={errors.confirmPassword} />}
            </div>

            {/* Server error */}
            {serverError && <InlineError id="server-error" message={serverError} />}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? 'Resetowanie...' : 'Zmień hasło'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
