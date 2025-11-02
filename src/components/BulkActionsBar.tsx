import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';

interface BulkActionsBarProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSaveSelected: () => void;
  isSaving: boolean;
  disabled: boolean;
}

export function BulkActionsBar({
  totalCount,
  selectedCount,
  onSelectAll,
  onAcceptAll,
  onRejectAll,
  onSaveSelected,
  isSaving,
  disabled,
}: BulkActionsBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              disabled={disabled || totalCount === 0}
              className="size-4"
              aria-label={allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
            />
            <span className="text-sm font-medium">
              {allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              ({selectedCount}/{totalCount})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onAcceptAll}
              disabled={disabled || totalCount === 0}
              className="text-xs"
            >
              ✓ Akceptuj wszystkie
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRejectAll}
              disabled={disabled || totalCount === 0}
              className="text-xs"
            >
              ✕ Odrzuć wszystkie
            </Button>

            <Button
              onClick={onSaveSelected}
              disabled={disabled || !someSelected}
              size="sm"
              className="font-medium"
            >
              {isSaving ? 'Zapisuję...' : `💾 Zapisz zaznaczone (${selectedCount})`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
