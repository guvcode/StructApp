import { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInspections } from '../../hooks/useInspections';
import { useSites } from '../../hooks/useRegister';
import { getActiveClientId } from '../../lib/authStore';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { InspectionStatus } from '../../types/index';
import { ReturnInspectionModal } from '../../components/ReturnInspectionModal';
import { ApproveInspectionModal } from '../../components/ApproveInspectionModal';
import { formatDate } from '../../utils/dates';
import { useClientScope } from '../../hooks/useClientScope';
import { useSearchSort } from '../../hooks/useSearchSort';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { INSPECTION_STATUS_STYLES } from '../../utils/statusMaps';
import { useQueryClient } from '@tanstack/react-query';

export default function InspectionListPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { data: inspections = [], isLoading, isError, error } = useInspections();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const [returnTarget, setReturnTarget] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<string | null>(null);

  useClientScope(() => client.invalidateQueries({ queryKey: ['inspections'] }));

  const { data: allSites = [] } = useSites(undefined, getActiveClientId());
  const siteLookup = useMemo(() => {
    const map = new Map<string, string>();
    allSites.forEach(s => map.set(s.id, s.name));
    return map;
  }, [allSites]);

  const { data: allStructures = [] } = useQuery({
    queryKey: ['structures'],
    queryFn: () => apiClient<Array<{ id: string; name: string; identifier: string }>>(ENDPOINTS.structures.list),
  });
  const structureLookup = useMemo(() => {
    const map = new Map<string, string>();
    allStructures.forEach(s => map.set(s.id, s.name || s.identifier));
    return map;
  }, [allStructures]);

  function getSiteName(insp: { site_id: string; site_name?: string }): string {
    return insp.site_name || siteLookup.get(insp.site_id) || insp.site_id;
  }

  const filtered = statusFilter === 'all'
    ? inspections
    : inspections.filter(i => i.status === statusFilter);

  const { search, setSearch, sortKey, sortDir, toggleSort, sortedFiltered } = useSearchSort(filtered, ['site_id', 'id', 'assignee_name'], 'created_at');

  if (isLoading) return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 w-20 rounded-full" count={6} />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
  if (isError) return <div className="p-6 text-red-600 text-center">{(error as Error)?.message || 'Failed to load inspections.'}</div>;

  const grouped = sortedFiltered.reduce<Record<string, typeof inspections>>((acc, insp) => {
    const siteName = getSiteName(insp);
    if (!acc[siteName]) acc[siteName] = [];
    acc[siteName].push(insp);
    return acc;
  }, {});

  const siteNames = Object.keys(grouped).sort();

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <button onClick={() => navigate(-1)} className="text-sm text-accent mb-4">&larr; Back</button>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Inspections</h1>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3 flex-wrap">
          {['all', InspectionStatus.Submitted, InspectionStatus.Returned, InspectionStatus.Approved, InspectionStatus.InProgress, InspectionStatus.Draft, InspectionStatus.Assigned].map(s => (
            <button 
              key={s} 
              onClick={() => { setSearchParams({ status: s === 'all' ? '' : s }); setSearchParams(s === 'all' ? {} : { status: s }); }} 
              aria-label={`Filter by status: ${s === 'all' ? 'All' : s}`} 
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                statusFilter === s 
                  ? 'bg-accent text-white border-accent shadow-sm' 
                  : 'border-border text-text-primary hover:bg-surface-hover'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <Link
          to="/register/inspections/new"
          className="px-4 py-2.5 bg-accent text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all shrink-0"
        >
          New Inspection
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by site, inspector, or inspection ID..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Search inspections"
        />
      </div>

      <div className="space-y-6">
        <p className="text-sm text-text-secondary font-medium">Sites with inspections: {siteNames.join(', ')}</p>
        {siteNames.map(siteName => (
          <Card key={siteName} padding="none" className="shadow-card">
            <div className="px-6 py-3 bg-surface-secondary border-b border-border">
              <span className="text-sm font-semibold text-text-primary">
                {siteName} <span className="text-text-secondary font-normal">({grouped[siteName]!.length} inspection{grouped[siteName]!.length !== 1 ? 's' : ''})</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Inspections table">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-3 text-text-secondary font-semibold">Site</th>
                    <th className="py-3 text-text-secondary font-semibold">Structure</th>
                    <th className="py-3 text-text-secondary font-semibold">Assignee</th>
                    <th className="py-3 text-text-secondary font-semibold">Status</th>
                    <th className="py-3 text-text-secondary font-semibold">Scheduled</th>
                    <th className="py-3 text-text-secondary font-semibold">Notes</th>
                    <th className="py-3 text-text-secondary font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[siteName]!.map(insp => {
                    const isSubmitted = insp.status === InspectionStatus.Submitted;
                    const isApproved = insp.status === InspectionStatus.Approved;
                    return (
                      <tr key={insp.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                        <td className="px-6 py-4 text-text-primary font-medium">{getSiteName(insp)}</td>
                        <td className="py-4 text-text-primary">{structureLookup.get(insp.structure_id ?? '') ?? insp.structure_id ?? '—'}</td>
                        <td className="py-4 text-text-primary">{insp.assignee_name ? `${insp.assignee_name}${insp.assignee_email ? ` (${insp.assignee_email})` : ''}` : insp.assigned_to}</td>
                        <td className="py-4">
                          <StatusBadge label={insp.status} map={INSPECTION_STATUS_STYLES} />
                        </td>
                        <td className="py-4 text-text-secondary">{formatDate(insp.scheduled_date) || '—'}</td>
                        <td className="py-4 text-xs text-text-secondary max-w-xs truncate">
                          {insp.status === InspectionStatus.Returned && insp.return_reason
                            ? insp.return_reason
                            : '—'
                          }
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2 items-center">
                            <Link
                              to={`/inspections/${insp.id}/detail`}
                              className="px-3 py-1.5 text-xs font-medium border border-border text-text-primary rounded-md hover:bg-surface-hover transition-colors shadow-sm"
                            >
                              View
                            </Link>
                            {isSubmitted ? (
                              <>
                                <button 
                                  onClick={() => setReturnTarget(insp.id)} 
                                  className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 rounded-md hover:bg-red-50 transition-colors shadow-sm" 
                                  aria-label={`Return inspection ${insp.id}`}
                                >
                                  Return
                                </button>
                                <button 
                                  onClick={() => setApproveTarget(insp.id)} 
                                  className="px-3 py-1.5 text-xs font-medium border border-green-200 text-green-700 rounded-md hover:bg-green-50 transition-colors shadow-sm" 
                                  aria-label={`Approve inspection ${insp.id}`}
                                >
                                  Approve
                                </button>
                              </>
                            ) : isApproved ? (
                              <span className="text-xs text-text-secondary italic">Locked</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
        {siteNames.length === 0 && (
          <Card padding="lg" className="shadow-card">
            <EmptyState icon="search" title="No inspections match the filter" description="Try adjusting your filter to see more results." />
          </Card>
        )}
      </div>

      {returnTarget && <ReturnInspectionModal inspectionId={returnTarget} onClose={() => setReturnTarget(null)} onReturn={() => { setReturnTarget(null); client.invalidateQueries({ queryKey: ['inspections'] }); }} />}
      {approveTarget && <ApproveInspectionModal inspectionId={approveTarget} onClose={() => setApproveTarget(null)} onApprove={() => { setApproveTarget(null); client.invalidateQueries({ queryKey: ['inspections'] }); }} />}
    </div>
  );
}