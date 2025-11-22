import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { InlineError } from './InlineError';

export function AccountSettings() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>('');

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setIsDeleting(true);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if response is a redirect (account deleted successfully)
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || 'Wystąpił błąd podczas usuwania konta');
        return;
      }

      // Success - redirect to home page
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Wystąpił błąd połączenia. Spróbuj ponownie.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-brand">Ustawienia konta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Danger Zone */}
          <div className="space-y-3">
            <h3 className="text-subtitle-strong text-foreground">Strefa niebezpieczna</h3>
            <p className="text-caption text-muted-foreground">
              Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane, w tym fiszki i generacje, zostaną trwale usunięte.
            </p>
            <Button 
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
              size="lg"
            >
              Usuń konto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Czy na pewno chcesz usunąć konto?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-body text-foreground">
              Ta operacja jest nieodwracalna. Po usunięciu konta:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body text-muted-foreground">
              <li>Wszystkie Twoje fiszki zostaną trwale usunięte</li>
              <li>Historia generacji zostanie usunięta</li>
              <li>Nie będzie można odzyskać Twoich danych</li>
            </ul>

            {deleteError && (
              <InlineError id="delete-error" message={deleteError} />
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteError('');
              }}
              disabled={isDeleting}
            >
              Anuluj
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? 'Usuwanie...' : 'Usuń konto definitywnie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

