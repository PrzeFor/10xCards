import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { InlineError } from './InlineError.tsx';
import type { FlashcardProposalViewModel } from '../types/viewModels';

interface FlashcardEditModalProps {
  proposal: FlashcardProposalViewModel;
  onSave: (id: string, front: string, back: string) => void;
  onClose: () => void;
}

export function FlashcardEditModal({ proposal, onSave, onClose }: FlashcardEditModalProps) {
  const [front, setFront] = useState(proposal.editedFront || proposal.front);
  const [back, setBack] = useState(proposal.editedBack || proposal.back);
  const [frontError, setFrontError] = useState<string>('');
  const [backError, setBackError] = useState<string>('');

  // Reset form when proposal changes
  useEffect(() => {
    setFront(proposal.editedFront || proposal.front);
    setBack(proposal.editedBack || proposal.back);
    setFrontError('');
    setBackError('');
  }, [proposal.id, proposal.front, proposal.back, proposal.editedFront, proposal.editedBack]);

  const validateFront = (value: string): string => {
    if (!value.trim()) {
      return 'Przód fiszki nie może być pusty';
    }
    if (value.length > 300) {
      return `Przód fiszki nie może przekraczać 300 znaków. Obecnie: ${value.length}`;
    }
    return '';
  };

  const validateBack = (value: string): string => {
    if (!value.trim()) {
      return 'Tył fiszki nie może być pusty';
    }
    if (value.length > 500) {
      return `Tył fiszki nie może przekraczać 500 znaków. Obecnie: ${value.length}`;
    }
    return '';
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFront(value);
    if (frontError) {
      setFrontError(validateFront(value));
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBack(value);
    if (backError) {
      setBackError(validateBack(value));
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();

    const frontValidationError = validateFront(front);
    const backValidationError = validateBack(back);

    setFrontError(frontValidationError);
    setBackError(backValidationError);

    if (frontValidationError || backValidationError) {
      return;
    }

    onSave(proposal.id, front.trim(), back.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const isValid = front.trim() && back.trim() && front.length <= 300 && back.length <= 500;
  const hasChanges = front !== (proposal.editedFront || proposal.front) ||
    back !== (proposal.editedBack || proposal.back);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        aria-labelledby="edit-modal-title"
        aria-describedby="edit-modal-description"
      >
        <DialogHeader>
          <DialogTitle>
            Edytuj fiszkę
          </DialogTitle>
          <DialogDescription>
            Wprowadź zmiany w treści fiszki. Użyj Ctrl+Enter aby zapisać lub Escape aby anulować.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="front-input">
                Przód fiszki
              </Label>
              <Textarea
                id="front-input"
                value={front}
                onChange={handleFrontChange}
                placeholder="Wprowadź treść przodu fiszki..."
                className="min-h-[80px] resize-y"
                aria-describedby={frontError ? "front-error" : undefined}
                aria-invalid={!!frontError}
              />
              <div className="flex justify-between items-center text-caption text-muted-foreground">
                <span>Znaki: {front.length} / 300</span>
                {front.length > 250 && (
                  <span className={front.length > 300 ? 'text-danger' : 'text-warning'}>
                    {front.length > 300 ? 'Przekroczono limit!' : 'Zbliżasz się do limitu'}
                  </span>
                )}
              </div>
              {frontError && (
                <InlineError id="front-error" message={frontError} />
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="back-input">
                Tył fiszki
              </Label>
              <Textarea
                id="back-input"
                value={back}
                onChange={handleBackChange}
                placeholder="Wprowadź treść tyłu fiszki..."
                className="min-h-[120px] resize-y"
                aria-describedby={backError ? "back-error" : undefined}
                aria-invalid={!!backError}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Znaki: {back.length} / 500</span>
                {back.length > 400 && (
                  <span className={back.length > 500 ? 'text-destructive' : 'text-amber-600'}>
                    {back.length > 500 ? 'Przekroczono limit!' : 'Zbliżasz się do limitu'}
                  </span>
                )}
              </div>
              {backError && (
                <InlineError id="back-error" message={backError} />
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={!isValid || !hasChanges}
            >
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
