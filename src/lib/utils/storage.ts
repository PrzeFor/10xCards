import type { PendingSRSUpdate } from '../../types/viewModels';

const STORAGE_PREFIX = 'srs_session_';
const PENDING_UPDATES_KEY = (sessionId: string) => `${STORAGE_PREFIX}pending_${sessionId}`;

/**
 * Save a pending SRS update to localStorage for offline support
 * @param sessionId - Session ID
 * @param update - Pending update data
 */
export function savePendingUpdate(sessionId: string, update: PendingSRSUpdate): void {
  try {
    const key = PENDING_UPDATES_KEY(sessionId);
    const existing = getPendingUpdates(sessionId);
    existing.push(update);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to save pending update to localStorage:', error);
  }
}

/**
 * Get all pending SRS updates for a session
 * @param sessionId - Session ID
 * @returns Array of pending updates
 */
export function getPendingUpdates(sessionId: string): PendingSRSUpdate[] {
  try {
    const key = PENDING_UPDATES_KEY(sessionId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get pending updates from localStorage:', error);
    return [];
  }
}

/**
 * Clear all pending updates for a session
 * @param sessionId - Session ID
 */
export function clearPendingUpdates(sessionId: string): void {
  try {
    const key = PENDING_UPDATES_KEY(sessionId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear pending updates from localStorage:', error);
  }
}

/**
 * Remove a specific pending update after successful sync
 * @param sessionId - Session ID
 * @param flashcardId - Flashcard ID to remove
 */
export function removePendingUpdate(sessionId: string, flashcardId: string): void {
  try {
    const key = PENDING_UPDATES_KEY(sessionId);
    const existing = getPendingUpdates(sessionId);
    const filtered = existing.filter((update) => update.flashcardId !== flashcardId);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending update from localStorage:', error);
  }
}

/**
 * Sync all pending updates to the server
 * @param sessionId - Session ID
 * @returns Number of successfully synced updates
 */
export async function syncPendingUpdates(sessionId: string): Promise<number> {
  const pending = getPendingUpdates(sessionId);
  if (pending.length === 0) return 0;

  let syncedCount = 0;

  for (const update of pending) {
    try {
      const response = await fetch(`/api/flashcards/${update.flashcardId}/srs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: update.rating,
          review_duration: update.reviewDuration,
        }),
      });

      if (response.ok) {
        // Successfully synced - remove from localStorage
        removePendingUpdate(sessionId, update.flashcardId);
        syncedCount++;
      } else {
        console.error(`Failed to sync update for flashcard ${update.flashcardId}`);
      }
    } catch (error) {
      console.error(`Error syncing update for flashcard ${update.flashcardId}:`, error);
      // Leave in localStorage for next sync attempt
    }
  }

  return syncedCount;
}

/**
 * Check if there are any pending updates
 * @param sessionId - Session ID
 * @returns True if there are pending updates
 */
export function hasPendingUpdates(sessionId: string): boolean {
  return getPendingUpdates(sessionId).length > 0;
}

/**
 * Initialize online/offline sync listeners
 * Automatically syncs pending updates when connection is restored
 */
export function initializeOfflineSync(): void {
  if (typeof window === 'undefined') return;

  // Sync when coming back online
  window.addEventListener('online', async () => {
    console.log('Connection restored - syncing pending updates...');

    // Get all pending session IDs from localStorage
    const allKeys = Object.keys(localStorage);
    const sessionKeys = allKeys.filter((key) => key.startsWith(STORAGE_PREFIX + 'pending_'));

    for (const key of sessionKeys) {
      // Extract session ID from key
      const sessionId = key.replace(STORAGE_PREFIX + 'pending_', '');
      const syncedCount = await syncPendingUpdates(sessionId);

      if (syncedCount > 0) {
        console.log(`Synced ${syncedCount} updates for session ${sessionId}`);
      }
    }
  });

  // Log offline status
  window.addEventListener('offline', () => {
    console.log('Connection lost - updates will be saved locally');
  });
}

/**
 * Save session progress to localStorage (for recovery)
 * @param sessionId - Session ID
 * @param progress - Progress data to save
 */
export function saveSessionProgress(
  sessionId: string,
  progress: {
    currentIndex: number;
    completedResults: any[];
    startedAt: string;
  }
): void {
  try {
    const key = `${STORAGE_PREFIX}progress_${sessionId}`;
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save session progress:', error);
  }
}

/**
 * Get saved session progress from localStorage
 * @param sessionId - Session ID
 * @returns Saved progress or null
 */
export function getSessionProgress(sessionId: string): {
  currentIndex: number;
  completedResults: any[];
  startedAt: string;
} | null {
  try {
    const key = `${STORAGE_PREFIX}progress_${sessionId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get session progress:', error);
    return null;
  }
}

/**
 * Clear saved session progress
 * @param sessionId - Session ID
 */
export function clearSessionProgress(sessionId: string): void {
  try {
    const key = `${STORAGE_PREFIX}progress_${sessionId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear session progress:', error);
  }
}

