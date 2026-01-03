import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

/**
 * Skeleton loading state dla AccountStatsCard
 */
export function StatsSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-muted rounded w-1/4" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Three stat cards */}
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-border">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="h-10 bg-muted rounded w-16 mx-auto" />
                  <div className="h-4 bg-muted rounded w-20 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

