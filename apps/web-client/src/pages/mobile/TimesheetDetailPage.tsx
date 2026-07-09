import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { useCreateTimesheetBatch } from '../../hooks/useTimesheets';
import type { Timesheet } from '../../types/index';
import { TimesheetStatus } from '../../types/index';
import Skeleton from '../../components/Skeleton';
import { getSession, getActiveClientId } from '../../lib/authStore';

const WORK_TYPES = ['Field Inspection', 'Report Writing', 'Equipment Check', 'Office Work', 'Travel'];

interface EntryRow {
  id: string;
  workType: string;
  hours: string;
  notes: string;
}

export default function TimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const [entryDate, setEntryDate] = useState('');
  const [rows, setRows] = useState<EntryRow[]>([{ id: crypto.randomUUID(), workType: '', hours: '', notes: '' }]);
  const [error, setError] = useState('');
  const [savingUpdate, setSavingUpdate] = useState(false);

  const { data: original, isLoading } = useQuery<Timesheet | null>({
    queryKey: ['timesheet', id],
    queryFn: () => apiClient(ENDPOINTS.timesheets.byId(id!)),
    enabled: !!id && !isNew,
  });

  useEffect(() => {
    if (original) {
      setEntryDate(original.entry_date);
      setRows([{ id: crypto.randomUUID(), workType: original.work_type ?? '', hours: String(original.hours), notes: original.description ?? '' }]);
    }
  }, [original]);

  const batchMutation = useCreateTimesheetBatch();

  const submitMutation = useMutation({
    mutationFn: () => apiClient(ENDPOINTS.timesheets.submit(id!), { method: 'POST' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timesheets'] }); navigate('/m/timesheets'); },
    onError: () => setError('Failed to submit timesheet.'),
  });

  const isReadOnly = original ? original.status !== TimesheetStatus.Draft : false;
  const saving = batchMutation.isPending || submitMutation.isPending || savingUpdate;

  const addRow = () => {
    setRows(prev => [...prev, { id: crypto.randomUUID(), workType: '', hours: '', notes: '' }]);
  };

  const removeRow = (rowId: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  const updateRow = (rowId: string, field: keyof EntryRow, value: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    if (!entryDate) { setError('Date is required.'); return; }

    const validRows = rows.filter(r => r.workType && r.hours);
    if (validRows.length === 0) { setError('At least one entry with work type and hours is required.'); return; }

    for (const r of validRows) {
      const h = parseFloat(r.hours);
      if (isNaN(h) || h <= 0 || h > 24) { setError(`Hours must be between 0 and 24 for "${r.workType}".`); return; }
    }

    setError('');

    if (isNew) {
      const input: { entry_date: string; entries: Array<{ work_type: string; hours: number; notes?: string }> } = {
        entry_date: entryDate,
        entries: validRows.map(r => {
          const e: { work_type: string; hours: number; notes?: string } = { work_type: r.workType, hours: parseFloat(r.hours) };
          if (r.notes) e.notes = r.notes;
          return e;
        }),
      };
      const activeClientId = getActiveClientId();
      if (activeClientId) (input as { client_id?: string }).client_id = activeClientId;
      batchMutation.mutate(input, {
        onSuccess: () => navigate('/m/timesheets'),
        onError: (err) => setError(err instanceof Error ? err.message : 'Failed to save timesheet.'),
      });
    } else if (id && validRows[0]) {
      setSavingUpdate(true);
      try {
        const session = getSession();
        const first = validRows[0];
        const body = { entry_date: entryDate, hours: parseFloat(first.hours), work_type: first.workType, description: first.notes };
        await apiClient(ENDPOINTS.timesheets.update(id), { method: 'PATCH', body: JSON.stringify(body) });
        queryClient.invalidateQueries({ queryKey: ['timesheets'] });
        navigate('/m/timesheets');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update timesheet.');
      } finally {
        setSavingUpdate(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!id || isNew) return;
    submitMutation.mutate();
  };

  if (isLoading) return <div className="p-4"><Skeleton className="h-6 w-32 mx-auto mb-2" /><Skeleton className="h-48 w-full rounded-lg" /></div>;
  if (error && !original && !isNew) return <div className="p-4 text-red-600 text-center">{error}</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate('/m/timesheets')} className="text-sm text-accent">&larr; Back</button>
      <h1 className="text-xl font-bold text-text-primary">{isNew ? 'New Timesheet Entry' : 'Timesheet Entry'}</h1>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
          <input
            type="date"
            value={entryDate}
            onChange={e => setEntryDate(e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-50"
          />
        </div>

        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={row.id} className="border border-border rounded-lg p-3 bg-surface-secondary space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">Entry {idx + 1}</span>
                {rows.length > 1 && !isReadOnly && (
                  <button onClick={() => removeRow(row.id)} className="text-xs text-red-600 hover:text-red-800" aria-label="Remove entry">Remove</button>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Work Type</label>
                <select
                  value={row.workType}
                  onChange={e => updateRow(row.id, 'workType', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-50"
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
                  value={row.hours}
                  onChange={e => updateRow(row.id, 'hours', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Notes</label>
                <input
                  type="text"
                  value={row.notes}
                  onChange={e => updateRow(row.id, 'notes', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-50"
                  placeholder="Optional..."
                />
              </div>
            </div>
          ))}
        </div>

        {isNew && !isReadOnly && (
          <button onClick={addRow} className="w-full py-2 border-2 border-dashed border-border rounded-lg text-sm text-accent font-medium hover:bg-surface-secondary transition-colors" aria-label="Add another entry">
            + Add Another Entry
          </button>
        )}

        {original && original.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700 font-medium">Rejection Reason</p>
            <p className="text-sm text-red-800 mt-0.5">{original.rejection_reason}</p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2 pt-2">
          {!isReadOnly && (
            <>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50" aria-label="Save timesheet">
                {saving ? 'Saving...' : 'Save'}
              </button>
              {!isNew && (
                <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2 border border-accent text-accent rounded-lg disabled:opacity-50" aria-label="Submit timesheet">
                  {saving ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </>
          )}
          {isReadOnly && (
            <p className="text-sm text-text-secondary italic">
              {original?.status === TimesheetStatus.Approved ? 'Approved timesheets are locked.' : original?.status === TimesheetStatus.Rejected ? 'Rejected timesheets are read-only. Create a new entry to correct.' : 'Submitted timesheets are locked from edits.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}