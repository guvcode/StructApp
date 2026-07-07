import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSyncState } from '../../hooks/useSync';
import { getPendingItems, getAllQueueItems, clearQueue } from '../../services/mockSync';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import type { SyncQueueItem } from '../../types/index';
import Skeleton from '../../components/Skeleton';

export default function SyncPage() {
  const { data: syncState } = useSyncState();
  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([]);
  const [allItems, setAllItems] = useState<SyncQueueItem[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  const load = async () => {
    try {
      setPendingItems(getPendingItems());
      setAllItems(getAllQueueItems());
    } catch {
      setError('Failed to load sync data.');
    }
    setInitialLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pushMutation = useMutation({
    mutationFn: () => apiClient(ENDPOINTS.sync.push, { method: 'POST', body: '{}' }),
    onSuccess: () => {
      setMessage('Synced items to server.');
      clearQueue();
      load();
    },
    onError: () => setError('Push failed. Please try again.'),
  });

  const pullMutation = useMutation({
    mutationFn: () => apiClient(ENDPOINTS.sync.pull, { method: 'POST', body: '{}' }),
    onSuccess: (data: unknown) => {
      const result = data as { items?: unknown[] };
      setMessage(`Pulled ${result.items?.length ?? 0} new item(s).`);
      load();
    },
    onError: () => setError('Pull failed. Please try again.'),
  });

  const loading = pushMutation.isPending || pullMutation.isPending;

  if (initialLoading) return <div className="p-6"><Skeleton className="h-6 w-32 mx-auto mb-2" /><Skeleton className="h-48 w-full rounded-lg" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">Sync Hub</h2>
      <div className="bg-surface-primary rounded-lg p-3 border border-border">
        <p className="text-sm text-text-primary">
          Status: {navigator.onLine ? 'Online' : 'Offline'}
        </p>
        {syncState && (
          <p className="text-xs text-text-secondary">
            Last sync: {new Date(syncState.lastSync).toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => pullMutation.mutate()}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
          aria-label="Pull package from server"
        >
          Pull Package
        </button>
        <button
          onClick={() => pushMutation.mutate()}
          disabled={loading || pendingItems.length === 0}
          className="flex-1 px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
          aria-label="Push outbox to server"
        >
          Push Outbox
        </button>
      </div>

      {message && (
        <div className="bg-green-100 text-green-800 p-2 rounded text-sm">{message}</div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>
      )}

      {pendingItems.length > 0 && (
        <div>
          <h3 className="font-semibold text-text-primary mb-1">Pending ({pendingItems.length})</h3>
          <ul className="space-y-1">
            {pendingItems.map(item => (
              <li key={item.id} className="bg-surface-primary p-2 rounded border border-border text-sm text-text-primary">
                {item.type} — {item.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {allItems.length > 0 && (
        <div>
          <h3 className="font-semibold text-text-primary mb-1">All Queue Items</h3>
          <ul className="space-y-1">
            {allItems.map(item => (
              <li key={item.id} className="bg-surface-primary p-2 rounded border border-border text-sm flex justify-between">
                <span className="text-text-primary">{item.type}</span>
                <span className={item.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}>{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allItems.length === 0 && (
        <p className="text-text-secondary text-sm text-center py-4">No pending work to sync.</p>
      )}
    </div>
  );
}