import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InlineError } from './InlineError';
import type { DeleteAccountRequestDto } from '../types';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dto: DeleteAccountRequestDto) => Promise<void>;
}

/**
 * Modal potwierdzenia usunięcia konta
 * Wymaga hasła i zaznaczenia checkboxu potwierdzenia
 */
export function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmation(false);
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError('');

    // Client-side validation
    if (!password.trim()) {
      setError('Hasło jest wymagane');
      return;
    }

    if (!confirmation) {
      setError('Musisz potwierdzić usunięcie konta');
      return;
    }

    setIsDeleting(true);

    try {
      const dto: DeleteAccountRequestDto = {
        password,
        confirmation,
      };

      await onConfirm(dto);
      // onConfirm should handle success (redirect, etc.)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Wystąpił błąd podczas usuwania konta');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmDisabled = !password.trim() || !confirmation || isDeleting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent role="alertdialog" aria-describedby="delete-account-description">
        <DialogHeader>
          <DialogTitle>Czy na pewno chcesz usunąć konto?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p id="delete-account-description" className="text-body text-foreground">
            Ta operacja jest nieodwracalna. Po usunięciu konta:
          </p>
          <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground">
            <li>Wszystkie Twoje fiszki zostaną trwale usunięte</li>
            <li>Historia sesji zostanie usunięta</li>
            <li>Historia generacji zostanie usunięta</li>
            <li>Nie będzie można odzyskać Twoich danych</li>
          </ul>

          <div className="space-y-2">
            <Label htmlFor="delete-password">Potwierdź swoją tożsamość wpisując hasło</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting}
              placeholder="Wprowadź swoje hasło"
              aria-required="true"
              aria-describedby={error ? 'delete-error' : undefined}
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="delete-confirmation"
              checked={confirmation}
              onChange={(e) => setConfirmation(e.target.checked)}
              disabled={isDeleting}
              className="mt-1 size-4 rounded border-gray-300 text-destructive focus:ring-destructive focus:ring-2 focus:ring-offset-2"
              aria-required="true"
              aria-describedby={error ? 'delete-error' : undefined}
            />
            <Label htmlFor="delete-confirmation" className="text-sm font-normal cursor-pointer select-none">
              Rozumiem, że ta operacja jest nieodwracalna i wszystkie moje dane zostaną trwale usunięte
            </Label>
          </div>

          {error && <InlineError id="delete-error" message={error} />}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Anuluj usuwanie konta"
          >
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            aria-label="Potwierdź usunięcie konta"
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń konto definitywnie'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

