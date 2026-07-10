import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimesheets, useSubmitTimesheet, useDeleteTimesheet } from '../../hooks/useTimesheets';
import { getSession } from '../../lib/authStore';
import Skeleton from '../../components/Skeleton';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const FILTERS = ['All', 'Draft', 'Submitted', 'Approved', 'Rejected'] as const;

export default function TimesheetListPage() {
  const navigate = useNavigate();
  const session = getSession();
  const userId = session?.user?.id;
  const { data: timesheets = [], isLoading, isError, error } = useTimesheets(userId);
  const submitTimesheet = useSubmitTimesheet();
  const deleteTimesheet = useDeleteTimesheet();
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = statusFilter === 'All' ? timesheets : timesheets.filter(t => t.status === statusFilter);

  if (isLoading) return <div className="p-4"><Skeleton className="h-6 w-32 mx-auto mb-4" /><Skeleton className="h-48 w-full rounded-lg" /></div>;
  if (isError) return <div className="p-4 text-red-600 text-center">{(error as Error)?.message || 'Failed to load timesheets.'}</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/m/dashboard')} className="text-sm text-accent mb-2">&larr; Back</button>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-text-primary">Timesheets</h1>
        <button
          onClick={() => navigate('/m/timesheets/new')}
          className="px-3 py-1.5 bg-accent text-white text-sm rounded-lg"
          aria-label="New timesheet entry"
        >
          + New Entry
        </button>
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              statusFilter === f
                ? 'bg-accent text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {f === 'All' ? 'All' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-text-secondary text-sm text-center py-8 border border-dashed border-border rounded-lg">
          No timesheet entries found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ts => (
            <div key={ts.id} className="bg-surface-primary border border-border rounded-lg p-3">
              {ts.status === 'Rejected' && ts.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mb-2 text-xs text-red-700">
                  Rejected: {ts.rejection_reason}
                </div>
              )}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{ts.work_type ?? 'No work type'}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{ts.entry_date} · {ts.hours}h</p>
                  {ts.description && <p className="text-xs text-text-secondary mt-0.5">{ts.description}</p>}
                  {ts.approved_by && <p className="text-xs text-green-600 mt-0.5">Approved by {ts.approved_by}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${STATUS_COLORS[ts.status] ?? ''}`}>{ts.status}</span>
              </div>
              <div className="flex gap-2 mt-2">
                {ts.status === 'Draft' && (
                  <>
                    <button onClick={() => navigate(`/m/timesheets/${ts.id}`)} className="px-2 py-1 text-xs border border-border rounded text-text-primary" aria-label={`Edit ${ts.work_type}`}>Edit</button>
                    <button onClick={() => submitTimesheet.mutate(ts.id)} className="px-2 py-1 text-xs border border-accent text-accent rounded" aria-label={`Submit ${ts.work_type}`}>Submit</button>
                    <button onClick={() => deleteTimesheet.mutate(ts.id)} className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded" aria-label={`Delete ${ts.work_type}`}>Delete</button>
                  </>
                )}
                {ts.status === 'Submitted' && (
                  <button onClick={() => navigate(`/m/timesheets/${ts.id}`)} className="px-2 py-1 text-xs border border-border rounded text-text-primary" aria-label="View timesheet">View</button>
                )}
                {(ts.status === 'Approved' || ts.status === 'Rejected') && (
                  <button onClick={() => navigate(`/m/timesheets/${ts.id}`)} className="px-2 py-1 text-xs border border-border rounded text-text-primary" aria-label="View timesheet details">View</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}