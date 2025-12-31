import React from 'react';
import { BulkActionsBar } from './BulkActionsBar';
import { FlashcardProposalItem } from './FlashcardProposalItem';
import { FlashcardEditModal } from './FlashcardEditModal';
import { InlineError } from './InlineError';
import type { FlashcardProposalViewModel } from '../types/viewModels';

interface FlashcardProposalsListProps {
  proposals: FlashcardProposalViewModel[];
  selectedCount: number;
  onToggleSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
  onSelectAll: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSaveSelected: () => void;
  editingId: string | null;
  onSaveEdit: (id: string, front: string, back: string) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
  saveError: string | null | undefined;
}

export function FlashcardProposalsList({
  proposals,
  selectedCount,
  onToggleSelect,
  onAccept,
  onReject,
  onEdit,
  onSelectAll,
  onAcceptAll,
  onRejectAll,
  onSaveSelected,
  editingId,
  onSaveEdit,
  onCancelEdit,
  isSaving,
  saveError,
}: FlashcardProposalsListProps) {
  const editingProposal = editingId ? proposals.find((p) => p.id === editingId) : null;

  return (
    <div data-testid="flashcard-proposals-list" className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-large-title text-brand">Propozycje fiszek ({proposals.length})</h2>
        {selectedCount > 0 && (
          <span className="text-caption text-muted-foreground bg-secondary px-fluent-s py-fluent-xs rounded-fluent-sm">
            Zaznaczono: {selectedCount}
          </span>
        )}
      </div>

      <BulkActionsBar
        totalCount={proposals.length}
        selectedCount={selectedCount}
        onSelectAll={onSelectAll}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSaveSelected={onSaveSelected}
        isSaving={isSaving}
        disabled={isSaving}
      />

      {saveError && <InlineError message={saveError} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
        {proposals.map((proposal) => (
          <FlashcardProposalItem
            key={proposal.id}
            proposal={proposal}
            onToggleSelect={onToggleSelect}
            onAccept={onAccept}
            onReject={onReject}
            onEdit={onEdit}
            disabled={isSaving}
          />
        ))}
      </div>

      {editingProposal && <FlashcardEditModal proposal={editingProposal} onSave={onSaveEdit} onClose={onCancelEdit} />}
    </div>
  );
}

