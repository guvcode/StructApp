import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInspection, useDeficienciesForInspection } from '../../hooks/useInspections';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Skeleton from '../../components/Skeleton';
import { formatDate } from '../../utils/dates';
import { InspectionStatus } from '../../types';
import { getReassignmentHistory } from '../../services/api/inspections';

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: inspection, isLoading } = useInspection(id);
  const { data: deficiencies = [] } = useDeficienciesForInspection(id);
  const { data: reassignmentHistory = [] } = useQuery({
    queryKey: ['reassignment-history', id],
    queryFn: () => getReassignmentHistory(id!),
    enabled: !!id,
  });

  const { data: allSites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => apiClient<Array<{ id: string; name: string }>>(ENDPOINTS.sites.list),
  });
  const siteLookup = useMemo(() => {
    const map = new Map<string, string>();
    allSites.forEach(s => map.set(s.id, s.name));
    return map;
  }, [allSites]);

  if (isLoading) return <div className="p-4"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32 w-full rounded-lg" /></div>;
  if (!inspection) return <div className="p-4"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32 w-full rounded-lg" /></div>;

  const siteName = siteLookup.get(inspection.site_id) ?? inspection.site_id;

   return (
     <div className="space-y-4">
       <button onClick={() => navigate('/m/dashboard')} className="text-sm text-accent">&larr; Back</button>
       <h2 className="text-lg font-bold text-text-primary">{siteName}</h2>
       <div className="status-card rounded-xl p-4 mb-4 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-4 h-full bg-signal" />
         <div className="flex items-center gap-4 pl-2">
           <div className="w-10 h-10 rounded-lg bg-signal/20 border border-signal/40 flex items-center justify-center flex-shrink-0">
             <svg className="w-5 h-5 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm2 2h12v12H6V6zm2 2v2h2V8H8zm0 4v2h2v-2H8zm4-4v6h2V8h-2zm0 8v2h2v-2h-2zm4-8v2h2V8h-2zm0 4v4h2v-4h-2z"/></svg>
           </div>
           <div>
             <p className="text-2xl font-bold text-white">{inspection.status || 'Assigned'}</p>
             <p className="text-xs text-signal-light mt-0.5">Inspections pending sync</p>
           </div>
         </div>
       </div>

        {inspection.status === InspectionStatus.Returned && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            This inspection was returned for corrections.
          </div>
        )}

        {(inspection.assignee_name || inspection.assigned_to) && (
          <div className="bg-surface-primary border border-border rounded-lg p-3">
            <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Assigned Contractor</p>
            <p className="text-sm text-text-primary font-medium">
              {inspection.assignee_name ? `${inspection.assignee_name}${inspection.assignee_email ? ` (${inspection.assignee_email})` : ''}` : inspection.assigned_to}
            </p>
          </div>
        )}

        {reassignmentHistory.length > 0 && (
          <div className="bg-surface-primary border border-border rounded-lg p-3">
            <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-2">Reassignment Trail</p>
            <div className="space-y-2">
              {reassignmentHistory.map((entry) => (
                <div key={entry.log_id} className="border-b border-border last:border-b-0 pb-2 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {entry.old_inspector_name || entry.old_inspector_id}
                      {' → '}
                      {entry.new_inspector_name || entry.new_inspector_id}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {entry.reason && <p className="text-xs text-text-secondary mt-1">Reason: {entry.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

       <div>
        <h3 className="font-semibold text-text-primary mb-1">Deficiencies / Findings ({deficiencies.length})</h3>
        {deficiencies.map(def => {
          const defId = def.id || (def as unknown as Record<string, unknown>).deficiency_id as string;
          return (
          <div
            key={defId}
            onClick={() => navigate(`/m/deficiencies/${defId}`)}
            className="bg-surface-primary border border-border rounded-lg p-3 mb-2 cursor-pointer"
          >
            <p className="text-sm font-semibold text-text-primary">{def.title}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs">
              {def.risk_rating && (
                <span className={`px-1.5 py-0.5 rounded ${
                  def.risk_rating === 'High' ? 'bg-red-100 text-red-700' :
                  def.risk_rating === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {def.risk_rating}
                </span>
              )}
              <span className="text-text-secondary">{def.priority_tier}</span>
              {def.category && <span className="text-text-secondary">{def.category}</span>}
              {def.sub_component && <span className="text-text-secondary">{def.sub_component}</span>}
            </div>
          </div>
          );
        })}
        {deficiencies.length === 0 && (
          <p className="text-text-secondary text-sm py-2">No deficiencies recorded yet.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {(inspection.status === InspectionStatus.Assigned || inspection.status === InspectionStatus.InProgress || inspection.status === InspectionStatus.Draft) && (
          <>
            <button
              onClick={() => navigate(`/m/deficiencies/new?inspection_id=${id}`)}
              className="flex-1 px-3 py-2 bg-signal text-white rounded-lg text-sm"
            >
              Add Deficiency
            </button>
            <button
              onClick={() => navigate(`/m/inspections/${id}/submit`)}
              className="flex-1 px-3 py-2 bg-surface-secondary border border-border text-text-primary rounded-lg text-sm"
            >
              Submit Inspection
            </button>
            <button
              onClick={() => navigate(`/m/pending-structures/new`)}
              className="flex-1 px-3 py-2 bg-surface-secondary border border-border text-text-primary rounded-lg text-sm"
            >
              Discover
            </button>
          </>
        )}
        {(inspection.status === InspectionStatus.Submitted || inspection.status === InspectionStatus.Approved) && (
          <div className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-secondary text-center">
            This inspection is {inspection.status.toLowerCase()} and is read-only.
          </div>
        )}
        <button
          onClick={() => navigate(`/m/inspections/${id}/history`)}
          className="flex-1 px-3 py-2 bg-surface-secondary border border-border text-text-primary rounded-lg text-sm"
        >
          View History
        </button>
      </div>
    </div>
  );
}