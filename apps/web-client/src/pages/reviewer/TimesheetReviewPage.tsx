import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTimesheetGroups } from '../../hooks/useTimesheets';
import { useQueryClient } from '@tanstack/react-query';
import { useClientScope } from '../../hooks/useClientScope';
import { useSearchSort } from '../../hooks/useSearchSort';
import ApproveRejectModal from '../../components/ApproveRejectModal';
import TimesheetDetailModal from '../../components/TimesheetDetailModal';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { TIMESHEET_STATUS_STYLES } from '../../utils/statusMaps';
import type { TimesheetGroup, Timesheet } from '../../types/index';

function getGroupStatus(group: TimesheetGroup): string {
  const statuses = new Set(group.entries.map(e => e.status));
  if (statuses.size === 1) return group.entries[0]?.status ?? 'Unknown';
  return 'Mixed';
}

export default function TimesheetReviewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: groups = [], isLoading, isError, error } = useTimesheetGroups();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [actionTarget, setActionTarget] = useState<{ groupId: string; entryIds: string[]; entryCount: number; action: 'approve' | 'reject' } | null>(null);
  const [detailTarget, setDetailTarget] = useState<Timesheet | null>(null);

  useClientScope(() => queryClient.invalidateQueries({ queryKey: ['timesheets'] }));

  const { search, setSearch, sortKey, sortDir, toggleSort, sortedFiltered } = useSearchSort(groups, ['user_name', 'id'], 'week_start');
  const statusFilter = searchParams.get('status') || 'All';

  const FILTERS = ['All', 'Submitted', 'Approved', 'Rejected', 'Mixed'];
  const filteredGroups = statusFilter === 'All' ? sortedFiltered : sortedFiltered.filter(g => getGroupStatus(g) === statusFilter);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const canActOn = (group: TimesheetGroup) => group.entries.some(e => e.status === 'Submitted');

  const handleApprove = (group: TimesheetGroup) => {
    const submittedEntries = group.entries.filter(e => e.status === 'Submitted');
    setActionTarget({ groupId: group.id, entryIds: submittedEntries.map(e => e.id), entryCount: submittedEntries.length, action: 'approve' });
  };

  const handleReject = (group: TimesheetGroup) => {
    const submittedEntries = group.entries.filter(e => e.status === 'Submitted');
    setActionTarget({ groupId: group.id, entryIds: submittedEntries.map(e => e.id), entryCount: submittedEntries.length, action: 'reject' });
  };

  if (isLoading) return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <Skeleton className="h-8 w-56 mb-6" />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
  if (isError) return <div className="p-6 text-red-600 text-center">{(error as Error)?.message || 'Failed to load timesheets.'}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <button onClick={() => navigate(-1)} className="text-sm text-accent mb-4">&larr; Back</button>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Timesheet Review</h1>

      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setSearchParams({ status: f === 'All' ? '' : f })}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === f
                ? 'bg-accent text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {f}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by worker..."
          className="ml-auto px-3 py-1 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent w-48"
          aria-label="Search timesheet groups"
        />
      </div>

      {filteredGroups.length === 0 ? (
        <Card padding="lg" className="shadow-card">
          <EmptyState icon="inbox" title="No timesheets pending review" description="All submitted timesheets have been reviewed." />
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedFiltered.map(group => {
            const groupStatus = getGroupStatus(group);
            const isExpanded = expanded.has(group.id);

            return (
              <Card key={group.id} padding="none" className="shadow-card overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between bg-surface-secondary/30 border-b border-border">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpand(group.id)}
                      className="p-1 hover:bg-surface-secondary rounded transition-colors shrink-0"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary truncate">{group.user_name ?? group.user_id}</p>
                      <p className="text-xs text-text-secondary">
                        {group.week_start} – {group.week_end}
                        <span className="mx-2">·</span>
                        {group.entries.length} entries
                        <span className="mx-2">·</span>
                        {group.total_hours}h total
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge label={groupStatus} map={TIMESHEET_STATUS_STYLES} />
                    </div>
                    {canActOn(group) && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(group)}
                          className="px-3 py-1.5 text-xs font-medium border border-green-200 text-green-700 rounded-md hover:bg-green-50 transition-colors shadow-sm"
                        >Approve</button>
                        <button
                          onClick={() => handleReject(group)}
                          className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 rounded-md hover:bg-red-50 transition-colors shadow-sm"
                        >Reject</button>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left bg-surface-secondary/20">
                          <th className="px-6 py-2 text-text-secondary font-semibold">Date</th>
                          <th className="py-2 text-text-secondary font-semibold">Work Type</th>
                          <th className="py-2 text-text-secondary font-semibold">Hours</th>
                          <th className="py-2 text-text-secondary font-semibold">Status</th>
                          <th className="py-2 text-text-secondary font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.entries.map(entry => (
                          <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors cursor-pointer" onClick={() => setDetailTarget(entry)}>
                            <td className="px-6 py-2.5 text-text-primary">{entry.entry_date}</td>
                            <td className="py-2.5 text-text-secondary">{entry.work_type ?? '—'}</td>
                            <td className="py-2.5 text-text-secondary font-semibold">{entry.hours}h</td>
                            <td className="py-2.5"><StatusBadge label={entry.status} map={TIMESHEET_STATUS_STYLES} /></td>
                            <td className="py-2.5 text-text-secondary max-w-xs truncate">{entry.description ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {actionTarget && (
        <ApproveRejectModal
          groupId={actionTarget.groupId}
          entryIds={actionTarget.entryIds}
          entryCount={actionTarget.entryCount}
          action={actionTarget.action}
          onClose={() => setActionTarget(null)}
          onDone={() => { setActionTarget(null); queryClient.invalidateQueries({ queryKey: ['timesheets'] }); }}
        />
      )}

      {detailTarget && (
        <TimesheetDetailModal entry={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </div>
  );
}