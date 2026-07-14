import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInspectionHistory, useTriageMutation } from '../../hooks/useInspections';
import Skeleton from '../../components/Skeleton';

export default function InspectionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deficiencies = [], isLoading, isError } = useInspectionHistory(id);
  const triageMutation = useTriageMutation();
  const [decisions, setDecisions] = useState<Record<string, 'resolved' | 'still_outstanding' | 'worsened'>>({});

  const setDecision = (defId: string, value: string) => {
    if (value === 'resolved' || value === 'still_outstanding' || value === 'worsened') {
      setDecisions(prev => ({ ...prev, [defId]: value }));
    }
  };

  const handleSave = async () => {
    if (!id) return;
    const decisionList = Object.entries(decisions).map(([deficiency_id, decision]) => ({
      deficiency_id,
      decision,
    }));
    if (decisionList.length === 0) return;
    await triageMutation.mutateAsync({ inspectionId: id, decisions: decisionList });
    navigate(`/m/inspections/${id}`);
  };

  const selectedCount = Object.keys(decisions).length;

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48 mx-auto mb-2" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );

  if (isError) return (
    <div className="p-6 text-red-600 text-center">Failed to load inspection history.</div>
  );

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(`/m/inspections/${id}`)} className="text-sm text-accent">&larr; Back to Inspection</button>
      <h2 className="text-lg font-bold text-text-primary">
        Historical Deficiency Triage
      </h2>

      {deficiencies.length > 0 && (
        <p className="text-sm text-text-secondary">
          Site: {deficiencies[0]?.site_name ?? '—'} | Structure: {deficiencies[0]?.structure_tag ?? '—'}
        </p>
      )}

      {deficiencies.length === 0 && (
        <p className="text-text-secondary text-sm text-center py-8">No unresolved history items for this structure.</p>
      )}

      {deficiencies.length > 0 && (
        <>
          <p className="text-sm text-text-primary font-semibold">
            Unresolved Prior Findings ({deficiencies.length})
          </p>
          {triageMutation.isError && (
            <p className="text-sm text-red-600">Failed to save triage decisions. Please try again.</p>
          )}
          <div className="space-y-3">
            {deficiencies.map(def => (
              <div key={def.id} className="bg-surface-primary border border-border rounded-lg p-3">
                <p className="text-sm font-semibold text-text-primary">{def.title}</p>
                <p className="text-xs text-text-secondary">{def.description}</p>
                <div className="flex gap-2 mt-1 mb-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{def.priority_tier}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{def.severity}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                    {def.source_inspection_date ? new Date(def.source_inspection_date).toLocaleDateString() : ''}
                  </span>
                </div>
                <select
                  value={decisions[def.id] ?? ''}
                  onChange={e => setDecision(def.id, e.target.value)}
                  className="w-full px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-primary"
                >
                  <option value="">Select triage decision...</option>
                  <option value="still_outstanding">Still Outstanding</option>
                  <option value="worsened">Worsened</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={selectedCount === 0 || triageMutation.isPending}
            className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {triageMutation.isPending ? 'Saving...' : `Save Triage Decisions (${selectedCount})`}
          </button>
        </>
      )}
    </div>
  );
}