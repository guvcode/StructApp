import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInspection, useDeficienciesForInspection } from '../../hooks/useInspections';
import { getUserRole } from '../../lib/authStore';
import { InspectionStatus } from '../../types/index';
import { ReturnInspectionModal } from '../../components/ReturnInspectionModal';
import { ApproveInspectionModal } from '../../components/ApproveInspectionModal';
import { PriorityOverridePanel } from '../../components/PriorityOverridePanel';
import { ReopenInspectionModal } from '../../components/ReopenInspectionModal';
import { GovernanceMetadataPanel } from '../../components/GovernanceMetadataPanel';
import Skeleton from '../../components/Skeleton';

export default function InspectionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: inspection, isLoading } = useInspection(id);
  const { data: deficiencies = [], refetch } = useDeficienciesForInspection(id);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [showReturn, setShowReturn] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [showReopen, setShowReopen] = useState(false);

  const role = getUserRole();

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32 w-full rounded-lg" /></div>;
  if (!inspection) return <div className="p-6 text-text-secondary text-center"><Skeleton className="h-8 w-48 mx-auto mb-4" /><Skeleton className="h-32 w-full rounded-lg" /></div>;

  const isApproved = inspection.status === InspectionStatus.Approved;
  const isAdmin = role === 'admin';
  const selectedDeficiency = deficiencies.find(d => d.id === selectedDef) ?? null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-text-primary mb-2">Review Inspection</h1>
      <div className="bg-surface-primary rounded-lg border border-border p-4 mb-6">
        <p className="text-sm text-text-secondary">Inspection: <span className="text-text-primary font-medium">{id}</span></p>
        <p className="text-sm text-text-secondary">Status: <span className="text-text-primary font-medium">{inspection.status}</span></p>
        {inspection.assignee_name && <p className="text-sm text-text-secondary">Inspector: <span className="text-text-primary">{inspection.assignee_name}</span></p>}
        {inspection.return_reason && <p className="text-sm text-red-600 mt-1">Return reason: {inspection.return_reason}</p>}
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-3">Deficiencies ({deficiencies.length})</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {deficiencies.map(def => (
            <button
              key={def.id}
              onClick={() => setSelectedDef(def.id)}
              aria-label={`Select deficiency: ${def.title}`}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedDef === def.id ? 'border-accent bg-accent/5' : 'border-border bg-surface-primary hover:border-accent/50'}`}
            >
              <p className="font-medium text-text-primary">{def.title}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-text-secondary">{def.priority_tier}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-text-secondary">{def.status}</span>
              </div>
            </button>
          ))}
          {deficiencies.length === 0 && <p className="text-text-secondary text-sm">No deficiencies for this inspection.</p>}
        </div>

        <div className="bg-surface-primary rounded-lg border border-border p-4 min-h-[200px]">
          {selectedDeficiency ? (
            <>
              <h3 className="font-semibold text-text-primary mb-2">{selectedDeficiency.title}</h3>
              <p className="text-sm text-text-secondary mb-1">{selectedDeficiency.description}</p>
              <p className="text-sm text-text-secondary mb-1">Priority: {selectedDeficiency.priority_tier}</p>
              {selectedDeficiency.category && <p className="text-sm text-text-secondary mb-1">Category: {selectedDeficiency.category}</p>}
              {selectedDeficiency.sub_component && <p className="text-sm text-text-secondary mb-1">Sub-Component: {selectedDeficiency.sub_component}</p>}
              {selectedDeficiency.risk_rating && <p className="text-sm font-medium mb-1" style={{ color: selectedDeficiency.risk_rating === 'High' ? '#dc2626' : selectedDeficiency.risk_rating === 'Medium' ? '#d97706' : '#16a34a' }}>Risk: {selectedDeficiency.risk_rating} (Rank {selectedDeficiency.risk_rank}/25)</p>}
              {selectedDeficiency.location_desc && <p className="text-sm text-text-secondary mb-1">Location: {selectedDeficiency.location_desc}</p>}
              {selectedDeficiency.component_note && <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">{selectedDeficiency.component_note}</p>}
              {!isApproved && (
                <button onClick={() => setShowOverride(true)} className="mt-3 px-3 py-1.5 text-sm border border-border rounded-lg text-text-primary hover:bg-gray-50" aria-label="Override priority">
                  Override Priority
                </button>
              )}
            </>
          ) : (
            <p className="text-text-secondary text-sm">Select a deficiency to view details.</p>
          )}
        </div>
      </div>

      {!isApproved && (
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowReturn(true)} className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50" aria-label="Return inspection">Return Inspection</button>
          <button onClick={() => setShowApprove(true)} className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90" aria-label="Approve inspection">Approve Inspection</button>
        </div>
      )}

      {isApproved && (
        <div className="mt-6 p-3 bg-gray-100 border border-border rounded-lg">
          <p className="text-sm text-text-secondary italic mb-3">This inspection is approved. All records are locked and read-only.</p>
          {isAdmin && (
            <button onClick={() => setShowReopen(true)} className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50" aria-label="Reopen inspection">
              Reopen Inspection
            </button>
          )}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-2">Governance History</h3>
        <GovernanceMetadataPanel inspection={inspection} deficiency={selectedDeficiency} />
      </div>

      {showReturn && id && <ReturnInspectionModal inspectionId={id} onClose={() => setShowReturn(false)} onReturn={() => { setShowReturn(false); refetch(); }} />}
      {showApprove && id && <ApproveInspectionModal inspectionId={id} onClose={() => setShowApprove(false)} onApprove={() => { setShowApprove(false); refetch(); }} />}
      {showOverride && selectedDef && <PriorityOverridePanel deficiencyId={selectedDef} currentTier={selectedDeficiency?.priority_tier ?? 'P3'} onClose={() => setShowOverride(false)} onOverride={() => { setShowOverride(false); refetch(); }} />}
      {showReopen && id && <ReopenInspectionModal inspectionId={id} onClose={() => setShowReopen(false)} onReopen={() => { setShowReopen(false); refetch(); }} />}
    </div>
  );
}