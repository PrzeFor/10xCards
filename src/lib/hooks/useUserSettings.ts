import { useState, useEffect, useCallback } from 'react';
import type { GetUserAccountResponseDto } from '../../types';

/**
 * Informacje o profilu użytkownika do wyświetlenia
 */
export interface ProfileInfo {
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Statystyki użytkownika
 */
export interface UserStats {
  totalFlashcards: number;
  totalSessions: number;
  totalGenerations: number;
}

interface UseUserSettingsReturn {
  profile: ProfileInfo | null;
  stats: UserStats | null;
  isLoadingProfile: boolean;
  isLoadingStats: boolean;
  error: string | null;
  refetchProfile: () => Promise<void>;
  refetchStats: () => Promise<void>;
}

/**
 * Hook zarządzający danymi użytkownika w widoku ustawień
 * Pobiera profile i statystyki równolegle przy montowaniu
 */
export function useUserSettings(): UseUserSettingsReturn {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/account', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Obsługa błędów uwierzytelniania
      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/settings';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data: GetUserAccountResponseDto = await response.json();
      
      // Mapowanie do ProfileInfo
      setProfile({
        email: data.email,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Brak połączenia z internetem. Sprawdź swoje połączenie.');
      } else {
        setError('Wystąpił błąd podczas pobierania profilu.');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);

    try {
      const response = await fetch('/api/stats/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Obsługa błędów uwierzytelniania
      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/settings';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const data: UserStats = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      
      // Nie ustawiamy error dla statystyk, bo nie są krytyczne
      // Użytkownik będzie widział brak statystyk bez blokowania całego widoku
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    // Pobierz profile i statystyki równolegle
    Promise.all([fetchProfile(), fetchStats()]);
  }, [fetchProfile, fetchStats]);

  return {
    profile,
    stats,
    isLoadingProfile,
    isLoadingStats,
    error,
    refetchProfile: fetchProfile,
    refetchStats: fetchStats,
  };
}

