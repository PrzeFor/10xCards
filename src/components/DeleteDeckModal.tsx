import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import type { DeckWithStatsDto } from '../types';

interface DeleteDeckModalProps {
  isOpen: boolean;
  deck: DeckWithStatsDto | null;
  onConfirm: (deckId: string) => Promise<void>;
  onClose: () => void;
}

export function DeleteDeckModal({ isOpen, deck, onConfirm, onClose }: DeleteDeckModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    if (!deck) return;

    setIsDeleting(true);
    try {
      await onConfirm(deck.id);
      onClose();
    } catch (error) {
      console.error('Error deleting deck:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!deck) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Usuń zestaw</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć zestaw <strong>{deck.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {deck.flashcard_count > 0 && (
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Uwaga:</strong> Ten zestaw zawiera {deck.flashcard_count}{' '}
                {deck.flashcard_count === 1 ? 'fiszkę' : 'fiszek'}. Fiszki nie zostaną usunięte,
                ale przestaną być przypisane do tego zestawu.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? 'Usuwanie...' : 'Usuń zestaw'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

