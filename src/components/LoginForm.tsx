import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { InlineError } from './InlineError';
import { LoginSchema, type LoginFormData } from '@/lib/schemas/auth';

export function LoginForm() {
  const [serverError, setServerError] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (formData: LoginFormData) => {
    // Clear previous server errors
    setServerError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || 'Nieprawidłowy e-mail lub hasło');
        return;
      }

      // Success - show toast and redirect
      toast.success('Logowanie przebiegło pomyślnie!');
      
      // Small delay to allow toast to be seen before redirect
      setTimeout(() => {
        window.location.href = '/generations';
      }, 500);
    } catch (error) {
      setServerError('Wystąpił błąd połączenia. Spróbuj ponownie.');
    }
  };

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Logowanie</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                data-testid="login-email"
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
                data-testid="login-password"
                id="password"
                type="password"
                placeholder="Twoje hasło"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isSubmitting}
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <InlineError id="password-error" message={errors.password.message!} />
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <InlineError id="server-error" message={serverError} />
            )}
          </div>

          <Button 
            data-testid="login-submit"
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
          </Button>

          <div className="space-y-3">
            <p className="text-center text-caption text-muted-foreground">
              <a 
                href="/auth/forgot-password" 
                className="text-brand hover:underline font-medium"
              >
                Zapomniałeś hasła?
              </a>
            </p>
            <p className="text-center text-caption text-muted-foreground">
              Nie masz konta?{' '}
              <a 
                href="/auth/register" 
                className="text-brand hover:underline font-medium"
              >
                Zarejestruj się
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

