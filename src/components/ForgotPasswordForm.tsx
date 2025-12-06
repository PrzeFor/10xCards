import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { InlineError } from './InlineError';
import { ForgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/schemas/auth';

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ForgotPasswordFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name as keyof ForgotPasswordFormData]) {
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
    const result = ForgotPasswordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ForgotPasswordFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof ForgotPasswordFormData;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setServerError(data.message || 'Wystąpił błąd podczas wysyłania wiadomości');
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
    return (
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-brand">Sprawdź swoją skrzynkę</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-body text-foreground">
            Jeśli konto o podanym adresie e-mail istnieje, wysłaliśmy na nie link do resetowania hasła.
          </p>
          <p className="text-caption text-muted-foreground">
            Link będzie ważny przez 60 minut. Jeśli nie otrzymasz wiadomości, sprawdź folder spam.
          </p>
          <Button onClick={() => (window.location.href = '/auth/login')} className="w-full" size="lg">
            Powrót do logowania
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Resetuj hasło</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-body text-muted-foreground">
            Podaj adres e-mail przypisany do Twojego konta. Wyślemy Ci link do resetowania hasła.
          </p>

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
              {errors.email && <InlineError id="email-error" message={errors.email} />}
            </div>

            {/* Server error */}
            {serverError && <InlineError id="server-error" message={serverError} />}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? 'Wysyłanie...' : 'Wyślij link resetujący'}
          </Button>

          <p className="text-center text-caption text-muted-foreground">
            Pamiętasz hasło?{' '}
            <a href="/auth/login" className="text-brand hover:underline font-medium">
              Zaloguj się
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
