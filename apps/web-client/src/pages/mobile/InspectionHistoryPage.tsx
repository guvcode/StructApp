import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInspectionHistory, useTriageMutation, useInspection } from '../../hooks/useInspections';
import { db } from '../../lib/db';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Skeleton from '../../components/Skeleton';

const TRIAGE_STATE_MAP: Record<string, 'resolved' | 'still_outstanding' | 'worsened'> = {
  'Still Outstanding': 'still_outstanding',
  'Worsened': 'worsened',
  'Resolved': 'resolved',
};

export default function InspectionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deficiencies = [], isLoading, isError } = useInspectionHistory(id);
  const { data: inspection } = useInspection(id);
  const triageMutation = useTriageMutation();
  const [decisions, setDecisions] = useState<Record<string, 'resolved' | 'still_outstanding' | 'worsened'>>({});
  const [saved, setSaved] = useState(false);
  const [offlineData, setOfflineData] = useState<Record<string, unknown>[] | null>(null);

  // Fallback to offline data when network fails
  useEffect(() => {
    if (isError && id) {
      (async () => {
        try {
          // Get the inspection's structure_id from offline cache
          const offlineInsp = await db.offlineInspections.get(id);
          if (!offlineInsp?.structureId) return;

          // Query all offline deficiencies linked to any inspection on the same structure
          const allInspections = await db.offlineInspections
            .filter(i => i.structureId === offlineInsp.structureId && i.id !== id)
            .toArray();
          const inspectionIds = allInspections.map(i => i.id);
          if (inspectionIds.length === 0) return;

          const allDefs = await db.offlineDeficiencies
            .filter(d => inspectionIds.includes(d.inspectionId) && d.triageState !== 'Resolved')
            .toArray();

          setOfflineData(allDefs as unknown as Record<string, unknown>[]);
        } catch {
          // Silently fail — show empty state
        }
      })();
    }
  }, [isError, id]);

  const displayData = deficiencies.length > 0 ? deficiencies : (offlineData ?? []);

  // Pre-populate decisions from existing triage_state on load/revisit
  useEffect(() => {
    if (displayData.length === 0) return;
    const initial: Record<string, 'resolved' | 'still_outstanding' | 'worsened'> = {};
    for (const def of displayData) {
      const raw = def as unknown as Record<string, unknown>;
      const mapped = raw.triage_state || raw.triageState
        ? TRIAGE_STATE_MAP[(raw.triage_state || raw.triageState) as string]
        : undefined;
      if (mapped) {
        initial[(raw.id as string) || (raw.deficiencyId as string)] = mapped;
      }
    }
    setDecisions(initial);
  }, [displayData]);

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
    setSaved(true);
    setTimeout(() => navigate(`/m/inspections/${id}`), 1500);
  };

  const selectedCount = Object.keys(decisions).length;
  const totalCount = displayData.length;
  const progressPct = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

  if (isLoading && !offlineData) return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48 mx-auto mb-2" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );

  if (isError && !offlineData) return (
    <div className="p-6 text-red-600 text-center">Failed to load inspection history.</div>
  );

  const hasData = displayData.length > 0;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(`/m/inspections/${id}`)} className="text-sm text-accent">&larr; Back to Inspection</button>
      <h2 className="text-lg font-bold text-text-primary">
        Historical Deficiency Triage
      </h2>
      {inspection?.site_name && (
        <p className="text-sm font-medium text-text-primary">Inspection: {inspection.site_name}</p>
      )}

      {hasData && (
        <p className="text-sm text-text-secondary">
          Site: {(displayData[0] as Record<string, unknown>)?.site_name as string ?? '—'} | Structure: {(displayData[0] as Record<string, unknown>)?.structure_tag as string ?? '—'}
        </p>
      )}

      {hasData && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Triage Progress</span>
            <span>{selectedCount} of {totalCount} deficiencies decided</span>
          </div>
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {!hasData && !isLoading && (
        <p className="text-text-secondary text-sm text-center py-8">No unresolved history items for this structure.</p>
      )}

      {hasData && (
        <>
          <p className="text-sm text-text-primary font-semibold">
            Unresolved Prior Findings ({displayData.length})
          </p>
          {triageMutation.isError && (
            <p className="text-sm text-red-600">Failed to save triage decisions. Please try again.</p>
          )}
          {saved && (
            <p className="text-sm text-green-600">Triage decisions saved successfully. Returning to inspection...</p>
          )}
          {offlineData && (
            <p className="text-xs text-amber-600">Offline data — some items may not reflect the latest server state.</p>
          )}
          <div className="space-y-3">
            {displayData.map((def, idx) => {
              const raw = def as unknown as Record<string, unknown>;
              const defId = (raw.id as string) || (raw.deficiencyId as string) || `tmp_${idx}`;
              return (
                <div key={defId} className="bg-surface-primary border border-border rounded-lg p-3">
                  <p className="text-sm font-semibold text-text-primary">{(raw.title as string) || (raw.description as string) || ''}</p>
                  <p className="text-xs text-text-secondary">{raw.description as string}</p>
                  <div className="flex gap-2 mt-1 mb-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{raw.priority_tier as string || raw.calculatedPriority as string || ''}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{raw.severity as string || ''}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      {raw.source_inspection_date ? new Date(raw.source_inspection_date as string).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <select
                    value={decisions[defId] ?? ''}
                    onChange={e => setDecision(defId, e.target.value)}
                    className="w-full px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-primary"
                  >
                    <option value="">Select triage decision...</option>
                    <option value="still_outstanding">Still Outstanding</option>
                    <option value="worsened">Worsened</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleSave}
            disabled={selectedCount === 0 || triageMutation.isPending || saved}
            className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {triageMutation.isPending ? 'Saving...' : saved ? 'Saved' : `Save Triage Decisions (${selectedCount})`}
          </button>
        </>
      )}
    </div>
  );
}