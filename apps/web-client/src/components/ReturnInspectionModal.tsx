import { useState, useEffect } from 'react';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';

interface Props {
  inspectionId: string;
  onClose: () => void;
  onReturn: () => void;
}

export function ReturnInspectionModal({ inspectionId, onClose, onReturn }: Props) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleReturn = async () => {
    if (!reason.trim()) { setError('Return reason is required.'); return; }
    setSaving(true);
    try {
      await apiClient(ENDPOINTS.inspections.return_(inspectionId), { method: 'POST', body: JSON.stringify({ returned_reason: reason.trim() }) });
      onReturn();
    } catch {
      setError('Failed to return inspection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Return inspection">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg mx-4 shadow-modal animate-slideUp">
        <h3 className="text-xl font-bold text-text-primary mb-6">Return Inspection</h3>
        <p className="text-sm text-text-secondary mb-6">This will send the inspection back to the contractor for correction.</p>

        <label className="block text-sm font-semibold text-text-primary mb-2">Justification (required)</label>
        <textarea
          value={reason}
          onChange={e => { setReason(e.target.value); setError(''); }}
          rows={3}
          className="w-full px-4 py-2.5 border border-border rounded-lg text-text-primary bg-surface-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors mb-4"
          placeholder="Describe what needs to be corrected..."
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors" aria-label="Cancel return">Cancel</button>
          <button onClick={handleReturn} disabled={saving || !reason.trim()} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50" aria-label="Confirm return inspection">
            {saving ? 'Returning...' : 'Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
}