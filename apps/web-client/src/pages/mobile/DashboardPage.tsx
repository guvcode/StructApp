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
        <h1 className="text-2xl font-bold text-ink">Welcome, {userName}</h1>
        <p className="text-xs font-mono text-steel-light uppercase tracking-wider">Dashboard</p>
      </div>

      <div className="status-card rounded-xl p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-4 h-full bg-signal" />
        <div className="flex items-center gap-4 pl-2">
          <div className="w-10 h-10 rounded-lg bg-signal/20 border border-signal/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm2 2h12v12H6V6zm2 2v2h2V8H8zm0 4v2h2v-2H8zm4-4v6h2V8h-2zm0 8v2h2v-2h-2zm4-8v2h2V8h-2zm0 4v4h2v-4h-2z"/></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{pendingCount}</p>
            <p className="text-xs text-signal-light mt-0.5">items pending sync</p>
          </div>
        </div>
      </div>

      {returned.length > 0 && (
        <div>
          <div className="section-head mb-2">
            <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Returned to You</h2>
            <span className="font-mono text-sm text-steel-light">{returned.length}</span>
          </div>
          {returned.map((insp) => {
            const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string };
            return (
            <button
              key={i.id}
              type="button"
              onClick={() => navigate(`/m/inspections/${i.id}`)}
              className="def-card returned rounded-xl border border-line mb-2 cursor-pointer hover:shadow-sm transition-shadow w-full text-left"
            >
              <div className="stripe" style={{ background: 'var(--red-tag)' }}></div>
              <div className="def-body p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded font-mono uppercase tracking-wider" style={{ background: 'var(--red-bg)', color: 'var(--red-tag)' }}>
                    Returned
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink">
                  {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? 'Unknown client'}
                </p>
                <p className="text-xs text-steel mt-0.5">
                  {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id} — due {formatDate(i.scheduledDate ?? i.scheduled_date) || 'Not yet scheduled'}
                </p>
               </div>
             </button>
             );
           })}
         </div>
       )}

       {submitted.length > 0 && (
        <div>
          <div className="section-head mb-2">
            <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Submitted</h2>
            <span className="font-mono text-sm text-steel-light">{submitted.length}</span>
          </div>
          {submitted.map((insp) => {
            const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string };
            return (
            <button
              key={i.id}
              type="button"
              onClick={() => navigate(`/m/inspections/${i.id}`)}
              className="def-card assigned rounded-xl border border-line mb-2 cursor-pointer hover:shadow-sm transition-shadow w-full text-left"
            >
              <div className="stripe" style={{ background: 'var(--blue-tag)' }}></div>
              <div className="def-body p-3">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-xs font-semibold px-2 py-0.5 rounded font-mono uppercase tracking-wider" style={{ background: 'var(--blue-bg)', color: 'var(--blue-tag)' }}>
                     Submitted
                   </span>
                   <span className="text-xs text-steel-light font-mono">{formatDate(i.scheduledDate ?? i.scheduled_date) || 'Not yet scheduled'}</span>
                </div>
                <p className="text-base font-semibold text-ink">
                  {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? i.clientId ?? i.client_id}
                </p>
                <p className="text-sm text-steel mt-0.5">
                  {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id}
                </p>
               </div>
             </button>
             );
           })}
         </div>
       )}

       {approved.length > 0 && (
        <div>
          <div className="section-head mb-2">
            <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Approved</h2>
            <span className="font-mono text-sm text-steel-light">{approved.length}</span>
          </div>
          {approved.map((insp) => {
            const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string };
            return (
            <button
              key={i.id}
              type="button"
              onClick={() => navigate(`/m/inspections/${i.id}`)}
              className="def-card low rounded-xl border border-line mb-2 cursor-pointer hover:shadow-sm transition-shadow w-full text-left"
            >
              <div className="stripe" style={{ background: 'var(--green)' }}></div>
              <div className="def-body p-3">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-xs font-semibold px-2 py-0.5 rounded font-mono uppercase tracking-wider" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                     Approved
                   </span>
                   <span className="text-xs text-steel-light font-mono">{formatDate(i.scheduledDate ?? i.scheduled_date) || 'Not yet scheduled'}</span>
                </div>
                <p className="text-base font-semibold text-ink">
                  {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? i.clientId ?? i.client_id}
                </p>
                <p className="text-sm text-steel mt-0.5">
                  {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id}
                </p>
               </div>
             </button>
             );
           })}
         </div>
       )}

       <div>
        <div className="section-head mb-2">
          <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Active Inspections</h2>
          <span className="font-mono text-sm text-steel-light">{assigned.length}</span>
        </div>
        {assigned.map((insp) => {
          const i = insp as { id: string; clientId?: string; client_id?: string; siteId?: string; site_id?: string; status: string; scheduledDate?: string | null; scheduled_date?: string; structureId?: string; structure_id?: string };
          const statusColor = i.status === InspectionStatus.InProgress ? 'var(--amber)' : 'var(--blue-tag)';
          const statusLabel = i.status === InspectionStatus.InProgress ? 'In Progress' : 'Assigned';
          return (
          <button
            key={i.id}
            type="button"
            onClick={() => navigate(`/m/inspections/${i.id}`)}
            className="def-card assigned rounded-xl border border-line mb-2 cursor-pointer hover:shadow-sm transition-shadow w-full text-left"
          >
            <div className="stripe" style={{ background: statusColor }}></div>
            <div className="def-body p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded font-mono uppercase tracking-wider" style={{ background: i.status === InspectionStatus.InProgress ? 'var(--amber-bg)' : 'var(--blue-bg)', color: statusColor }}>
                  {statusLabel}
                </span>
                <span className="text-xs text-steel-light font-mono">{formatDate(i.scheduledDate ?? i.scheduled_date)}</span>
              </div>
              <p className="text-base font-semibold text-ink">
                {clientLookup.get(i.clientId ?? i.client_id ?? '') ?? i.clientId ?? i.client_id}
              </p>
              <p className="text-sm text-steel mt-0.5">
                {siteLookup.get(i.siteId ?? i.site_id ?? '') ?? i.siteId ?? i.site_id}
                {structureLookup.get(i.structureId ?? i.structure_id ?? '') ? ` — ${structureLookup.get(i.structureId ?? i.structure_id ?? '')}` : ''}
               </p>
             </div>
           </button>
           );
         })}
         {assigned.length === 0 && (
          <div className="text-center py-10">
            <svg className="w-12 h-12 mx-auto text-steel-light mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <p className="text-steel text-sm">No assigned inspections.</p>
            <p className="text-steel-light text-xs mt-1">Pull the latest data from Sync to check.</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => navigate('/m/sync')}
          className="btn primary w-full"
          aria-label="Sync Now"
        >
          Sync Now
        </button>
        <button
          onClick={() => navigate('/m/structures/search')}
          className="btn secondary w-full"
          aria-label="Scan QR code to find structure"
        >
          Scan QR
        </button>
        <button
          onClick={() => navigate('/m/pending-structures/new')}
          className="btn secondary w-full"
          aria-label="Discover new on-site structure"
        >
          Discover
        </button>
      </div>

      {syncState && (
        <p className="text-xs text-steel-light text-center font-mono">
          Last sync: {new Date(syncState.lastSync).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}