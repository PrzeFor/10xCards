import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

export function LoadingSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full" />
        <span className="text-muted-foreground">Generuję propozycje fiszek...</span>
      </div>
      
      {/* Skeleton cards for flashcard proposals */}
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded w-16" />
                <div className="h-8 bg-muted rounded w-16" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-16" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-16" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
