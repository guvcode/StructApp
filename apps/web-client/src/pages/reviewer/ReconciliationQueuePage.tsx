import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { usePendingStructuresForReview, useApprovePendingStructure, useRejectPendingStructure, usePendingDeficiencies, usePendingPhotos } from '../../hooks/usePendingStructures';
import Skeleton from '../../components/Skeleton';
import Card from '../../components/Card';
import type { PendingPhoto } from '../../services/api/pendingStructures';

export default function ReconciliationQueuePage() {
  const navigate = useNavigate();
  const { data: pending = [], isLoading } = usePendingStructuresForReview();
  const approve = useApprovePendingStructure();
  const reject = useRejectPendingStructure();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const { data: deficiencies = [] } = usePendingDeficiencies(selectedId);
  const { data: photos = [] } = usePendingPhotos(selectedId);

  const selected = useMemo(() => pending.find(p => p.pending_structure_id === selectedId), [pending, selectedId]);

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync(id);
    } catch (err: any) {
      alert(err?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      await reject.mutateAsync({ id: rejectingId, reason: rejectReason.trim() });
      setRejectingId(null);
      setRejectReason('');
    } catch (err: any) {
      alert(err?.message || 'Failed to reject');
    }
  };

  if (isLoading) return <div className="p-4 space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-32 w-full rounded-lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Reconciliation Queue</h2>
        <span className="text-xs text-text-secondary bg-surface-secondary px-2 py-1 rounded-full">{pending.length} pending</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {pending.length === 0 && <p className="text-text-secondary text-sm text-center py-8">No pending structures awaiting review.</p>}
          {pending.map((p: any) => (
            <button
              key={p.pending_structure_id}
              onClick={() => setSelectedId(p.pending_structure_id)}
              className={`w-full text-left bg-surface-primary border rounded-lg p-3 ${selectedId === p.pending_structure_id ? 'border-accent' : 'border-border'}`}
            >
              <p className="text-sm font-semibold text-text-primary">{p.asset_tag}</p>
              <p className="text-xs text-text-secondary mt-0.5">{p.description}</p>
              <p className="text-xs text-text-muted mt-1">
                {new Date(p.created_at).toLocaleDateString()} — {p.status}
              </p>
            </button>
          ))}
        </div>

        {selectedId && selected && (
          <div className="bg-surface-secondary border border-border rounded-lg p-4 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div>
              <h3 className="font-semibold text-text-primary">{selected.asset_tag}</h3>
              <p className="text-xs text-text-secondary mt-0.5">{selected.description}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-text-secondary uppercase mb-2">Deficiencies</h4>
              {deficiencies.length === 0 && <p className="text-xs text-text-secondary">None</p>}
              {deficiencies.map((d: any) => (
                <Card key={d.pending_deficiency_id} padding="sm" className="mb-2">
                  <p className="text-sm text-text-primary">{d.detailed_description || 'No description'}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {[d.component, d.sub_component, d.category].filter(Boolean).join(' / ') || '—'}
                  </p>
                  {d.gps_latitude != null && <p className="text-xs text-text-muted">{d.gps_latitude}, {d.gps_longitude}</p>}
                </Card>
              ))}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-text-secondary uppercase mb-2">Photos ({photos.length})</h4>
              {photos.length === 0 && <p className="text-xs text-text-secondary">None</p>}
              <div className="grid grid-cols-2 gap-2">
                {photos.map((ph: PendingPhoto) => (
                  <div key={ph.pending_photo_id} className="bg-surface-primary border border-border rounded-lg overflow-hidden">
                    {ph.storage_url && (
                      <img src={ph.storage_url} alt={ph.caption} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium text-text-primary truncate" title={ph.filename}>{ph.filename}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{ph.pending_deficiency_id ? 'deficiency' : 'structure'}</p>
                      {ph.original_filename && (
                        <p className="text-[10px] text-text-muted mt-1 truncate" title={ph.original_filename}>{ph.original_filename}</p>
                      )}
                      {ph.camera_make && ph.camera_model && (
                        <p className="text-[10px] text-text-muted">{ph.camera_make} {ph.camera_model}</p>
                      )}
                      {ph.captured_at && (
                        <p className="text-[10px] text-text-muted">{new Date(ph.captured_at).toLocaleString()}</p>
                      )}
                      {ph.gps_latitude != null && ph.gps_longitude != null && (
                        <p className="text-[10px] text-text-muted">{ph.gps_latitude.toFixed(4)}, {ph.gps_longitude.toFixed(4)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => handleApprove(selectedId)} disabled={approve.isPending} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">
                {approve.isPending ? 'Approving...' : 'Approve'}
              </button>
              <button onClick={() => setRejectingId(selectedId)} disabled={reject.isPending} className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {rejectingId && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary border border-border rounded-lg p-4 w-full max-w-md space-y-3">
            <h3 className="font-semibold text-text-primary">Reject Bundle</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-text-primary" placeholder="Reason for rejection..." />
            <div className="flex gap-2">
              <button onClick={handleReject} disabled={!rejectReason.trim() || reject.isPending} className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
                {reject.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button onClick={() => { setRejectingId(null); setRejectReason(''); }} disabled={reject.isPending} className="flex-1 px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-secondary disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
