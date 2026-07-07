import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInspection, useDeficienciesForInspection } from '../../hooks/useInspections';
import { useSites, useStructures } from '../../hooks/useRegister';
import { getUserRole } from '../../lib/authStore';
import { InspectionStatus } from '../../types/index';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import StatusBadge from '../../components/StatusBadge';
import { INSPECTION_STATUS_STYLES } from '../../utils/statusMaps';
import { ReturnInspectionModal } from '../../components/ReturnInspectionModal';
import { ApproveInspectionModal } from '../../components/ApproveInspectionModal';
import { ReopenInspectionModal } from '../../components/ReopenInspectionModal';

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: inspection, isLoading } = useInspection(id);
  const { data: deficiencies = [], refetch } = useDeficienciesForInspection(id);
  const [showReturn, setShowReturn] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReopen, setShowReopen] = useState(false);

  const role = getUserRole();

  const { data: allSites = [] } = useSites();
  const { data: allStructures = [] } = useStructures();
  const siteLookup = useMemo(() => {
    const map = new Map<string, string>();
    allSites.forEach(s => map.set(s.id, s.name));
    return map;
  }, [allSites]);
  const structureLookup = useMemo(() => {
    const map = new Map<string, { name: string; type: string }>();
    allStructures.forEach(s => map.set(s.id, { name: s.name, type: s.type }));
    return map;
  }, [allStructures]);

  const site = inspection ? siteLookup.get(inspection.site_id) : undefined;
  const structure = inspection?.structure_id ? structureLookup.get(inspection.structure_id) : null;

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-48 w-full rounded-lg mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-fadeIn text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Inspection Not Found</h2>
        <p className="text-text-secondary mb-4">The inspection you're looking for doesn't exist.</p>
        <Link to="/inspections" className="text-accent hover:underline">Back to Inspections</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <Link to="/inspections" className="text-sm text-accent hover:underline mb-4 inline-block">&larr; Back to Inspections</Link>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Inspection Details</h1>

      <Card padding="lg" className="shadow-card mb-6">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-text-secondary">Status</span>
            <p><StatusBadge label={inspection.status} map={INSPECTION_STATUS_STYLES} className="mt-1" /></p>
          </div>
          <div>
            <span className="text-sm text-text-secondary">Assignee</span>
            <p className="text-text-primary font-medium">{inspection.assignee_name ?? inspection.assigned_to}</p>
          </div>
          <div>
            <span className="text-sm text-text-secondary">Site</span>
            <p className="text-text-primary font-medium">{site ?? inspection.site_id}</p>
          </div>
          <div>
            <span className="text-sm text-text-secondary">Structure</span>
            <p className="text-text-primary font-medium">{structure ? `${structure.name} (${structure.type})` : 'Entire site'}</p>
          </div>
          <div>
            <span className="text-sm text-text-secondary">Scheduled Date</span>
            <p className="text-text-primary font-medium">{inspection.scheduled_date ?? 'Not set'}</p>
          </div>
          <div>
            <span className="text-sm text-text-secondary">Created</span>
            <p className="text-text-primary font-medium">{inspection.created_at.split('T')[0]}</p>
          </div>
          {inspection.submitted_at && (
            <div>
              <span className="text-sm text-text-secondary">Submitted</span>
              <p className="text-text-primary font-medium">{inspection.submitted_at.split('T')[0]}</p>
            </div>
          )}
          {inspection.approved_at && (
            <div>
              <span className="text-sm text-text-secondary">Approved</span>
              <p className="text-text-primary font-medium">{inspection.approved_at.split('T')[0]}</p>
            </div>
          )}
          {inspection.status === InspectionStatus.Returned && inspection.return_reason && (
            <div className="col-span-2 mt-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm font-semibold text-red-700">Return Reason</span>
              <p className="text-sm text-red-600 mt-1">{inspection.return_reason}</p>
            </div>
          )}
        </div>
      </Card>

      {inspection.status === InspectionStatus.Submitted && (
        <Card padding="lg" className="shadow-card mb-6">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Actions</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowApprove(true)}
              className="px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              Approve
            </button>
            <button
              onClick={() => setShowReturn(true)}
              className="px-4 py-2.5 border border-red-200 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-colors shadow-sm"
            >
              Return
            </button>
          </div>
        </Card>
      )}

      {inspection.status === InspectionStatus.Approved && role === 'admin' && (
        <Card padding="lg" className="shadow-card mb-6">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Actions</h3>
          <button
            onClick={() => setShowReopen(true)}
            className="px-4 py-2.5 border border-border text-text-primary font-semibold rounded-lg hover:bg-surface-hover transition-colors shadow-sm"
          >
            Reopen
          </button>
        </Card>
      )}

      <Card padding="lg" className="shadow-card">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Deficiencies ({deficiencies.length})</h3>
        {deficiencies.length === 0 ? (
          <p className="text-text-secondary">No deficiencies recorded for this inspection.</p>
        ) : (
          <div className="space-y-3">
            {deficiencies.map(def => (
              <Link key={def.id} to={`/deficiencies/${def.id}`} className="block border border-border rounded-lg p-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-text-primary font-medium">{def.title}</span>
                  <div className="flex gap-2 items-center">
                    {def.risk_rating && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        def.risk_rating === 'High' ? 'bg-red-100 text-red-700' :
                        def.risk_rating === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {def.risk_rating}
                      </span>
                    )}
                  </div>
                </div>
                {def.description && <p className="text-sm text-text-secondary mb-2">{def.description}</p>}
                <div className="flex gap-2 text-xs text-text-secondary flex-wrap">
                  <span>Priority: {def.priority_tier}</span>
                  {def.category && <span>Category: {def.category}</span>}
                  <span>Status: {def.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {showReturn && id && (
        <ReturnInspectionModal
          inspectionId={id}
          onClose={() => setShowReturn(false)}
          onReturn={() => { setShowReturn(false); refetch(); }}
        />
      )}
      {showApprove && id && (
        <ApproveInspectionModal
          inspectionId={id}
          onClose={() => setShowApprove(false)}
          onApprove={() => { setShowApprove(false); refetch(); }}
        />
      )}
      {showReopen && id && (
        <ReopenInspectionModal
          inspectionId={id}
          onClose={() => setShowReopen(false)}
          onReopen={() => { setShowReopen(false); refetch(); }}
        />
      )}
    </div>
  );
}