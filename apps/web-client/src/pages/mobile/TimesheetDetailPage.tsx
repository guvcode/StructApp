import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import type { Timesheet } from '../../types/index';
import { TimesheetStatus } from '../../types/index';
import Skeleton from '../../components/Skeleton';
import { getSession } from '../../lib/authStore';

const WORK_TYPES = ['Field Inspection', 'Report Writing', 'Equipment Check', 'Office Work', 'Travel'];

export default function TimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const [entryDate, setEntryDate] = useState('');
  const [hours, setHours] = useState('');
  const [workType, setWorkType] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { data: original, isLoading } = useQuery<Timesheet | null>({
    queryKey: ['timesheet', id],
    queryFn: () => apiClient(ENDPOINTS.timesheets.byId(id!)),
    enabled: !!id && !isNew,
  });

  useEffect(() => {
    if (original) {
      setEntryDate(original.entry_date);
      setHours(String(original.hours));
      setWorkType(original.work_type ?? '');
      setDescription(original.description ?? '');
    }
  }, [original]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const session = getSession();
      const body = { entry_date: entryDate, hours: parseFloat(hours), work_type: workType, description };
      if (isNew) {
        await apiClient(ENDPOINTS.timesheets.create, { method: 'POST', body: JSON.stringify(body) });
      } else if (id) {
        await apiClient(ENDPOINTS.timesheets.update(id), { method: 'PATCH', body: JSON.stringify(body) });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timesheets'] }); navigate('/m/timesheets'); },
    onError: () => setError('Failed to save timesheet.'),
  });

  const submitMutation = useMutation({
    mutationFn: () => apiClient(ENDPOINTS.timesheets.submit(id!), { method: 'POST' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timesheets'] }); navigate('/m/timesheets'); },
    onError: () => setError('Failed to submit timesheet.'),
  });

  const isReadOnly = original ? original.status !== TimesheetStatus.Draft : false;
  const saving = saveMutation.isPending || submitMutation.isPending;

  const handleSave = () => {
    if (!entryDate || !hours || !workType) { setError('Date, hours, and work type are required.'); return; }
    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0 || h > 24) { setError('Hours must be between 0 and 24.'); return; }
    setError('');
    saveMutation.mutate();
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

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Work Type</label>
          <select
            value={workType}
            onChange={e => setWorkType(e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-50"
          >
            <option value="">Select work type...</option>
            {WORK_TYPES.map(wt => <option key={wt} value={wt}>{wt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Hours (0–24)</label>
          <input
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={hours}
            onChange={e => setHours(e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            disabled={isReadOnly}
            className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-50"
            placeholder="Optional notes about the work performed..."
          />
        </div>

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