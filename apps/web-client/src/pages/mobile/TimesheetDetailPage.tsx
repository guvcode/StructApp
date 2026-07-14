import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, getActiveClientId } from '../../lib/authStore';
import { useCreateTimesheetBatch, useUpdateTimesheet } from '../../hooks/useTimesheets';
import { getInspections } from '../../services/api/inspections';
import { getTimesheetById } from '../../services/api/timesheets';
import type { Inspection } from '../../types';

const WORK_TYPES = ['Field Inspection', 'Report Writing', 'Equipment Check', 'Office Work', 'Travel'];

interface Entry {
  id: string;
  workType: string;
  hours: string;
  notes: string;
  preInspection: boolean;
}

export default function TimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createBatch = useCreateTimesheetBatch();
  const updateTimesheet = useUpdateTimesheet();
  const isNew = id === 'new';
  const [loading, setLoading] = useState(false);

  const [entryDate, setEntryDate] = useState('');
  const [inspectionId, setInspectionId] = useState('');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [entries, setEntries] = useState<Entry[]>([{ id: crypto.randomUUID(), workType: '', hours: '', notes: '', preInspection: false }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getSession();
    if (session?.user?.id) {
      getInspections({ assignee: session.user.id })
        .then(setInspections)
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    setLoading(true);
    const activeClientId = getActiveClientId();
    getTimesheetById(id, activeClientId)
      .then(entry => {
        if (!entry) {
          setError('Timesheet entry not found.');
          setTimeout(() => navigate('/m/timesheets'), 2000);
          return;
        }
        setEntryDate((entry.entry_date ?? '').split('T')[0]);
        setInspectionId(entry.inspection_id ?? '');
        setEntries([{
          id: crypto.randomUUID(),
          workType: entry.work_type ?? '',
          hours: String(entry.hours),
          notes: entry.notes ?? '',
          preInspection: entry.pre_inspection ?? false,
        }]);
      })
      .catch(() => setError('Failed to load timesheet entry.'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const addEntry = () => setEntries(prev => [...prev, { id: crypto.randomUUID(), workType: '', hours: '', notes: '', preInspection: false }]);

  const removeEntry = (entryId: string) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const updateEntry = (entryId: string, field: keyof Entry, value: string | boolean) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: value } : e));
  };

  const handleSave = async () => {
    setError('');

    if (!entryDate) { setError('Date is required.'); return; }
    if (!inspectionId) { setError('Please select an inspection.'); return; }

    const validEntries = entries.filter(e => e.workType && e.hours);
    if (validEntries.length === 0) { setError('At least one entry with work type and hours is required.'); return; }

    for (const e of validEntries) {
      const h = parseFloat(e.hours);
      if (isNaN(h) || h <= 0 || h > 24) { setError(`Hours for "${e.workType}" must be between 0 and 24.`); return; }
    }

    setSaving(true);

    try {
      const session = getSession();
      if (!session?.token) { setError('Not authenticated.'); setSaving(false); return; }

      if (isNew) {
        const activeClientId = getActiveClientId();
        const body = {
          entry_date: entryDate,
          inspection_id: inspectionId,
          ...(activeClientId ? { client_id: activeClientId } : {}),
          entries: validEntries.map(e => ({
            work_type: e.workType,
            hours: parseFloat(e.hours),
            pre_inspection: e.preInspection,
            ...(e.notes ? { notes: e.notes } : {}),
          })),
        };

        await createBatch.mutateAsync(body);
      } else {
        const entry = validEntries[0]!;
        await updateTimesheet.mutateAsync({
          id: id!,
          data: {
            work_type: entry.workType,
            hours: parseFloat(entry.hours),
            notes: entry.notes || undefined,
            pre_inspection: entry.preInspection,
          },
        });
      }

      navigate('/m/timesheets');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <button onClick={() => navigate('/m/timesheets')} className="text-sm text-accent">&larr; Back</button>
        <p className="text-text-secondary text-sm mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate('/m/timesheets')} className="text-sm text-accent">&larr; Back</button>
      <h1 className="text-xl font-bold text-text-primary">{isNew ? 'New' : 'Edit'} Timesheet Entry</h1>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
        <input
          type="date"
          value={entryDate}
          onChange={e => setEntryDate(e.target.value)}
          className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Inspection</label>
        <select
          value={inspectionId}
          onChange={e => setInspectionId(e.target.value)}
          className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary"
        >
          <option value="">Select an inspection...</option>
          {inspections.map(insp => (
            <option key={insp.id} value={insp.id}>
              {insp.site_name} ({insp.status}){insp.scheduled_date ? ` - ${insp.scheduled_date}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {entries.map((entry, idx) => (
          <div key={entry.id} className="border border-border rounded-lg p-3 bg-surface-secondary space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Entry {idx + 1}</span>
              {entries.length > 1 && (
                <button onClick={() => removeEntry(entry.id)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Work Type</label>
              <select
                value={entry.workType}
                onChange={e => updateEntry(entry.id, 'workType', e.target.value)}
                className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary"
              >
                <option value="">Select work type...</option>
                {WORK_TYPES.map(wt => <option key={wt} value={wt}>{wt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Hours (0–24)</label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={entry.hours}
                onChange={e => updateEntry(entry.id, 'hours', e.target.value)}
                className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Notes</label>
              <input
                type="text"
                value={entry.notes}
                onChange={e => updateEntry(entry.id, 'notes', e.target.value)}
                className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary"
                placeholder="Optional..."
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={entry.preInspection}
                onChange={e => updateEntry(entry.id, 'preInspection', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-text-primary">Pre-inspection entry</span>
            </label>
          </div>
        ))}
      </div>

      <button onClick={addEntry} className="w-full py-2 border-2 border-dashed border-border rounded-lg text-sm text-accent font-medium hover:bg-surface-secondary">+ Add Another Entry</button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="w-full px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50">
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}