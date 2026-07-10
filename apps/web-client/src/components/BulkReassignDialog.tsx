import { useState, useEffect } from 'react';
import { useBulkReassign } from '../hooks/useBulkReassign';
import { InspectionStatus } from '../types';

export interface InspectionForBulkReassign {
  inspection_id: string;
  asset_tag: string;
  status: string;
  structure_description: string;
}

export interface BulkReassignDialogProps {
  sourceInspectorId: string;
  inspections: InspectionForBulkReassign[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkReassignDialog({
  sourceInspectorId,
  inspections,
  onClose,
  onSuccess,
}: BulkReassignDialogProps) {
  const [targetInspectorId, setTargetInspectorId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [offendingIds, setOffendingIds] = useState<string[] | null>(null);

  const openInspections = inspections.filter(
    (insp) => insp.status !== InspectionStatus.Approved
  );
  const approvedInspections = inspections.filter(
    (insp) => insp.status === InspectionStatus.Approved
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const reassignMutation = useBulkReassign(onSuccess);

  const handleSubmit = () => {
    if (!targetInspectorId) {
      setError('Target inspector ID is required');
      return;
    }

    setError(null);
    setOffendingIds(null);

    reassignMutation.mutate(
      {
        sourceInspectorId,
        targetInspectorId,
        inspectionIds: openInspections.map((i) => i.inspection_id),
        ...(reason ? { reason } : {}),
      },
      {
        onError: (err) => {
          const e = err as Error & { error_code?: string; offending_ids?: string[] };
          if (e.error_code === 'INSPECTION_APPROVED_USE_REOPEN') {
            setOffendingIds(e.offending_ids || []);
            setError('One or more inspections are Approved and must be reopened first.');
          } else {
            setError(e.message || 'Bulk reassign failed');
          }
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 w-full max-w-md">
        <h3 className="text-text-primary font-semibold mb-4">
          Move all open work from inspector {sourceInspectorId.slice(0, 8)}…
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Source Inspector
            </label>
            <input
              type="text"
              value={sourceInspectorId}
              disabled
              className="w-full rounded-md bg-surface-tertiary px-3 py-2 text-sm text-text-muted border border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Target Inspector ID
            </label>
            <input
              type="text"
              value={targetInspectorId}
              onChange={(e) => setTargetInspectorId(e.target.value)}
              placeholder="Enter target inspector ID"
              className="w-full rounded-md bg-surface px-3 py-2 text-sm text-text-primary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-md bg-surface px-3 py-2 text-sm text-text-primary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Why are you reassigning?"
            />
            <div className="text-xs text-text-muted mt-1">{reason.length}/500</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Affected Inspections ({openInspections.length})
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1 bg-surface-tertiary rounded-md p-2">
              {openInspections.length === 0 ? (
                <div className="text-sm text-text-muted">No open inspections to reassign</div>
              ) : (
                openInspections.map((insp) => (
                  <div
                    key={insp.inspection_id}
                    className="text-xs flex justify-between px-2 py-1"
                  >
                    <span className="text-text-primary">{insp.asset_tag}</span>
                    <span className="text-text-muted">{insp.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {approvedInspections.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-md p-3">
              <div className="text-sm font-medium text-warning mb-1">
                Blocked inspections ({approvedInspections.length})
              </div>
              <div className="text-xs text-text-secondary">
                These inspections are Approved and must be reopened before bulk reassignment:
              </div>
              <div className="mt-1 space-y-1">
                {approvedInspections.map((insp) => (
                  <div key={insp.inspection_id} className="text-xs text-warning">
                    {insp.asset_tag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-md p-3">
              <div className="text-sm text-error">{error}</div>
              {offendingIds && offendingIds.length > 0 && (
                <div className="mt-1 text-xs text-text-secondary">
                  Offending IDs: {offendingIds.join(', ')}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={reassignMutation.isPending}
              className="flex-1 rounded-md bg-surface-tertiary px-4 py-2 text-sm font-medium text-text-primary hover:opacity-90 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={reassignMutation.isPending || !targetInspectorId}
              className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {reassignMutation.isPending ? 'Reassigning…' : 'Confirm Reassign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
