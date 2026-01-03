import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { StatsCard } from './StatsCard';
import type { UserStats } from '../lib/hooks/useUserSettings';

interface AccountStatsCardProps {
  stats: UserStats;
}

/**
 * Kontener na karty statystyk użytkownika
 * Wyświetla 3 karty: fiszki, sesje, generacje
 */
export function AccountStatsCard({ stats }: AccountStatsCardProps) {
  const handleFlashcardsClick = () => {
    window.location.href = '/flashcards';
  };

  const handleSessionsClick = () => {
    window.location.href = '/sessions';
  };

  const handleGenerationsClick = () => {
    window.location.href = '/generations';
  };

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Statystyki</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            value={stats.totalFlashcards}
            label="Fiszki"
            variant="primary"
            onClick={handleFlashcardsClick}
          />
          <StatsCard
            value={stats.totalSessions}
            label="Sesje"
            variant="accent"
            onClick={handleSessionsClick}
          />
          <StatsCard
            value={stats.totalGenerations}
            label="Generacje"
            variant="default"
            onClick={handleGenerationsClick}
          />
        </div>
      </CardContent>
    </Card>
  );
}

