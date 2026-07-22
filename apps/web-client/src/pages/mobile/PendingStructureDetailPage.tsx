import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Skeleton from '../../components/Skeleton';

export default function PendingStructureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pending-structures', id],
    queryFn: () => apiClient<any>(ENDPOINTS.pendingStructures.byId(id!)),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-4 space-y-3"><Skeleton className="h-6 w-40 mb-4" /><Skeleton className="h-24 w-full rounded-lg" /></div>;
  if (!pending) return <div className="p-4 text-sm text-text-secondary">Pending structure not found.</div>;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/m/pending-structures')} className="text-sm text-accent">&larr; Back</button>
      <h2 className="text-lg font-bold text-text-primary">Pending Structure</h2>
      <div className="bg-surface-primary rounded-lg p-3 border border-border space-y-2">
        <div>
          <p className="text-xs text-text-secondary">Asset Tag</p>
          <p className="text-sm font-semibold text-text-primary">{pending.asset_tag}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Description</p>
          <p className="text-sm text-text-primary">{pending.description}</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Status</p>
          <p className="text-sm text-text-primary capitalize">{pending.status}</p>
        </div>
        {pending.qr_code_value && (
          <div>
            <p className="text-xs text-text-secondary">QR Code Value</p>
            <p className="text-sm text-text-primary">{pending.qr_code_value}</p>
          </div>
        )}
        {pending.rejection_reason && (
          <div>
            <p className="text-xs text-text-secondary">Rejection Reason</p>
            <p className="text-sm text-text-primary">{pending.rejection_reason}</p>
          </div>
        )}
      </div>
      {(pending.status === 'pending' || pending.status === 'rejected') && (
        <button
          onClick={() => navigate(`/m/pending-structures/${pending.pending_structure_id}/deficiencies/new`)}
          className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm"
        >
          Add Deficiency
        </button>
      )}
    </div>
  );
}
