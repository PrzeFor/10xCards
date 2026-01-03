import React from 'react';
import { Card, CardContent } from './ui/card';

interface StatsCardProps {
  value: number;
  label: string;
  variant?: 'default' | 'primary' | 'accent';
  onClick?: () => void;
}

/**
 * Pojedyncza karta statystyki
 * Wyświetla liczbę i opis, opcjonalnie obsługuje kliknięcie
 */
export function StatsCard({ value, label, variant = 'default', onClick }: StatsCardProps) {
  const isClickable = !!onClick;

  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/20 bg-primary/5',
    accent: 'border-accent/20 bg-accent/5',
  };

  return (
    <Card
      className={`
        ${variantStyles[variant]}
        ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2' : ''}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `Zobacz ${label.toLowerCase()}: ${value}` : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <CardContent className="pt-6">
        <div className="text-center space-y-2">
          <p className="text-4xl font-bold text-foreground" aria-hidden={isClickable}>
            {value}
          </p>
          <p className="text-caption text-muted-foreground" aria-hidden={isClickable}>
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

