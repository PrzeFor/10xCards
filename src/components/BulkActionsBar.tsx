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
    <Card className="elevation-2">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Input
              data-testid="select-all-checkbox"
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              disabled={disabled || totalCount === 0}
              className="size-4"
              aria-label={allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
            />
            <span className="text-body-strong text-foreground">
              {allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
            </span>
            <span className="text-caption text-muted-foreground ml-2">
              ({selectedCount}/{totalCount})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
            <Button
              data-testid="accept-all-button"
              variant="success"
              size="sm"
              onClick={onAcceptAll}
              disabled={disabled || totalCount === 0}
            >
              ✓ Akceptuj wszystkie
            </Button>

            <Button
              data-testid="reject-all-button"
              variant="destructive"
              size="sm"
              onClick={onRejectAll}
              disabled={disabled || totalCount === 0}
            >
              ✕ Odrzuć wszystkie
            </Button>

            <Button
              data-testid="save-selected-button"
              variant="default"
              onClick={onSaveSelected}
              disabled={disabled || !someSelected}
              size="sm"
            >
              {isSaving ? 'Zapisuję...' : `💾 Zapisz zaznaczone (${selectedCount})`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
