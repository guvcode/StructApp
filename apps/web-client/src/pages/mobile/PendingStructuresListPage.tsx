import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Skeleton from '../../components/Skeleton';

export default function PendingStructuresListPage() {
  const navigate = useNavigate();
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-structures', 'mine'],
    queryFn: () => apiClient<Array<any>>(ENDPOINTS.pendingStructures.mine),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    pending.forEach((p: any) => {
      const key = p.status || 'pending';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [pending]);

  if (isLoading) return <div className="p-4 space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-24 w-full rounded-lg" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/m/dashboard')} className="text-sm text-accent">&larr; Back</button>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">My Pending Structures</h2>
        <button
          onClick={() => navigate('/m/pending-structures/new')}
          className="px-3 py-1.5 bg-signal text-white rounded-lg text-sm"
        >
          + Discover
        </button>
      </div>

      {pending.length === 0 && (
        <p className="text-text-secondary text-sm text-center py-8">No pending structures. Tap Discover to capture a new on-site finding.</p>
      )}

      {Array.from(grouped.entries()).map(([status, items]) => {
        const stripeColor = status === 'approved' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-500' : status === 'submitted' ? 'bg-blue-500' : 'bg-amber-500';
        return (
        <div key={status}>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{status.toUpperCase()} <span className="font-mono text-text-muted">({items.length})</span></h3>
          {items.map((p: any) => (
            <button
              key={p.pending_structure_id}
              onClick={() => navigate(`/m/pending-structures/${p.pending_structure_id}`)}
              className={`w-full bg-surface-primary border border-border rounded-xl p-3 mb-2 text-left border-l-4 ${stripeColor}`}
            >
              <p className="text-sm font-semibold text-text-primary">{p.asset_tag}</p>
              <p className="text-xs text-text-secondary mt-0.5">{p.description}</p>
              <p className="text-xs text-text-muted mt-1">
                {new Date(p.created_at).toLocaleDateString()}
                {p.rejection_reason && ` — ${p.rejection_reason}`}
              </p>
            </button>
          ))}
        </div>
        );
      })}
    </div>
  );
}
