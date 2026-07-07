import { useState, useEffect } from 'react';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';

interface Props {
  inspectionId: string;
  onClose: () => void;
  onApprove: () => void;
}

export function ApproveInspectionModal({ inspectionId, onClose, onApprove }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleApprove = async () => {
    if (!confirmed) return;
    setSaving(true);
    try {
      await apiClient(ENDPOINTS.inspections.approve(inspectionId), { method: 'POST' });
      onApprove();
    } catch {
      setError('Failed to approve inspection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Approve inspection">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg mx-4 shadow-modal animate-slideUp">
        <h3 className="text-xl font-bold text-text-primary mb-6">Approve Inspection</h3>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 mb-6">
          <p className="font-semibold">Warning: Final approval pending</p>
          <p className="mt-1">Approved inspection records become <strong>final</strong>. Deficiencies and evidence can no longer be edited or removed. Only an Administrator can reopen an approved inspection through the controlled exception path.</p>
        </div>

        <label className="flex items-start gap-2 mb-6">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4"
          />
          <span className="text-sm text-text-primary">I understand that approving will lock this inspection record and all associated deficiencies.</span>
        </label>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors" aria-label="Cancel approval">Cancel</button>
          <button onClick={handleApprove} disabled={!confirmed || saving} className="flex-1 px-4 py-2.5 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50" aria-label="Confirm approval">
            {saving ? 'Approving...' : 'Approve Inspection'}
          </button>
        </div>
      </div>
    </div>
  );
}