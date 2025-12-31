import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

interface FlashcardListSkeletonProps {
  count?: number;
}

/**
 * Komponent wyświetlający placeholder podczas ładowania listy fiszek
 */
export function FlashcardListSkeleton({ count = 6 }: FlashcardListSkeletonProps) {
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="flashcard-list-skeleton"
      aria-label="Ładowanie fiszek"
      role="status"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              {/* Badge skeleton */}
              <div className="h-5 bg-muted rounded w-20" />
              {/* Date skeleton */}
              <div className="h-4 bg-muted rounded w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Front text skeleton (2-3 linie) */}
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/5" />
            </div>
            {/* Separator */}
            <div className="h-px bg-muted w-full" />
            {/* Back text skeleton (3-4 linie) */}
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            {/* Action buttons skeleton */}
            <div className="h-8 bg-muted rounded w-16" />
            <div className="h-8 bg-muted rounded w-16" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

