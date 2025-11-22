import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { InlineError } from './InlineError';
import { RegisterSchema, type RegisterFormData } from '@/lib/schemas/auth';

export function RegistrationForm() {
  const [serverError, setServerError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (formData: RegisterFormData) => {
    // Clear previous server errors
    setServerError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || 'Wystąpił błąd podczas rejestracji');
        return;
      }

      // Success - check if email confirmation is required
      if (data.requiresEmailConfirmation) {
        // Show email confirmation message
        setSuccessMessage(data.message);
        setRequiresEmailConfirmation(true);
      } else {
        // If no email confirmation needed, redirect immediately
        window.location.href = '/generations';
      }
    } catch (error) {
      setServerError('Wystąpił błąd połączenia. Spróbuj ponownie.');
    }
  };

  // Show success message if email confirmation is required
  if (requiresEmailConfirmation && successMessage) {
    return (
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-brand">Sprawdź swoją skrzynkę e-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-300">
                {successMessage}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Po kliknięciu w link aktywacyjny będziesz mógł się zalogować i korzystać z aplikacji.
            </p>
          </div>

          <Button 
            onClick={() => window.location.href = '/auth/login'}
            className="w-full"
            size="lg"
          >
            Przejdź do logowania
          </Button>

          <p className="text-center text-caption text-muted-foreground">
            Nie otrzymałeś e-maila?{' '}
            <button
              onClick={() => {
                setRequiresEmailConfirmation(false);
                setSuccessMessage('');
                reset();
              }}
              className="text-brand hover:underline font-medium"
            >
              Spróbuj ponownie
            </button>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Utwórz konto</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj.email@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isSubmitting}
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <InlineError id="email-error" message={errors.email.message!} />
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 znaków"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isSubmitting}
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <InlineError id="password-error" message={errors.password.message!} />
              )}
            </div>

            {/* Confirm Password field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Powtórz hasło"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                disabled={isSubmitting}
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <InlineError id="confirmPassword-error" message={errors.confirmPassword.message!} />
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <InlineError id="server-error" message={serverError} />
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Rejestracja...' : 'Zarejestruj się'}
          </Button>

          <p className="text-center text-caption text-muted-foreground">
            Masz już konto?{' '}
            <a 
              href="/auth/login" 
              className="text-brand hover:underline font-medium"
            >
              Zaloguj się
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

