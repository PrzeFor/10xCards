import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { InlineError } from './InlineError';
import { RegisterSchema, type RegisterFormData } from '@/lib/schemas/auth';

export function RegistrationForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
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
    const result = RegisterSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof RegisterFormData;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

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
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setServerError(data.message || 'Wystąpił błąd podczas rejestracji');
        }
        return;
      }

      // Success - redirect to generations page
      window.location.href = '/generations';
    } catch (error) {
      setServerError('Wystąpił błąd połączenia. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Utwórz konto</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="twoj.email@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isSubmitting}
                autoComplete="email"
              />
              {errors.email && (
                <InlineError id="email-error" message={errors.email} />
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 znaków"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {errors.password && (
                <InlineError id="password-error" message={errors.password} />
              )}
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
                placeholder="Powtórz hasło"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <InlineError id="confirmPassword-error" message={errors.confirmPassword} />
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

