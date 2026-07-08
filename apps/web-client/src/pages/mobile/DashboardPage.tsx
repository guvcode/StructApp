import { useNavigate } from 'react-router-dom';
import { useInspectionsByAssignee } from '../../hooks/useInspections';
import { useSyncState } from '../../hooks/useSync';
import { getSession } from '../../lib/authStore';
import Skeleton from '../../components/Skeleton';

export default function DashboardPage() {
  const navigate = useNavigate();
  const session = getSession();
  const userId = session?.user?.id ?? 'u-eleanor';
  const { data: inspections = [], isLoading, isError } = useInspectionsByAssignee(userId);
  const { data: syncState } = useSyncState();
  const pendingCount = syncState?.pendingCount ?? 0;

  if (isLoading) return (
    <div className="space-y-4 p-4 animate-fadeIn">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
  if (isError) return <div className="p-6 text-red-600 text-center">Failed to load dashboard data.</div>;

  const assigned = inspections.filter(i => i.status === 'Assigned' || i.status === 'InProgress' || i.status === 'Draft');
  const returned = inspections.filter(i => i.status === 'Returned');

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
          {returned.map(insp => (
            <button
              key={insp.id}
              onClick={() => navigate(`/m/inspections/${insp.id}`)}
              className="w-full bg-red-50 border border-red-200 rounded-lg p-3 mb-2 text-left"
              aria-label={`View returned inspection for ${insp.assignee_name ?? insp.assigned_to}`}
            >
              <p className="text-sm font-semibold text-red-800">{insp.assignee_name ?? insp.assigned_to}</p>
              <p className="text-xs text-red-600">Returned — due {insp.scheduled_date}</p>
            </button>
          ))}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-text-primary mb-1">Assigned Inspections ({assigned.length})</h3>
        {assigned.map(insp => (
          <button
            key={insp.id}
            onClick={() => navigate(`/m/inspections/${insp.id}`)}
            className="w-full bg-surface-primary border border-border rounded-lg p-3 mb-2 text-left"
            aria-label={`View assigned inspection for ${insp.site_id}`}
          >
            <p className="text-sm font-semibold text-text-primary">{insp.site_id}</p>
            <p className="text-xs text-text-secondary">{insp.status} — {insp.scheduled_date}</p>
          </button>
        ))}
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