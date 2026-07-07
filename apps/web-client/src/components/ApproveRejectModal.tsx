import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import { getSession } from '../lib/authStore';

interface Props {
  groupId: string;
  entryIds: string[];
  entryCount: number;
  action: 'approve' | 'reject';
  onClose: () => void;
  onDone: () => void;
}

export default function ApproveRejectModal({ groupId, entryIds, entryCount, action, onClose, onDone }: Props) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: async () => {
      const session = getSession();
      const name = session?.user?.display_name ?? session?.user?.email ?? 'Reviewer';
      if (action === 'approve') {
        await apiClient(ENDPOINTS.timesheets.approveGroup(groupId), {
          method: 'POST', body: JSON.stringify({ entry_ids: entryIds, approver_name: name }),
        });
      } else {
        await apiClient(ENDPOINTS.timesheets.rejectGroup(groupId), {
          method: 'POST', body: JSON.stringify({ entry_ids: entryIds, reason: rejectionReason.trim() }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      onDone();
    },
    onError: () => setError(`Failed to ${action} timesheet group.`),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label={action === 'approve' ? 'Approve timesheet group' : 'Reject timesheet group'}>
      <div className="bg-white rounded-lg p-8 w-full max-w-lg mx-4 shadow-modal animate-slideUp">
        <h3 className="text-xl font-bold text-text-primary mb-2">
          {action === 'approve' ? 'Approve Timesheet Group' : 'Reject Timesheet Group'}
        </h3>
        <p className="text-sm text-text-secondary mb-6">
          This will {action} all {entryCount} submitted entries in this group.
        </p>

        {action === 'reject' ? (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-text-primary mb-2">Rejection Reason (required)</label>
            <textarea
              value={rejectionReason}
              onChange={e => { setRejectionReason(e.target.value); setError(''); }}
              rows={3}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-text-primary bg-surface-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
              placeholder="Explain why this timesheet group is being rejected..."
            />
          </div>
        ) : (
          <label className="flex items-start gap-2 mb-6">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4"
            />
            <span className="text-sm text-text-primary">I confirm that all {entryCount} entries in this group are accurate and should be approved.</span>
          </label>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors" aria-label="Cancel">Cancel</button>
          <button
            onClick={() => {
              if (action === 'reject' && !rejectionReason.trim()) { setError('Rejection reason is required.'); return; }
              if (action === 'approve' && !confirmed) return;
              mutation.mutate();
            }}
            disabled={mutation.isPending || (action === 'approve' ? !confirmed : !rejectionReason.trim())}
            className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 ${action === 'approve' ? 'bg-accent hover:opacity-90 transition-opacity' : 'bg-red-600 hover:bg-red-700'}`}
            aria-label={action === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
          >
            {mutation.isPending ? (action === 'approve' ? 'Approving...' : 'Rejecting...') : (action === 'approve' ? `Approve All (${entryCount})` : 'Reject All')}
          </button>
        </div>
      </div>
    </div>
  );
}