import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRemediationDeficiencies, useHasRemediationEvidence } from '../../hooks/useRemediation';
import { useQueryClient } from '@tanstack/react-query';
import { RemediationStatus } from '../../types/index';
import { getUserRole } from '../../lib/authStore';
import { useClientScope } from '../../hooks/useClientScope';
import { useSearchSort } from '../../hooks/useSearchSort';
import VerifyClosureModal from '../../components/VerifyClosureModal';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { REMEDIATION_STATUS_STYLES } from '../../utils/statusMaps';

const STATUS_LABELS: Record<string, string> = {
  Open: 'Open',
  Remediation_Scheduled: 'Scheduled',
  Remediated_Pending_Verification: 'Pending Verification',
  Verified_Closed: 'Verified Closed',
};

export default function RemediationQueuePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: deficiencies = [], isLoading, isError, error } = useRemediationDeficiencies();
  const [verifyTarget, setVerifyTarget] = useState<string | null>(null);
  const statusFilter = searchParams.get('status') || 'all';
  const role = getUserRole();

  useClientScope(() => queryClient.invalidateQueries({ queryKey: ['remediation'] }));

  const filtered = statusFilter === 'all'
    ? deficiencies
    : deficiencies.filter(d => d.remediation_status === statusFilter);

  const { search, setSearch, sortKey, sortDir, toggleSort, sortedFiltered } = useSearchSort(filtered, ['title', 'site_name', 'category'], 'priority_tier');

  if (isLoading) return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <Skeleton className="h-8 w-56 mb-6" />
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 w-24 rounded-full" count={4} />
      </div>
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
  if (isError) return <div className="p-6 text-red-600 text-center">{(error as Error)?.message || 'Failed to load remediation deficiencies.'}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <button onClick={() => navigate('/reviewer/dashboard')} className="text-sm text-accent mb-4">&larr; Dashboard</button>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Remediation Queue</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        {['all', RemediationStatus.Open, RemediationStatus.RemediationScheduled, RemediationStatus.PendingVerification, RemediationStatus.VerifiedClosed].map(s => (
          <button
            key={s}
            onClick={() => { setSearchParams({ status: s === 'all' ? '' : s }); setSearchParams(s === 'all' ? {} : { status: s }); }}
            aria-label={`Filter by status: ${STATUS_LABELS[s] ?? 'All'}`}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
              statusFilter === s 
                ? 'bg-accent text-white border-accent shadow-sm' 
                : 'border-border text-text-primary hover:bg-surface-hover'
            }`}
          >
            {STATUS_LABELS[s] ?? 'All'}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, site, or category..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Search remediation items"
        />
      </div>

      {sortedFiltered.length === 0 ? (
        <Card padding="lg" className="shadow-card">
          <EmptyState icon="check" title={statusFilter === 'all' ? 'No deficiencies pending remediation' : 'No deficiencies match this filter'} description={statusFilter === 'all' ? 'All open deficiencies have been addressed or scheduled.' : 'Try a different status filter.'} />
        </Card>
      ) : (
        <Card padding="none" className="shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Remediation queue">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-text-secondary font-semibold">Status</th>
                  <th className="py-3 text-text-secondary font-semibold">Priority</th>
                  <th className="py-3 text-text-secondary font-semibold">Structure</th>
                  <th className="py-3 text-text-secondary font-semibold">Deficiency</th>
                  <th className="py-3 text-text-secondary font-semibold">Category</th>
                  <th className="py-3 text-text-secondary font-semibold">Due Date</th>
                  <th className="py-3 text-text-secondary font-semibold">Evidence</th>
                  <th className="py-3 text-text-secondary font-semibold">Owner</th>
                  <th className="py-3 text-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map(d => (
                  <RemediationRow key={d.id} deficiency={d} role={role} onVerify={setVerifyTarget} onOpen={() => navigate(`/deficiencies/${d.id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {verifyTarget && (
        <VerifyClosureModal
          deficiencyId={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onVerified={() => { setVerifyTarget(null); queryClient.invalidateQueries({ queryKey: ['remediation'] }); }}
        />
      )}
    </div>
  );
}

function RemediationRow({ deficiency, role, onVerify, onOpen }: { deficiency: import('../../types').Deficiency; role: string | null; onVerify: (id: string) => void; onOpen: () => void }) {
  const defId = deficiency.id || (deficiency as unknown as Record<string, unknown>).deficiency_id as string;
  const { data: hasEvidence } = useHasRemediationEvidence(defId);
  const canVerify = deficiency.remediation_status === 'Remediated_Pending_Verification' && hasEvidence === true && (role === 'reviewer' || role === 'admin');

  return (
    <tr className="border-b border-border hover:bg-surface-hover transition-colors">
      <td className="px-6 py-4">
        <StatusBadge label={deficiency.remediation_status ?? ''} map={REMEDIATION_STATUS_STYLES} />
                      </td>
      <td className="py-4">
        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
          deficiency.priority_tier === 'P1' 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : deficiency.priority_tier === 'P2'
            ? 'bg-orange-50 text-orange-700 border-orange-200'
            : deficiency.priority_tier === 'P3'
            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
            : 'bg-gray-50 text-gray-600 border-gray-200'
        }`}>
          {deficiency.priority_tier}
        </span>
      </td>
      <td className="py-4 text-text-secondary">{deficiency.site_name ?? '—'}</td>
      <td className="py-4 text-text-primary font-medium max-w-[200px] truncate">{deficiency.title}</td>
      <td className="py-4 text-text-secondary text-xs">{deficiency.category ?? '—'}</td>
      <td className="py-4 text-text-secondary">{deficiency.remediation_due_date ?? '—'}</td>
      <td className="py-4">
        {hasEvidence ? (
          <span className="text-green-600 text-xs font-semibold">Has</span>
        ) : (
          <span className="text-text-secondary text-xs">None</span>
        )}
      </td>
      <td className="py-4 text-text-secondary">{deficiency.assignee_name ?? '—'}</td>
      <td className="py-4">
        <div className="flex gap-2">
          <button
            onClick={onOpen}
            className="px-3 py-1.5 text-xs font-medium border border-border text-text-primary rounded-md hover:bg-surface-hover transition-colors shadow-sm"
            aria-label={`Open deficiency ${deficiency.title}`}
          >
            Open
          </button>
          {deficiency.remediation_status === 'Remediated_Pending_Verification' && canVerify && (
            <button
              onClick={() => onVerify(defId)}
              className="px-3 py-1.5 text-xs font-medium border border-green-200 text-green-700 rounded-md hover:bg-green-50 transition-colors shadow-sm"
              aria-label={`Verify closure for ${deficiency.title}`}
            >
              Verify Closure
            </button>
          )}
          {deficiency.remediation_status === 'Remediated_Pending_Verification' && !hasEvidence && (
            <span className="px-3 py-1.5 text-xs text-text-secondary italic">Needs evidence</span>
          )}
        </div>
      </td>
    </tr>
  );
}