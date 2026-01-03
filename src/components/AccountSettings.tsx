import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { InlineError } from './InlineError';
import { useUserSettings } from '../lib/hooks/useUserSettings';
import { ProfileInfoCard } from './ProfileInfoCard';
import { ProfileSkeleton } from './ProfileSkeleton';
import { AccountStatsCard } from './AccountStatsCard';
import { StatsSkeleton } from './StatsSkeleton';
import { ChangePasswordForm } from './ChangePasswordForm';
import { DataManagementCard } from './DataManagementCard';
import { DeleteAccountModal } from './DeleteAccountModal';
import type { DeleteAccountRequestDto } from '../types';

/**
 * Główny komponent widoku ustawień użytkownika
 * Integruje wszystkie sekcje: profil, statystyki, zmiana hasła, zarządzanie danymi
 */
export function AccountSettings() {
  const { profile, stats, isLoadingProfile, isLoadingStats, error } = useUserSettings();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Check for URL messages (e.g., after account deletion redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');

    if (message === 'account-deleted') {
      toast.success('Konto zostało pomyślnie usunięte');
    }
  }, []);

  const handleDeleteAccount = async (dto: DeleteAccountRequestDto) => {
    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dto),
      });

      if (response.status === 204) {
        // Success - show toast and redirect to home page
        toast.success('Konto zostało pomyślnie usunięte');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        return;
      }

      const data = await response.json();
      throw new Error(data.message || 'Wystąpił błąd podczas usuwania konta');
    } catch (err) {
      console.error('Error deleting account:', err);
      throw err;
    }
  };

  const handlePasswordChangeSuccess = () => {
    setTimeout(() => {
      setIsChangePasswordModalOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <InlineError id="settings-error" message={error} />
          </CardContent>
        </Card>
      )}

      {/* Profile Info Section */}
      <section aria-labelledby="profile-info-heading">
        <h2 id="profile-info-heading" className="sr-only">
          Informacje o profilu
        </h2>
        {isLoadingProfile ? <ProfileSkeleton /> : profile && <ProfileInfoCard data={profile} />}
      </section>

      {/* Account Stats Section */}
      <section aria-labelledby="account-stats-heading">
        <h2 id="account-stats-heading" className="sr-only">
          Statystyki konta
        </h2>
        {isLoadingStats ? <StatsSkeleton /> : stats && <AccountStatsCard stats={stats} />}
      </section>

      {/* Change Password Section */}
      <section aria-labelledby="change-password-heading">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle id="change-password-heading" className="text-brand">
              Bezpieczeństwo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-caption text-muted-foreground">Zmień hasło, aby zabezpieczyć swoje konto</p>
            <Button variant="outline" onClick={() => setIsChangePasswordModalOpen(true)} size="lg">
              Zmień hasło
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Data Management Section (GDPR) */}
      <section aria-labelledby="data-management-heading">
        <h2 id="data-management-heading" className="sr-only">
          Zarządzanie danymi
        </h2>
        <DataManagementCard onDeleteClick={() => setIsDeleteModalOpen(true)} />
      </section>

      {/* Change Password Modal */}
      <Dialog open={isChangePasswordModalOpen} onOpenChange={setIsChangePasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień hasło</DialogTitle>
          </DialogHeader>
          <ChangePasswordForm onSuccess={handlePasswordChangeSuccess} />
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
