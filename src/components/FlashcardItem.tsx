import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';
import type { FlashcardProposalViewModel } from '../types/viewModels';

interface FlashcardItemProps {
  proposal: FlashcardProposalViewModel;
  onToggleSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  disabled: boolean;
}

export function FlashcardItem({
  proposal,
  onToggleSelect,
  onAccept,
  onReject,
  onEdit,
  disabled,
}: FlashcardItemProps) {
  const getStatusColor = (status: FlashcardProposalViewModel['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-success text-success border-success';
      case 'rejected':
        return 'bg-danger text-danger border-danger';
      case 'edited':
        return 'bg-info text-info border-info';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: FlashcardProposalViewModel['status']) => {
    switch (status) {
      case 'accepted':
        return 'Zaakceptowana';
      case 'rejected':
        return 'Odrzucona';
      case 'edited':
        return 'Edytowana';
      default:
        return '';
    }
  };

  return (
    <Card className={`transition-colors h-full flex flex-col overflow-hidden ${getStatusColor(proposal.status)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Input
              type="checkbox"
              checked={proposal.isSelected}
              onChange={() => onToggleSelect(proposal.id)}
              disabled={disabled}
              className="size-4 shrink-0"
              aria-label={`Zaznacz fiszkę: ${proposal.front.substring(0, 50)}...`}
            />
            {proposal.status !== 'pending' && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50 shrink-0">
                {getStatusLabel(proposal.status)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAccept(proposal.id)}
                disabled={disabled || proposal.status === 'accepted'}
                className="text-xs px-2 h-7"
              >
                ✓
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(proposal.id)}
                disabled={disabled}
                className="text-xs px-2 h-7"
              >
                ✏️
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(proposal.id)}
                disabled={disabled || proposal.status === 'rejected'}
                className="text-xs px-2 h-7"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3 pt-0">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Przód
          </div>
          <div className="text-sm font-medium break-words overflow-hidden">
            {proposal.status === 'edited' && proposal.editedFront 
              ? proposal.editedFront 
              : proposal.front
            }
          </div>
        </div>

        <div className="space-y-1 flex-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tył
          </div>
          <div className="text-sm break-words overflow-hidden">
            {proposal.status === 'edited' && proposal.editedBack 
              ? proposal.editedBack 
              : proposal.back
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
