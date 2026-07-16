import { useState, useEffect } from 'react';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import { InspectionStatus } from '../types';

interface Props {
  inspectionId: string;
  onClose: () => void;
  onReopen: () => void;
}

const TARGET_STATUSES = [InspectionStatus.Submitted, InspectionStatus.Returned] as const;

export function ReopenInspectionModal({ inspectionId, onClose, onReopen }: Props) {
  const [targetStatus, setTargetStatus] = useState<InspectionStatus>(InspectionStatus.Submitted);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleReopen = async () => {
    if (!confirmed || !reason.trim()) return;
    setSaving(true);
    try {
      await apiClient(ENDPOINTS.inspections.reopen(inspectionId), { method: 'POST', body: JSON.stringify({ target_status: targetStatus, reason: reason.trim() }) });
      onReopen();
    } catch {
      setError('Failed to reopen inspection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Reopen inspection">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg mx-4 shadow-modal animate-slideUp">
        <h3 className="text-xl font-bold text-text-primary mb-6">Reopen Inspection</h3>
        <p className="text-sm text-text-secondary mb-6">This will unlock the approved inspection for correction via a controlled path.</p>

        <label className="block text-sm font-semibold text-text-primary mb-2">Target Status</label>
        <select
          value={targetStatus}
          onChange={e => setTargetStatus(e.target.value as InspectionStatus)}
          className="w-full px-4 py-2.5 border border-border rounded-lg text-text-primary bg-surface-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors mb-4"
        >
          {TARGET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label className="block text-sm font-semibold text-text-primary mb-2">Reason (required)</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 border border-border rounded-lg text-text-primary bg-surface-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors mb-4"
          placeholder="Explain why this inspection needs to be reopened..."
        />

        <label className="flex items-start gap-2 mb-6">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4"
          />
          <span className="text-sm text-text-primary">I understand that reopening creates a controlled correction path for an approved record.</span>
        </label>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors" aria-label="Cancel reopen">Cancel</button>
          <button onClick={handleReopen} disabled={!confirmed || !reason.trim() || saving} className="flex-1 px-4 py-2.5 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50" aria-label="Confirm reopen inspection">Confirm Reopen</button>
        </div>
      </div>
    </div>
  );
}