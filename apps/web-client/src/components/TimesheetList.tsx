import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { formatDate } from '@/utils/dates';
import Skeleton from './Skeleton';

export interface TimesheetRow {
  entry_id: string;
  user_id: string;
  project_id: string;
  inspection_id: string | null;
  client_id: string;
  work_type: string;
  hours_logged: string;
  entry_date: string;
  pre_inspection: boolean;
  status: string;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function TimesheetList() {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: TimesheetRow[] }>({
    queryKey: ['timesheets'],
    queryFn: async () => {
      const authState = await db.authState.get('current');
      const response = await fetch('/api/v1/timesheets', {
        headers: {
          Authorization: `Bearer ${authState?.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch timesheets');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-6 w-32 mb-4" /><Skeleton className="h-48 w-full rounded-lg" /></div>;
  }

  if (error) {
    return <div className="p-6 text-error">Error loading timesheets</div>;
  }

  const entries = data?.data || [];

  return (
    <div className="p-6">
      <h2 className="text-text-primary font-semibold text-lg mb-4">Timesheets</h2>
      {entries.length === 0 ? (
        <p className="text-text-secondary text-sm">No timesheet entries found.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {entries.map((entry) => (
            <li
              key={entry.entry_id}
              className={`flex items-start justify-between p-4 ${entry.pre_inspection ? 'border-l-4 border-l-warning bg-warning/5' : ''}`}
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {entry.work_type}
                  {entry.pre_inspection && (
                    <span className="ml-2 text-xs bg-warning/20 text-warning-foreground px-2 py-0.5 rounded-full">
                      Logged before inspection date
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {formatDate(entry.entry_date)} · {entry.hours_logged}h · {entry.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
