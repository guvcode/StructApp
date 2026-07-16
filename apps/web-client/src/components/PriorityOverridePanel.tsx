import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import { PriorityTier } from '../types';

const TIERS = Object.values(PriorityTier);

interface Props {
  deficiencyId: string;
  currentTier?: string;
  onClose: () => void;
  onOverride?: () => void;
}

export function PriorityOverridePanel({ deficiencyId, currentTier, onClose, onOverride }: Props) {
  const [tier, setTier] = useState(currentTier ?? PriorityTier.P3);
  const [justification, setJustification] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const canSave = tier !== (currentTier ?? PriorityTier.P3) && justification.trim().length > 0;

  const mutation = useMutation({
    mutationFn: () => apiClient(ENDPOINTS.deficiencies.overridePriority(deficiencyId), {
      method: 'POST',
      body: JSON.stringify({ priority: tier, justification: justification.trim() }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deficiency', deficiencyId] });
      onOverride?.();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Override priority">
      <div className="bg-white rounded-lg p-5 w-full max-w-md mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-text-primary mb-4">Override Priority</h3>

        <p className="text-sm text-text-secondary mb-3">
          Current value: <span className="font-semibold">{currentTier}</span>
        </p>

        <label className="block text-sm font-medium text-text-primary mb-1">New tier</label>
        <select
          value={tier}
          onChange={e => setTier(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-primary mb-3"
        >
          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label className="block text-sm font-medium text-text-primary mb-1">Justification (required)</label>
        <textarea
          value={justification}
          onChange={e => setJustification(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-primary mb-4"
          placeholder="Explain the reason for this override..."
        />

<div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-text-primary"
            aria-label="Cancel override"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSave || mutation.isPending}
            className="flex-1 px-3 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
            aria-label="Confirm priority override"
          >
            {mutation.isPending ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}