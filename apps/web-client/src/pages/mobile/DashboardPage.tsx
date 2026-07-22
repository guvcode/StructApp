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
import { formatDate } from '../../utils/dates';
import { InspectionStatus } from '../../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const session = getSession();
  const userName = session?.user?.display_name ?? session?.user?.email ?? 'Inspector';
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

  const { data: allStructures = [] } = useQuery({
    queryKey: ['structures'],
    queryFn: () => apiClient<Array<{ id: string; name: string; identifier: string }>>(ENDPOINTS.structures.list),
    enabled: online,
  });
  const structureLookup = useMemo(() => {
    const map = new Map<string, string>();
    allStructures.forEach(s => map.set(s.id, s.name || s.identifier));
    return map;
  }, [allStructures]);

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
    (i: { status: string }) => i.status === InspectionStatus.Assigned || i.status === InspectionStatus.InProgress || i.status === InspectionStatus.Draft
  );
  const returned = displayInspections.filter(
    (i: { status: string }) => i.status === InspectionStatus.Returned
  );
  const submitted = displayInspections.filter(
    (i: { status: string }) => i.status === InspectionStatus.Submitted
  );
  const approved = displayInspections.filter(
    (i: { status: string }) => i.status === InspectionStatus.Approved
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Welcome, {userName}</h2>
        <p className="text-xs text-text-secondary">Dashboard</p>
      </div>

      <div className="bg-surface-elevated rounded-xl p-4 border border-border/50 shadow-card">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm2 2h12v12H6V6zm2 2v2h2V8H8zm0 4v2h2v-2H8zm4-4v6h2V8h-2zm0 8v2h2v-2h-2zm4-8v2h2V8h-2zm0 4v4h2v-4h-2z"/></svg>
          <div>
            <p className="text-2xl font-bold text-accent">{pendingCount}</p>
            <p className="text-xs text-text-secondary">items pending sync</p>
          </div>
        </div>
      </div>

      {returned.length > 0 && (
        <div>
          <h3 className="font-semibold text-text-primary mb-2">Returned to You</h3>
          {returned.map((insp) => {
            const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string };
            return (
            <button
              key={i.id}
              onClick={() => navigate(`/m/inspections/${i.id}`)}
              className="w-full bg-red-50 border border-red-200 rounded-xl p-4 mb-2 text-left shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-200 text-red-800">Returned</span>
              </div>
              <p className="text-sm font-semibold text-red-800">
                {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? 'Unknown client'}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id} — due {formatDate(i.scheduledDate ?? i.scheduled_date)}
              </p>
            </button>
            );
          })}
        </div>
      )}

      {submitted.length > 0 && (
        <div>
          <h3 className="font-semibold text-text-primary mb-2">Submitted ({submitted.length})</h3>
          {submitted.map((insp) => {
            const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string };
            return (
            <button
              key={i.id}
              onClick={() => navigate(`/m/inspections/${i.id}`)}
              className="w-full bg-surface-primary border border-border rounded-xl p-4 mb-2 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Submitted</span>
                <span className="text-xs text-text-muted">{formatDate(i.scheduledDate ?? i.scheduled_date)}</span>
              </div>
              <p className="text-base font-semibold text-text-primary">
                {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? i.clientId ?? i.client_id}
              </p>
              <p className="text-sm text-text-secondary mt-0.5">
                {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id}
              </p>
            </button>
            );
          })}
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h3 className="font-semibold text-text-primary mb-2">Approved ({approved.length})</h3>
          {approved.map((insp) => {
            const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string };
            return (
            <button
              key={i.id}
              onClick={() => navigate(`/m/inspections/${i.id}`)}
              className="w-full bg-surface-primary border border-border rounded-xl p-4 mb-2 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Approved</span>
                <span className="text-xs text-text-muted">{formatDate(i.scheduledDate ?? i.scheduled_date)}</span>
              </div>
              <p className="text-base font-semibold text-text-primary">
                {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? i.clientId ?? i.client_id}
              </p>
              <p className="text-sm text-text-secondary mt-0.5">
                {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id}
              </p>
            </button>
            );
          })}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-text-primary mb-2">Active Inspections ({assigned.length})</h3>
        {assigned.map((insp) => {
          const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string; structureId?: string; structure_id?: string };
          const statusColor = i.status === InspectionStatus.InProgress ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800';
          const statusLabel = i.status === InspectionStatus.InProgress ? 'In Progress' : 'Assigned';
          return (
          <button
            key={i.id}
            onClick={() => navigate(`/m/inspections/${i.id}`)}
            className="w-full bg-surface-primary border border-border rounded-xl p-4 mb-2 text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
              <span className="text-xs text-text-muted">{formatDate(i.scheduledDate ?? i.scheduled_date)}</span>
            </div>
            <p className="text-base font-semibold text-text-primary">
              {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? i.clientId ?? i.client_id}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id}
              {structureLookup.get(i.structureId ?? i.structure_id ?? '') ? ` — ${structureLookup.get(i.structureId ?? i.structure_id ?? '')}` : ''}
            </p>
          </button>
          );
        })}
        {assigned.length === 0 && (
          <div className="text-center py-10">
            <svg className="w-12 h-12 mx-auto text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <p className="text-text-secondary text-sm">No assigned inspections.</p>
            <p className="text-text-muted text-xs mt-1">Pull the latest data from Sync to check.</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => navigate('/m/sync')} className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium shadow-sm transition-all animate-buttonLift hover:animate-buttonLift-hover" aria-label="Go to sync page">
          Sync Now
        </button>
        <button onClick={() => navigate('/m/structures/search')} className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium shadow-sm transition-all animate-buttonLift hover:animate-buttonLift-hover" aria-label="Scan QR code to find structure">
          Scan QR
        </button>
        <button onClick={() => navigate('/m/pending-structures/new')} className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium shadow-sm transition-all animate-buttonLift hover:animate-buttonLift-hover" aria-label="Discover new on-site structure">
          Discover
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