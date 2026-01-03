import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

/**
 * Skeleton loading state dla ProfileInfoCard
 */
export function ProfileSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-24" />
          <div className="h-5 bg-muted rounded w-2/3" />
        </div>

        {/* Created at field */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-32" />
          <div className="h-5 bg-muted rounded w-1/2" />
        </div>

        {/* Updated at field */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-28" />
          <div className="h-5 bg-muted rounded w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

