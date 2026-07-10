import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInspection, useDeficienciesForInspection } from '../../hooks/useInspections';
import { useSubmitInspection } from '../../hooks/useInspections';
import { useSyncState } from '../../hooks/useSync';
import type { PhotoRecord } from '../../types/index';
import Skeleton from '../../components/Skeleton';

export default function InspectionSubmitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: inspection, isLoading } = useInspection(id);
  const { data: deficiencies = [] } = useDeficienciesForInspection(id);
  const { data: syncState } = useSyncState();
  const pendingCount = syncState?.pendingCount ?? 0;
  const submitInspection = useSubmitInspection();
  const [noFindings, setNoFindings] = useState(false);
  const [error, setError] = useState('');

  if (isLoading) return <div className="p-4"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32 w-full rounded-lg" /></div>;
  if (!inspection) return <div className="p-4"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32 w-full rounded-lg" /></div>;

  const hasDeficiencies = deficiencies.length > 0;
  const criticalDefs = deficiencies.filter(d => d.priority_tier === 'P1' || d.priority_tier === 'P2');

  const missingPhotoCriticalDefs = criticalDefs.filter(d => {
    try {
      const raw = localStorage.getItem(`photos-${d.id}`);
      const photos = raw ? (JSON.parse(raw) as PhotoRecord[]) : [];
      return photos.length === 0;
    } catch {
      return true;
    }
  });

  const canSubmit = (hasDeficiencies || noFindings) && pendingCount === 0 && missingPhotoCriticalDefs.length === 0;

  const handleSubmit = async () => {
    if (!canSubmit || !id) return;
    setError('');
    try {
      await submitInspection.mutateAsync(id);
      navigate(`/m/inspections/${id}`);
    } catch {
      setError('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(`/m/inspections/${id}`)} className="text-sm text-accent">&larr; Back to Inspection</button>
      <h2 className="text-lg font-bold text-text-primary">Submit Inspection</h2>

      <div className="bg-surface-primary rounded-lg p-3 border border-border">
        <p className="text-sm font-semibold text-text-primary">Pre-Submit Checklist</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li className="flex justify-between">
            <span className="text-text-primary">Deficiencies captured</span>
            <span className={hasDeficiencies ? 'text-green-600' : 'text-red-600'}>{hasDeficiencies ? `${deficiencies.length} recorded` : 'None'}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-text-primary">Pending sync items</span>
            <span className={pendingCount === 0 ? 'text-green-600' : 'text-red-600'}>{pendingCount === 0 ? 'All synced' : `${pendingCount} pending`}</span>
          </li>
          {missingPhotoCriticalDefs.length > 0 && (
            <li className="flex justify-between text-red-600">
              <span>P1/P2 photo evidence</span>
              <span>{missingPhotoCriticalDefs.length} missing</span>
            </li>
          )}
        </ul>
      </div>

      {!hasDeficiencies && (
        <label className="flex items-center gap-2 bg-surface-primary border border-border rounded-lg p-3">
          <input type="checkbox" checked={noFindings} onChange={e => setNoFindings(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-text-primary">No deficiencies found — confirm this inspection is clear</span>
        </label>
      )}

      {missingPhotoCriticalDefs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {missingPhotoCriticalDefs.length} P1/P2 {missingPhotoCriticalDefs.length === 1 ? 'deficiency requires' : 'deficiencies require'} at least one photo before submission.
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        Submitting will lock this inspection. Deficiencies will become read-only after approval.
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded text-sm">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitInspection.isPending}
        className="w-full px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
      >
        {submitInspection.isPending ? 'Submitting...' : 'Submit Inspection'}
      </button>

      {!canSubmit && (
        <p className="text-xs text-text-secondary text-center">
          {!hasDeficiencies && !noFindings
            ? 'Capture at least one deficiency or confirm no findings.'
            : 'Sync all pending items before submitting.'}
        </p>
      )}
    </div>
  );
}