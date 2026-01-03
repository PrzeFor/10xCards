import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { ProfileInfo } from '../lib/hooks/useUserSettings';

interface ProfileInfoCardProps {
  data: ProfileInfo;
}

/**
 * Karta z informacjami o profilu użytkownika (read-only)
 * Wyświetla email, datę utworzenia i ostatniej aktualizacji konta
 */
export function ProfileInfoCard({ data }: ProfileInfoCardProps) {
  // Formatowanie daty do czytelnej formy
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Informacje o profilu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-caption text-muted-foreground">Adres email</p>
          <p className="text-body text-foreground font-medium">{data.email}</p>
        </div>

        <div className="space-y-1">
          <p className="text-caption text-muted-foreground">Data utworzenia konta</p>
          <p className="text-body text-foreground">{formatDate(data.createdAt)}</p>
        </div>

        <div className="space-y-1">
          <p className="text-caption text-muted-foreground">Ostatnia aktualizacja</p>
          <p className="text-body text-foreground">{formatDate(data.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

