import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface ExitButtonProps {
  onExit: () => void;
  requireConfirmation: boolean;
}

/**
 * Exit button with optional confirmation modal
 * Positioned in top-left corner of session view
 */
export function ExitButton({ onExit, requireConfirmation }: ExitButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClick = () => {
    if (requireConfirmation) {
      setShowConfirmDialog(true);
    } else {
      onExit();
    }
  };

  const handleConfirmExit = () => {
    setShowConfirmDialog(false);
    onExit();
  };

  const handleCancelExit = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="rounded-full hover:bg-secondary"
        aria-label="Exit session (Esc)"
        title="Exit session (Esc)"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Czy na pewno chcesz wyjść?</DialogTitle>
            <DialogDescription>
              Postęp sesji zostanie utracony. Fiszki, które oceniłeś, zostaną zapisane, ale
              sesja nie będzie ukończona.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelExit}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleConfirmExit}>
              Wyjdź
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

