import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';

interface Props {
  deficiencyId: string;
  onClose: () => void;
  onVerified: () => void;
}

export default function VerifyClosureModal({ deficiencyId, onClose, onVerified }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: hasEvidenceData } = useQuery({
    queryKey: ['deficiency-has-evidence', deficiencyId],
    queryFn: () => apiClient<{ hasEvidence: boolean }>(ENDPOINTS.remediation.hasEvidence(deficiencyId)),
  });
  const hasPhotos = hasEvidenceData?.hasEvidence ?? null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleVerify = async () => {
    if (!confirmed || !hasPhotos) return;
    setSaving(true);
    try {
      await apiClient(ENDPOINTS.deficiencies.verifyClosure(deficiencyId), { method: 'POST' });
      onVerified();
    } catch {
      setError('Failed to verify closure.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Verify closure">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg mx-4 shadow-modal animate-slideUp">
        <h3 className="text-xl font-bold text-text-primary mb-6">Verify Closure</h3>

        {hasPhotos === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              At least one photo tagged as <strong>remediation evidence</strong> is required before this deficiency can be verified closed.
            </p>
          </div>
        )}

        {hasPhotos === true && (
          <p className="text-sm text-text-secondary mb-6">
            This deficiency has remediation evidence attached. Confirming will mark it as <strong>Verified Closed</strong>.
          </p>
        )}

        {hasPhotos === true && (
          <label className="flex items-start gap-2 mb-6">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4"
            />
            <span className="text-sm text-text-primary">
              I confirm that the remediation evidence is adequate and this deficiency can be closed.
            </span>
          </label>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors"
            aria-label="Cancel verification"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={!confirmed || !hasPhotos || saving}
            className="flex-1 px-4 py-2.5 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            aria-label="Confirm verify closure"
          >
            {saving ? 'Verifying...' : 'Confirm Close'}
          </button>
        </div>
      </div>
    </div>
  );
}