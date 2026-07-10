import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import type { PhotoRecord } from '../../types/index';
import { RemediationStatus, UserRole, isReviewerOrAdmin } from '../../types/index';
import Skeleton from '../../components/Skeleton';
import { getUserRole } from '../../lib/authStore';

const STATUS_ACTIONS = [
  { label: 'Mark Scheduled', targetStatus: RemediationStatus.RemediationScheduled, roles: ['contractor', 'reviewer', 'admin'] },
  { label: 'Mark Pending Verification', targetStatus: RemediationStatus.PendingVerification, roles: ['contractor', 'reviewer', 'admin'] },
];

export default function RemediationUpdatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [error, setError] = useState('');
  const role = getUserRole();

  const isContractor = role === UserRole.contractor;
const isReviewerAdmin = isReviewerOrAdmin(role);

  const { data: deficiency, isLoading } = useQuery({
    queryKey: ['remediation-deficiency', id],
    queryFn: () => apiClient<{
      deficiency_id: string; component: string; description: string;
      calculated_priority: string; remediation_status: string;
      verified_closed_by?: string; verified_closed_at?: string;
      risk_rating?: string;
    }>(ENDPOINTS.remediation.byId(id!)),
    enabled: !!id,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['remediation-photos', id],
    queryFn: () => apiClient<PhotoRecord[]>(ENDPOINTS.remediation.photos(id!)),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (status: string) => apiClient(ENDPOINTS.remediation.updateStatus(id!), {
      method: 'PATCH',
      body: JSON.stringify({ remediation_status: status }),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['remediation-deficiency', id] }),
    onError: () => setError('Failed to update remediation status.'),
  });

  const addPhotoMutation = useMutation({
    mutationFn: () => apiClient(ENDPOINTS.remediation.addPhoto(id!), {
      method: 'POST',
      body: JSON.stringify({ caption: caption.trim(), dataUrl: photoDataUrl }),
    }),
    onSuccess: () => {
      setCaption('');
      setPhotoDataUrl('');
      queryClient.invalidateQueries({ queryKey: ['remediation-photos', id] });
    },
  });

  const isReadOnly = deficiency?.remediation_status === RemediationStatus.VerifiedClosed && isContractor;
  const saving = updateMutation.isPending;

  if (isLoading) return <div className="p-4"><Skeleton className="h-6 w-48 mx-auto mb-2" /><Skeleton className="h-48 w-full rounded-lg" /></div>;
  if (error) return <div className="p-4 text-red-600 text-center">{error}</div>;
  if (!deficiency) return <div className="p-4 text-text-secondary text-center">Deficiency not found.</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-accent mb-2">&larr; Back</button>
      <h1 className="text-xl font-bold text-text-primary">Remediation Update</h1>

      <div className="bg-surface-primary border border-border rounded-lg p-3 space-y-1">
        <p className="font-semibold text-text-primary">{deficiency.component}</p>
        <p className="text-sm text-text-secondary">{deficiency.description}</p>
        <div className="flex gap-2 mt-1">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            deficiency.calculated_priority === 'P1' ? 'bg-red-100 text-red-700' :
            deficiency.calculated_priority === 'P2' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {deficiency.calculated_priority}
          </span>
          {deficiency.risk_rating && (
            <span className={`px-2 py-0.5 rounded text-xs ${
              deficiency.risk_rating === 'High' ? 'bg-red-100 text-red-700' :
              deficiency.risk_rating === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {deficiency.risk_rating} Risk
            </span>
          )}
        </div>
      </div>

      <div className="bg-surface-primary border border-border rounded-lg p-3">
        <p className="text-sm font-medium text-text-primary mb-1">Current Status</p>
        <p className="text-lg font-semibold text-text-primary">
          {deficiency.remediation_status === RemediationStatus.Open && 'Open'}
          {deficiency.remediation_status === RemediationStatus.RemediationScheduled && 'Remediation Scheduled'}
          {deficiency.remediation_status === RemediationStatus.PendingVerification && 'Pending Verification'}
          {deficiency.remediation_status === RemediationStatus.VerifiedClosed && 'Verified Closed'}
        </p>
        {deficiency.verified_closed_by && (
          <p className="text-xs text-text-secondary mt-1">Verified by {deficiency.verified_closed_by} on {deficiency.verified_closed_at ? new Date(deficiency.verified_closed_at).toLocaleDateString() : ''}</p>
        )}
      </div>

      {!isReadOnly && !isReviewerAdmin && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">Actions</p>
          {STATUS_ACTIONS.map(action => {
            const disabled = saving || deficiency.remediation_status === RemediationStatus.VerifiedClosed;
            const show = deficiency.remediation_status !== action.targetStatus && deficiency.remediation_status !== RemediationStatus.VerifiedClosed;
            if (!show) return null;
            return (
              <button
                key={action.targetStatus}
                onClick={() => updateMutation.mutate(action.targetStatus)}
                disabled={disabled}
                className="w-full px-4 py-2 border border-accent text-accent rounded-lg disabled:opacity-50"
                aria-label={action.label}
              >
                {saving ? 'Updating...' : action.label}
              </button>
            );
          })}
        </div>
      )}

      {isReadOnly && (
        <div className="bg-gray-100 border border-border rounded-lg p-3 text-center text-sm text-text-secondary">
          This deficiency is Verified Closed and is read-only for contractors.
        </div>
      )}

      {deficiency.remediation_status !== RemediationStatus.VerifiedClosed && (
        <div>
          <p className="text-sm font-medium text-text-primary mb-2">Remediation Evidence Photos</p>
          <div className="flex gap-2 mb-2">
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Photo caption"
              className="flex-1 px-3 py-2 bg-surface-primary border border-border rounded-lg text-sm"
            />
            <input
              value={photoDataUrl}
              onChange={e => setPhotoDataUrl(e.target.value)}
              placeholder="Data URL (mock)"
              className="flex-1 px-3 py-2 bg-surface-primary border border-border rounded-lg text-sm"
            />
            <button
              onClick={() => addPhotoMutation.mutate()}
              disabled={!caption.trim() || !photoDataUrl}
              className="px-3 py-2 bg-accent text-white rounded-lg text-sm disabled:opacity-50"
              aria-label="Add remediation evidence photo"
            >
              Add
            </button>
          </div>

          {photos.length === 0 ? (
            <p className="text-xs text-text-secondary">No remediation evidence photos yet.</p>
          ) : (
            <div className="space-y-1">
              {photos.map(p => (
                <div key={p.id} className="flex items-center gap-2 bg-surface-primary border border-border rounded p-2">
                  <span className="text-xs text-text-primary flex-1">{p.caption}</span>
                  <span className="text-xs text-green-600 font-medium">remediation evidence</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}