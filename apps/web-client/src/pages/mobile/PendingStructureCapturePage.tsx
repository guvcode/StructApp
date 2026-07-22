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
  const [deficiencies, setDeficiencies] = useState([{
    category: '',
    component: '',
    sub_component: '',
    focus_area: '',
    deficiency_category: '',
    detailed_description: '',
    consequence_severity: '',
    likelihood: '',
    recommended_action: '',
    most_affected_consequence: '',
    gps_latitude: '',
    gps_longitude: '',
    photos: [] as Array<{ filename: string; caption: string; display_order: number; storage_url?: string }>,
  }]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setDeficiencies(prev => prev.map(d => ({
          ...d,
          gps_latitude: String(pos.coords.latitude),
          gps_longitude: String(pos.coords.longitude),
        })));
      }, () => {});
    }
  }, []);

  const addDeficiency = () => setDeficiencies(prev => [...prev, {
    category: '', component: '', sub_component: '', focus_area: '', deficiency_category: '',
    detailed_description: '', consequence_severity: '', likelihood: '', recommended_action: '',
    most_affected_consequence: '', gps_latitude: '', gps_longitude: '',
    photos: [],
  }]);

  const updateDeficiency = (idx: number, field: string, value: string) => {
    setDeficiencies(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const addPhoto = (idx: number) => {
    const filename = prompt('Photo filename (e.g. photo1.jpg):') || '';
    if (!filename) return;
    setDeficiencies(prev => prev.map((d, i) => i === idx ? {
      ...d,
      photos: [...d.photos, { filename, caption: '', display_order: d.photos.length }],
    } : d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!siteId) { setError('Site is required'); return; }
    if (!assetTag.trim()) { setError('Asset tag is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }

      try {
        const payload = {
          site_id: siteId,
          asset_tag: assetTag.trim(),
          description: description.trim(),
          qr_code_value: qrCodeValue.trim() || undefined,
          deficiencies: deficiencies.filter(d => d.detailed_description?.trim()).map(d => ({
            category: d.category || undefined,
            equipment_type: undefined,
            component: d.component || undefined,
            sub_component: d.sub_component || undefined,
            focus_area: d.focus_area || undefined,
            deficiency_category: d.deficiency_category || undefined,
            detailed_description: d.detailed_description || undefined,
            consequence_severity: d.consequence_severity ? Number(d.consequence_severity) : undefined,
            likelihood: d.likelihood || undefined,
            recommended_action: d.recommended_action || undefined,
            most_affected_consequence: d.most_affected_consequence || undefined,
            gps_latitude: d.gps_latitude ? Number(d.gps_latitude) : undefined,
            gps_longitude: d.gps_longitude ? Number(d.gps_longitude) : undefined,
            photos: d.photos.length > 0 ? d.photos.map(p => ({
              filename: p.filename,
              caption: p.caption || undefined,
              display_order: p.display_order,
              ...(p.storage_url ? { storage_url: p.storage_url } : {}),
            })) : undefined,
          })),
        };
        await submit.mutateAsync(payload as any);
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

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-primary">Deficiencies / Findings</label>
            <button type="button" onClick={addDeficiency} className="text-xs text-accent">+ Add</button>
          </div>

          {deficiencies.map((d, idx) => (
            <div key={idx} className="bg-surface-secondary border border-border rounded-lg p-3 mb-2 space-y-2">
              <input value={d.detailed_description} onChange={e => updateDeficiency(idx, 'detailed_description', e.target.value)} placeholder="Deficiency description" className="w-full px-2 py-1.5 bg-surface-primary border border-border rounded text-sm text-text-primary" />
              <div className="grid grid-cols-2 gap-2">
                <input value={d.component} onChange={e => updateDeficiency(idx, 'component', e.target.value)} placeholder="Component" className="px-2 py-1.5 bg-surface-primary border border-border rounded text-sm text-text-primary" />
                <input value={d.sub_component} onChange={e => updateDeficiency(idx, 'sub_component', e.target.value)} placeholder="Sub-component" className="px-2 py-1.5 bg-surface-primary border border-border rounded text-sm text-text-primary" />
                <input value={d.category} onChange={e => updateDeficiency(idx, 'category', e.target.value)} placeholder="Category" className="px-2 py-1.5 bg-surface-primary border border-border rounded text-sm text-text-primary" />
                <input value={d.consequence_severity} onChange={e => updateDeficiency(idx, 'consequence_severity', e.target.value)} placeholder="Severity (1-5)" type="number" min="1" max="5" className="px-2 py-1.5 bg-surface-primary border border-border rounded text-sm text-text-primary" />
                <input value={d.likelihood} onChange={e => updateDeficiency(idx, 'likelihood', e.target.value)} placeholder="Likelihood (A-E)" className="px-2 py-1.5 bg-surface-primary border border-border rounded text-sm text-text-primary" />
                <input value={d.gps_latitude} onChange={e => updateDeficiency(idx, 'gps_latitude', e.target.value)} placeholder="Latitude" className="px-2 py-1.5 bg-surface-primary border border-border rounded text-sm text-text-primary" />
                <input value={d.gps_longitude} onChange={e => updateDeficiency(idx, 'gps_longitude', e.target.value)} placeholder="Longitude" className="px-2 py-1.5 bg-surface-primary border border-border rounded text-sm text-text-primary" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => addPhoto(idx)} className="text-xs px-2 py-1 bg-surface-primary border border-border rounded text-text-secondary">+ Photo</button>
              </div>
              {d.photos.length > 0 && (
                <ul className="text-xs text-text-secondary space-y-1">
                  {d.photos.map((p, pi) => <li key={pi}>{p.filename}</li>)}
                </ul>
              )}
              <button type="button" onClick={() => setDeficiencies(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-red-600">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={submit.isPending} className="w-full px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
        {submit.isPending ? 'Submitting...' : 'Submit for Review'}
      </button>
    </form>
  );
}
