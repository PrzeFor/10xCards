import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface DataManagementCardProps {
  onDeleteClick: () => void;
}

/**
 * Karta zarządzania danymi (RODO)
 * Zawiera przycisk do usunięcia konta
 */
export function DataManagementCard({ onDeleteClick }: DataManagementCardProps) {
  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="text-destructive">Strefa niebezpieczna</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-body text-foreground font-medium">Usuń konto</p>
          <p className="text-caption text-muted-foreground">
            Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane, w tym fiszki, sesje i generacje, zostaną trwale
            usunięte zgodnie z wymogami RODO.
          </p>
        </div>
        <Button 
          variant="destructive" 
          onClick={onDeleteClick} 
          size="lg"
          aria-label="Usuń konto definitywnie"
        >
          Usuń konto
        </Button>
      </CardContent>
    </Card>
  );
}

