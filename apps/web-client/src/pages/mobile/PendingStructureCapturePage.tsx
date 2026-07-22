import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { useSubmitPendingStructure } from '../../hooks/usePendingStructures';

export default function PendingStructureCapturePage() {
  const navigate = useNavigate();
  const submit = useSubmitPendingStructure();
  const activeClientId = (() => { try { return JSON.parse(localStorage.getItem('structapp_session') || '{}').active_client_id; } catch { return ''; } })();

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => apiClient<Array<{ id: string; name: string }>>(ENDPOINTS.sites.list),
    enabled: !!activeClientId,
  });

  const [siteId, setSiteId] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [description, setDescription] = useState('');
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!siteId) { setError('Site is required'); return; }
    if (!assetTag.trim()) { setError('Asset tag is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }

    try {
      await submit.mutateAsync({
        site_id: siteId,
        asset_tag: assetTag.trim(),
        description: description.trim(),
        local_id: crypto.randomUUID(),
        ...(qrCodeValue.trim() ? { qr_code_value: qrCodeValue.trim() } : {}),
      });
      navigate('/m/pending-structures');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button type="button" onClick={() => navigate('/m/pending-structures')} className="text-sm text-accent">&larr; Back</button>
      <h2 className="text-lg font-bold text-text-primary">Discover New Structure</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Site</label>
          <select value={siteId} onChange={e => setSiteId(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select site...</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Asset Tag</label>
          <input value={assetTag} onChange={e => setAssetTag(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="e.g. A-001" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="Describe the structure..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">QR Code Value (optional)</label>
          <input value={qrCodeValue} onChange={e => setQrCodeValue(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="Scanned QR value" />
        </div>
      </div>

      <button type="submit" disabled={submit.isPending} className="w-full px-4 py-2.5 bg-signal text-white rounded-lg text-sm font-medium disabled:opacity-50">
        {submit.isPending ? 'Submitting...' : 'Submit for Review'}
      </button>
    </form>
  );
}
