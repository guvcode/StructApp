import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInspection, useDeficienciesForInspection } from '../../hooks/useInspections';
import type { Deficiency, TriageDecision } from '../../types/index';
import Skeleton from '../../components/Skeleton';

export default function InspectionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: inspection, isLoading: loadingInsp } = useInspection(id);
  const { data: deficiencies = [], isLoading: loadingDefs } = useDeficienciesForInspection(id);
  const [decisions, setDecisions] = useState<Record<string, TriageDecision>>({});
  const loading = loadingInsp || loadingDefs;

  if (loading) return <div className="p-6"><Skeleton className="h-6 w-48 mx-auto mb-2" /><Skeleton className="h-64 w-full rounded-lg" /></div>;
  if (!inspection) return <div className="p-6 text-red-600 text-center">Failed to load inspection history.</div>;

  const unresolvedHistory = deficiencies.filter(d => d.status !== 'Resolved' && d.status !== 'Closed');

  const setDecision = (defId: string, field: keyof TriageDecision, value: string) => {
    setDecisions(prev => ({
      ...prev,
      [defId]: { ...prev[defId] ?? { previous_deficiency_id: defId, decision: 'new_unrelated' }, [field]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(`/m/inspections/${id}`)} className="text-sm text-accent">&larr; Back to Inspection</button>
      <h2 className="text-lg font-bold text-text-primary">
        Historical Deficiency Triage
      </h2>
      {inspection && (
        <p className="text-sm text-text-secondary">Inspection: {inspection.id}</p>
      )}

      {unresolvedHistory.length === 0 && (
        <p className="text-text-secondary text-sm text-center py-8">No unresolved history items for this inspection.</p>
      )}

      {unresolvedHistory.length > 0 && (
        <>
          <p className="text-sm text-text-primary font-semibold">Unresolved Prior Findings ({unresolvedHistory.length})</p>
          <div className="space-y-3">
            {unresolvedHistory.map(def => (
              <div key={def.id} className="bg-surface-primary border border-border rounded-lg p-3">
                <p className="text-sm font-semibold text-text-primary">{def.title}</p>
                <p className="text-xs text-text-secondary">{def.description}</p>
                <div className="flex gap-2 mt-1 mb-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{def.priority_tier}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{def.severity}</span>
                </div>
                <select
                  value={decisions[def.id]?.decision ?? ''}
                  onChange={e => setDecision(def.id, 'decision', e.target.value)}
                  className="w-full px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-primary"
                >
                  <option value="">Select triage decision...</option>
                  <option value="new_unrelated">New Unrelated Finding</option>
                  <option value="resolved">Resolved</option>
                  <option value="still_outstanding">Still Outstanding</option>
                  <option value="worsened">Worsened</option>
                </select>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}