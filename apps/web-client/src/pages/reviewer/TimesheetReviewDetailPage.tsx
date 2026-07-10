import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApproveTimesheet, useRejectTimesheet } from '../../hooks/useTimesheets';
import { getSession } from '../../lib/authStore';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { TIMESHEET_STATUS_STYLES } from '../../utils/statusMaps';
import { TimesheetStatus } from '../../types';
import type { Timesheet } from '../../types/index';

interface DetailState {
  user_id: string;
  inspection_id: string;
  entries: Timesheet[];
  total_hours: number;
  status: string;
}

export default function TimesheetReviewDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as DetailState | null;
  const queryClient = useQueryClient();
  const approveMutation = useApproveTimesheet();
  const rejectMutation = useRejectTimesheet();

  const [rejectTarget, setRejectTarget] = useState<{ id: string; reason: string } | null>(null);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkReason, setBulkReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!state || !state.entries) {
    return (
      <div className="p-8 max-w-3xl mx-auto animate-fadeIn">
        <button onClick={() => navigate('/timesheets/review')} className="text-sm text-accent mb-4">&larr; Back to Timesheet Review</button>
        <div className="bg-surface-elevated rounded-lg border border-border/50 p-8 shadow-sm">
          <EmptyState icon="error" title="No entries loaded" description="Select a cell from the timesheet grid to view details." action={{ label: 'Go to Timesheet Review', onClick: () => navigate('/timesheets/review') }} />
        </div>
      </div>
    );
  }

  const session = getSession();
  const approverName = session?.user?.display_name ?? session?.user?.email ?? 'Reviewer';

  const submittedEntries = state.entries.filter(e => e.status === TimesheetStatus.Submitted);
  const contractorName = state.entries[0]?.user_name ?? state.user_id;
  const inspectionName = state.entries[0]?.inspection_name || 'Other';

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id, approverName }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['timesheets'] });
        setSuccessMsg('Entry approved successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      },
    });
  };

  const handleReject = (id: string, reason: string) => {
    rejectMutation.mutate({ id, reason }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['timesheets'] });
        setRejectTarget(null);
        setSuccessMsg('Entry rejected successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      },
    });
  };

  const handleBulkApprove = () => {
    submittedEntries.forEach(entry => {
      approveMutation.mutate({ id: entry.id, approverName });
    });
    setBulkAction(null);
    setSuccessMsg(`Approving ${submittedEntries.length} entries...`);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      setSuccessMsg('');
    }, 1000);
  };

  const handleBulkReject = () => {
    submittedEntries.forEach(entry => {
      rejectMutation.mutate({ id: entry.id, reason: bulkReason });
    });
    setBulkAction(null);
    setBulkReason('');
    setSuccessMsg(`Rejecting ${submittedEntries.length} entries...`);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      setSuccessMsg('');
    }, 1000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
      <button onClick={() => navigate('/timesheets/review')} className="text-sm text-accent mb-4">&larr; Back to Timesheet Review</button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{contractorName}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {inspectionName}
            <span className="mx-2">·</span>
            {state.total_hours}h total
            <span className="mx-2">·</span>
            {state.entries.length} entries
          </p>
        </div>
        {submittedEntries.length > 0 && (
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => setBulkAction('approve')}
              className="px-4 py-2 text-sm font-medium border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
            >
              Approve All ({submittedEntries.length})
            </button>
            <button
              onClick={() => setBulkAction('reject')}
              className="px-4 py-2 text-sm font-medium border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
            >
              Reject All ({submittedEntries.length})
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{successMsg}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-left bg-surface-secondary/20">
              <th className="px-6 py-3 text-text-secondary font-semibold">Date</th>
              <th className="px-6 py-3 text-text-secondary font-semibold">Work Type</th>
              <th className="px-6 py-3 text-text-secondary font-semibold">Hours</th>
              <th className="px-6 py-3 text-text-secondary font-semibold">Status</th>
              <th className="px-6 py-3 text-text-secondary font-semibold">Description</th>
              <th className="px-6 py-3 text-text-secondary font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.entries.map(entry => (
              <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-hover/30 transition-colors">
                <td className="px-6 py-3 text-text-primary">{entry.entry_date}</td>
                <td className="px-6 py-3 text-text-secondary">{entry.work_type ?? '—'}</td>
                <td className="px-6 py-3 text-text-primary font-semibold">{entry.hours}h</td>
                <td className="px-6 py-3"><StatusBadge label={entry.status} map={TIMESHEET_STATUS_STYLES} /></td>
                <td className="px-6 py-3 text-text-secondary max-w-xs truncate">{entry.notes ?? '—'}</td>
                <td className="px-6 py-3">
                  {entry.status === TimesheetStatus.Submitted ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(entry.id)}
                        disabled={approveMutation.isPending}
                        className="px-2.5 py-1 text-xs font-medium border border-green-200 text-green-700 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget({ id: entry.id, reason: '' })}
                        className="px-2.5 py-1 text-xs font-medium border border-red-200 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-text-muted text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Reject timesheet entry">
          <div className="bg-surface-elevated rounded-lg p-8 w-full max-w-lg mx-4 shadow-modal animate-slideUp">
            <h3 className="text-xl font-bold text-text-primary mb-2">Reject Entry</h3>
            <p className="text-sm text-text-secondary mb-6">Provide a reason for rejecting this timesheet entry.</p>
            <textarea
              value={rejectTarget.reason}
              onChange={e => setRejectTarget(prev => prev ? { ...prev, reason: e.target.value } : null)}
              rows={3}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-text-primary bg-surface-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors mb-4"
              placeholder="Explain why this entry is being rejected..."
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectTarget(null)} className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors">Cancel</button>
              <button
                onClick={() => {
                  if (rejectTarget && rejectTarget.reason.trim()) handleReject(rejectTarget.id, rejectTarget.reason.trim());
                }}
                disabled={!rejectTarget?.reason.trim() || rejectMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkAction === 'approve' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Approve all entries">
          <div className="bg-surface-elevated rounded-lg p-8 w-full max-w-lg mx-4 shadow-modal animate-slideUp">
            <h3 className="text-xl font-bold text-text-primary mb-2">Approve All Entries</h3>
            <p className="text-sm text-text-secondary mb-6">This will approve all {submittedEntries.length} submitted entries for this cell.</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkAction(null)} className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors">Cancel</button>
              <button onClick={handleBulkApprove} className="flex-1 px-4 py-2.5 bg-accent text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition-opacity">Approve All</button>
            </div>
          </div>
        </div>
      )}

      {bulkAction === 'reject' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Reject all entries">
          <div className="bg-surface-elevated rounded-lg p-8 w-full max-w-lg mx-4 shadow-modal animate-slideUp">
            <h3 className="text-xl font-bold text-text-primary mb-2">Reject All Entries</h3>
            <p className="text-sm text-text-secondary mb-6">Provide a reason for rejecting all {submittedEntries.length} submitted entries.</p>
            <textarea
              value={bulkReason}
              onChange={e => setBulkReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-text-primary bg-surface-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors mb-4"
              placeholder="Explain why these entries are being rejected..."
            />
            <div className="flex gap-3">
              <button onClick={() => { setBulkAction(null); setBulkReason(''); }} className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors">Cancel</button>
              <button
                onClick={handleBulkReject}
                disabled={!bulkReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reject All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}