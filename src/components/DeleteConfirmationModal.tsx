import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import type { FlashcardDto } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onConfirm: (id: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal potwierdzenia usunięcia fiszki
 */
export function DeleteConfirmationModal({
  isOpen,
  flashcard,
  onConfirm,
  onClose,
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!flashcard) return;

    setIsDeleting(true);

    try {
      await onConfirm(flashcard.id);
      // Modal zostanie zamknięty przez rodzica po sukcesie
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      // Błąd zostanie obsłużony przez rodzica (toast)
    } finally {
      setIsDeleting(false);
    }
  };

  // Skróć tekst przodu do wyświetlenia w preview
  const previewText = flashcard?.front
    ? flashcard.front.length > 100
      ? flashcard.front.substring(0, 100) + '...'
      : flashcard.front
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Potwierdź usunięcie</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć tę fiszkę? Ta akcja jest nieodwracalna.
          </DialogDescription>
        </DialogHeader>

        {flashcard && (
          <div className="bg-muted p-4 rounded-md my-4">
            <p className="text-sm">
              <strong className="font-semibold">Przód:</strong>{' '}
              <span className="text-muted-foreground">{previewText}</span>
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

