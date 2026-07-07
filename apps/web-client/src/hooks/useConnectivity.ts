import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { syncWithAutoRefresh } from '@/lib/sync';

export interface ConnectivityState {
  isOnline: boolean;
  isReconnecting: boolean;
  pendingSyncCount: number;
  triggerSync: () => Promise<void>;
}

export function useConnectivity(): ConnectivityState {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const updatePendingCount = useCallback(async () => {
    try {
      const [pendingDeficiencies, pendingPinItems] = await Promise.all([
        db.deficiencies
          .where('syncState')
          .equals('Pending_Sync')
          .count(),
        db.pinOutbox
          .count(),
      ]);
      setPendingSyncCount(pendingDeficiencies + pendingPinItems);
    } catch {
      setPendingSyncCount(0);
    }
  }, []);

  const handleSyncTrigger = useCallback(async () => {
    if (!isOnline) return;

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
  }, [isOnline, updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline) {
        updatePendingCount();
      }
    };

    const handleSyncEvent = () => {
      handleSyncTrigger();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('structapp:sync-trigger', handleSyncEvent);

    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('structapp:sync-trigger', handleSyncEvent);
    };
  }, [isOnline, updatePendingCount, handleSyncTrigger]);

  const triggerSync = useCallback(async () => {
    if (!isOnline) return;

    setIsReconnecting(true);
    try {
      await handleSyncTrigger();
    } finally {
      setIsReconnecting(false);
    }
  }, [isOnline, handleSyncTrigger]);

  return {
    isOnline,
    isReconnecting,
    pendingSyncCount,
    triggerSync,
  };
}