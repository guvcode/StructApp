import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { syncWithAutoRefresh } from '@/lib/sync';

export interface ConnectivityState {
  isOnline: boolean;
  isReconnecting: boolean;
  pendingSyncCount: number;
  triggerSync: () => Promise<void>;
}

const RECONNECT_DEBOUNCE_MS = 3000;

export function useConnectivity(): ConnectivityState {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const getPendingCount = useCallback(async (): Promise<number> => {
    try {
      const [pendingDeficiencies, pendingPinItems, pendingSubmissions] = await Promise.all([
        db.deficiencies
          .where('syncState')
          .equals('Pending_Sync')
          .count(),
        db.pinOutbox
          .count(),
        db.offlineSubmissions
          .where('syncState')
          .equals('Pending_Sync')
          .count(),
      ]);
      return pendingDeficiencies + pendingPinItems + pendingSubmissions;
    } catch {
      return 0;
    }
  }, []);

  const updatePendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingSyncCount(count);
  }, [getPendingCount]);

  const handleSyncTrigger = useCallback(async () => {
    if (!navigator.onLine) return;

    const authState = await db.authState.get('current');
    if (!authState?.accessToken || !authState?.refreshToken) {
      return;
    }

    const result = await syncWithAutoRefresh(authState.accessToken, authState.refreshToken);

    if (!result.success && result.error_code === 'AUTH_EXPIRED') {
      setIsReconnecting(false);
      return;
    }

    updatePendingCount();
  }, [updatePendingCount]);

  useEffect(() => {
    const debounceRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      updatePendingCount();

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        const count = await getPendingCount();
        if (count > 0) {
          setIsReconnecting(true);
          await handleSyncTrigger();
          setIsReconnecting(false);
        }
      }, RECONNECT_DEBOUNCE_MS);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        updatePendingCount();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    updatePendingCount();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getPendingCount, handleSyncTrigger, updatePendingCount]);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;

    setIsReconnecting(true);
    try {
      await handleSyncTrigger();
    } finally {
      setIsReconnecting(false);
    }
  }, [handleSyncTrigger]);

  return {
    isOnline,
    isReconnecting,
    pendingSyncCount,
    triggerSync,
  };
}
