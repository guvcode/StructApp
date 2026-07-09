import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDeficiencyById } from '../../hooks/useInspections';
import { PriorityOverridePanel } from '../../components/PriorityOverridePanel';
import { GovernanceMetadataPanel } from '../../components/GovernanceMetadataPanel';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import StatusBadge from '../../components/StatusBadge';
import PhotoGallery from '../../components/PhotoGallery';
import type { PhotoRecord } from '../../types/index';
import { PRIORITY_STYLES, REMEDIATION_STATUS_STYLES, RISK_RATING_STYLES } from '../../utils/statusMaps';

const DEFICIENCY_STATUS_STYLES: Record<string, string> = {
  Open: 'bg-blue-50 text-blue-700 border border-blue-200',
  InRemediation: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  Resolved: 'bg-green-50 text-green-700 border border-green-200',
  Closed: 'bg-gray-50 text-gray-600 border border-gray-200',
};

const REMEDIATION_LABELS: Record<string, string> = {
  Open: 'Open',
  Remediation_Scheduled: 'Remediation Scheduled',
  Remediated_Pending_Verification: 'Pending Verification',
  Verified_Closed: 'Verified Closed',
};

export default function DeficiencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deficiency, isLoading, refetch } = useDeficiencyById(id);
  const [showOverride, setShowOverride] = useState(false);

  const { data: photos = [] } = useQuery({
    queryKey: ['deficiency-photos', id],
    queryFn: () => apiClient<Array<{ photo_id: string; deficiency_id: string; storage_url: string; caption: string; display_order: number; created_at: string }>>(ENDPOINTS.remediation.photos(id!)),
    enabled: !!id,
    select: (data) => data.map(p => ({
      id: p.photo_id,
      deficiency_local_id: p.deficiency_id,
      dataUrl: p.storage_url,
      caption: p.caption || '',
      purpose: 'evidence' as const,
      created_at: p.created_at,
      sync_state: 'synced' as const,
    })) as PhotoRecord[],
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-48 w-full rounded-lg" /></div>;
  if (!deficiency) return <div className="p-8 text-text-secondary text-center">Deficiency not found</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-secondary rounded-lg transition-colors" aria-label="Go back">
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">{deficiency.title}</h1>
          <StatusBadge label={deficiency.priority_tier} map={PRIORITY_STYLES} size="md" className="font-bold" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="lg">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Status</p>
              <StatusBadge label={deficiency.status} map={DEFICIENCY_STATUS_STYLES} />
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Inspection</p>
              <p className="text-sm text-text-primary font-medium">{deficiency.inspection_id}</p>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Remediation Status</p>
              {deficiency.remediation_status ? (
                <StatusBadge label={REMEDIATION_LABELS[deficiency.remediation_status] ?? deficiency.remediation_status} map={REMEDIATION_STATUS_STYLES} />
              ) : (
                <p className="text-sm text-text-secondary">&mdash;</p>
              )}
            </div>
            {deficiency.remediation_due_date && (
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Due Date</p>
                <p className="text-sm text-text-primary font-medium">{deficiency.remediation_due_date}</p>
              </div>
            )}
            {deficiency.assignee_name && (
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Assignee</p>
                <p className="text-sm text-text-primary font-medium">{deficiency.assignee_name}</p>
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <div className="space-y-4">
            {deficiency.site_name && (
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Site</p>
                <p className="text-sm text-text-primary font-medium">{deficiency.site_name}</p>
              </div>
            )}
            {deficiency.location_desc && (
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Location</p>
                <p className="text-sm text-text-primary">{deficiency.location_desc}</p>
              </div>
            )}
            {deficiency.verified_by && (
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Verified By</p>
                <p className="text-sm text-text-primary font-medium">{deficiency.verified_by}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-2">Description</p>
          <p className="text-text-primary leading-relaxed">{deficiency.description}</p>
        </div>
      </Card>

      {(deficiency.category || deficiency.sub_component || deficiency.focus_area || deficiency.deficiency_category || deficiency.detailed_description) && (
        <Card padding="lg">
          <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-3">Taxonomy</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {deficiency.category && <div><span className="text-text-secondary">Category</span><p className="text-text-primary">{deficiency.category}</p></div>}
            {deficiency.sub_component && <div><span className="text-text-secondary">Sub-Component</span><p className="text-text-primary">{deficiency.sub_component}</p></div>}
            {deficiency.focus_area && <div><span className="text-text-secondary">Focus Area</span><p className="text-text-primary">{deficiency.focus_area}</p></div>}
            {deficiency.deficiency_category && <div><span className="text-text-secondary">Deficiency Category</span><p className="text-text-primary">{deficiency.deficiency_category}</p></div>}
            {deficiency.detailed_description && <div className="col-span-2"><span className="text-text-secondary">Detailed Description</span><p className="text-text-primary">{deficiency.detailed_description}</p></div>}
          </div>
        </Card>
      )}

      {(deficiency.mechanisms || deficiency.vibration_present !== undefined || deficiency.ndt_required !== undefined || deficiency.further_investigation_required !== undefined) && (
        <Card padding="lg">
          <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-3">Indication Details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {deficiency.mechanisms && <div className="col-span-2"><span className="text-text-secondary">Potential Failure Mechanism</span><p className="text-text-primary">{deficiency.mechanisms}</p></div>}
            {deficiency.vibration_present !== undefined && <div><span className="text-text-secondary">Vibration Present</span><p className="text-text-primary">{deficiency.vibration_present ? 'Yes' : 'No'}</p></div>}
            {deficiency.ndt_required !== undefined && <div><span className="text-text-secondary">NDT Required</span><p className="text-text-primary">{deficiency.ndt_required ? 'Yes' : 'No'}</p></div>}
            {deficiency.further_investigation_required !== undefined && <div><span className="text-text-secondary">Further Investigation</span><p className="text-text-primary">{deficiency.further_investigation_required ? 'Required' : 'Not Required'}</p></div>}
          </div>
        </Card>
      )}

      {deficiency.recommended_action && (
        <Card padding="lg" variant="flat">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-accent mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">Recommended Action</p>
              <p className="text-sm text-text-secondary">{deficiency.recommended_action}</p>
            </div>
          </div>
        </Card>
      )}

      {(deficiency.consequence_severity || deficiency.likelihood || deficiency.risk_rank) && (
        <Card padding="lg">
          <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-3">Glencore Risk Assessment</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {deficiency.consequence_severity && <div><span className="text-text-secondary">Consequence</span><p className="text-text-primary">{deficiency.consequence_severity}/5</p></div>}
            {deficiency.likelihood && <div><span className="text-text-secondary">Likelihood</span><p className="text-text-primary">{deficiency.likelihood}</p></div>}
            {deficiency.risk_rank && <div><span className="text-text-secondary">Risk Rank</span><p className="text-text-primary">{deficiency.risk_rank}/25</p></div>}
            {deficiency.risk_rating && (
              <div>
                <span className="text-text-secondary">Risk Rating</span>
                <StatusBadge label={deficiency.risk_rating} map={RISK_RATING_STYLES} className="mt-1" />
              </div>
            )}
          </div>
        </Card>
      )}

      {deficiency.component_note && (
        <Card padding="lg" variant="flat">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-yellow-800 mb-1">Component Note</p>
              <p className="text-sm text-yellow-700">{deficiency.component_note}</p>
            </div>
          </div>
        </Card>
      )}

      <Card padding="lg">
        <div>
          <p className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">Governance History</p>
          <GovernanceMetadataPanel deficiency={deficiency} />
        </div>
      </Card>

      <Card padding="lg">
        <PhotoGallery photos={photos} title="Photos" />
      </Card>

      <div className="flex gap-3">
        <button onClick={() => setShowOverride(true)} className="px-4 py-2.5 border border-border text-text-primary font-medium rounded-lg hover:bg-surface-secondary transition-colors shadow-sm">
          Override Priority
        </button>
      </div>

      {showOverride && (
        <PriorityOverridePanel
          deficiencyId={deficiency.id || (deficiency as unknown as Record<string, unknown>).deficiency_id as string}
          currentTier={deficiency.priority_tier}
          onClose={() => setShowOverride(false)}
          onOverride={() => { setShowOverride(false); refetch(); }}
        />
      )}
    </div>
  );
}