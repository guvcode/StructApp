import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInspectionsByAssignee } from '../../hooks/useInspections';
import { useSyncState } from '../../hooks/useSync';
import { getSession, getActiveClientId } from '../../lib/authStore';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { db } from '../../lib/db';
import Skeleton from '../../components/Skeleton';

export default function DashboardPage() {
  const navigate = useNavigate();
  const session = getSession();
  const userId = session?.user?.id;
  const activeClientId = getActiveClientId();
  const online = navigator.onLine;

  const { data: inspections = [], isLoading, isError } = useInspectionsByAssignee(userId, activeClientId);
  const { data: syncState } = useSyncState();
  const pendingCount = syncState?.pendingCount ?? 0;

  const { data: allSites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => apiClient<Array<{ id: string; name: string }>>(ENDPOINTS.sites.list),
    enabled: online,
  });
  const siteLookup = useMemo(() => {
    const map = new Map<string, string>();
    allSites.forEach(s => map.set(s.id, s.name));
    return map;
  }, [allSites]);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients', 'mine'],
    queryFn: () => apiClient<Array<{ client_id: string; name: string }>>(ENDPOINTS.clients.mine),
    enabled: online,
  });
  const clientLookup = useMemo(() => {
    const map = new Map<string, string>();
    allClients.forEach(c => map.set(c.client_id, c.name));
    return map;
  }, [allClients]);

  const { data: offlineInspections = [] } = useQuery({
    queryKey: ['offlineInspections', activeClientId],
    queryFn: async () => {
      const collection = db.offlineInspections
        .where('clientId')
        .equals(activeClientId ?? '');
      return collection.toArray();
    },
    enabled: !online && !!activeClientId,
  });

  const displayInspections = online ? inspections : offlineInspections;

  if (isLoading) return (
    <div className="space-y-4 p-4 animate-fadeIn">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
  if (isError && online) return <div className="p-6 text-red-600 text-center">Failed to load dashboard data.</div>;

  const assigned = displayInspections.filter(
    (i: { status: string }) => i.status === 'Assigned' || i.status === 'In Progress' || i.status === 'Draft'
  );
  const returned = displayInspections.filter(
    (i: { status: string }) => i.status === 'Returned'
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-lg font-bold text-text-primary">Dashboard</h2>

      <div className="bg-surface-elevated rounded-lg p-4 border border-border/50 shadow-card">
        <p className="text-sm font-semibold text-text-primary">Pending Sync</p>
        <p className="text-2xl font-bold text-accent">{pendingCount}</p>
        <p className="text-xs text-text-secondary">items to sync</p>
      </div>

      {returned.length > 0 && (
        <div>
          <h3 className="font-semibold text-text-primary mb-1">Returned to You</h3>
          {returned.map((insp) => {
            const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string; assignee_name?: string; assigned_to?: string };
            return (
            <button
              key={i.id}
              onClick={() => navigate(`/m/inspections/${i.id}`)}
              className="w-full bg-red-50 border border-red-200 rounded-lg p-3 mb-2 text-left"
              aria-label={`View returned inspection`}
            >
              <p className="text-sm font-semibold text-red-800">
                {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? 'Unknown client'}
              </p>
              <p className="text-xs text-red-600">
                {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id} — due {i.scheduledDate ?? i.scheduled_date}
              </p>
            </button>
            );
          })}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-text-primary mb-1">Assigned Inspections ({assigned.length})</h3>
        {assigned.map((insp) => {
          const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string; structureId?: string; structure_id?: string };
          return (
          <button
            key={i.id}
            onClick={() => navigate(`/m/inspections/${i.id}`)}
            className="w-full bg-surface-primary border border-border rounded-lg p-3 mb-2 text-left"
            aria-label={`View assigned inspection`}
          >
            <p className="text-sm font-semibold text-text-primary">
              {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? i.clientId ?? i.client_id}
            </p>
            <p className="text-xs text-text-secondary">
              {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id}
              {i.structureId ?? i.structure_id ? ` — ${i.structureId ?? i.structure_id}` : ''}
            </p>
            <p className="text-xs text-text-secondary">{i.status} — {i.scheduledDate ?? i.scheduled_date}</p>
          </button>
          );
        })}
        {assigned.length === 0 && (
          <p className="text-text-secondary text-sm text-center py-4">No assigned inspections.</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => navigate('/m/sync')} className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium shadow-sm transition-all animate-buttonLift hover:animate-buttonLift-hover" aria-label="Go to sync page">
          Sync Now
        </button>
        <button onClick={() => navigate('/m/structures/search')} className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium shadow-sm transition-all animate-buttonLift hover:animate-buttonLift-hover" aria-label="Scan QR code to find structure">
          Scan QR
        </button>
      </div>

      {syncState && (
        <p className="text-xs text-text-secondary text-center">
          Last sync: {new Date(syncState.lastSync).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}