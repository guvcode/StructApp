import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useSyncState } from '../../hooks/useSync';
import { getPendingItems, getAllQueueItems, clearQueue } from '../../services/mockSync';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import type { SyncQueueItem } from '../../types/index';
import Skeleton from '../../components/Skeleton';

export default function SyncPage() {
  const navigate = useNavigate();
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
    mutationFn: () => apiClient<{
      structures: unknown[];
      sites: unknown[];
      projects: unknown[];
      component_types: unknown[];
      work_types: unknown[];
      taxonomy: unknown[];
      inspections: Array<{
        inspection_id: string; structure_id: string | null; site_id: string;
        client_id: string; inspector_id: string; assigned_by: string;
        status: string; scheduled_date: string | null; created_at: string;
        submitted_at: string | null; updated_at: string; returned_reason: string | null;
        approved_by: string | null; approved_at: string | null;
      }>;
      deficiencies: Array<{
        deficiency_id: string; inspection_id: string; client_id: string;
        description: string; calculated_priority: string;
        category: string | null; sub_component: string | null;
        focus_area: string | null; deficiency_category: string | null;
        detailed_description: string | null; mechanisms: string | null;
        recommended_action: string | null;
        consequence_severity: number | null; likelihood: string | null;
        risk_rank: number | null; risk_rating: string | null;
        created_at: string; updated_at: string;
      }>;
    }>(ENDPOINTS.sync.pull, { method: 'POST', body: '{}' }),
    onSuccess: async (data) => {
      const { db } = await import('../../lib/db');
      if (data.inspections?.length) {
        await db.offlineInspections.bulkPut(
          data.inspections.map(i => ({
            id: i.inspection_id,
            structureId: i.structure_id,
            siteId: i.site_id,
            clientId: i.client_id,
            inspectorId: i.inspector_id,
            assignedBy: i.assigned_by,
            status: i.status,
            scheduledDate: i.scheduled_date,
            createdAt: i.created_at,
            submittedAt: i.submitted_at,
            updatedAt: i.updated_at,
            returnedReason: i.returned_reason,
            approvedBy: i.approved_by,
            approvedAt: i.approved_at,
          }))
        );
      }
      if (data.deficiencies?.length) {
        await db.offlineDeficiencies.bulkPut(
          data.deficiencies.map(d => ({
            deficiencyId: d.deficiency_id,
            inspectionId: d.inspection_id,
            clientId: d.client_id,
            description: d.description,
            calculatedPriority: d.calculated_priority,
            category: d.category ?? null,
            subComponent: d.sub_component ?? null,
            focusArea: d.focus_area ?? null,
            deficiencyCategory: d.deficiency_category ?? null,
            detailedDescription: d.detailed_description ?? null,
            mechanisms: d.mechanisms ?? null,
            recommendedAction: d.recommended_action ?? null,
            consequenceSeverity: d.consequence_severity ?? null,
            likelihood: d.likelihood ?? null,
            riskRank: d.risk_rank ?? null,
            riskRating: d.risk_rating ?? null,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }))
        );
      }
      if (data.taxonomy?.length) {
        const taxonomyData = data.taxonomy as Array<{ node_id: string; parent_id: string | null; level: string; category: string; label: string; display_order: number; is_active: boolean }>;
        await db.offlineTaxonomy.bulkPut(
          taxonomyData.map(t => ({
            nodeId: t.node_id,
            parentId: t.parent_id,
            level: t.level,
            category: t.category,
            label: t.label,
            displayOrder: t.display_order,
            isActive: t.is_active,
          }))
        );
      }
      setMessage(`Pulled ${data.inspections?.length ?? 0} inspections, ${data.deficiencies?.length ?? 0} deficiencies.`);
      clearQueue();
      load();
    },
    onError: () => setError('Pull failed. Please try again.'),
  });

  const loading = pushMutation.isPending || pullMutation.isPending;

  if (initialLoading) return <div className="p-6"><Skeleton className="h-6 w-32 mx-auto mb-2" /><Skeleton className="h-48 w-full rounded-lg" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/m')} className="text-sm text-accent">&larr; Back</button>
      <h2 className="text-lg font-bold text-text-primary">Sync Hub</h2>
      <div className="bg-surface-primary rounded-lg p-3 border border-border">
        <p className="text-sm text-text-primary">
          Status: {navigator.onLine ? 'Online' : 'Offline'}
        </p>
        {syncState && (
          <p className="text-xs text-text-secondary">
            Last sync: {syncState.lastSync ? new Date(syncState.lastSync).toLocaleTimeString() : 'Never'}
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