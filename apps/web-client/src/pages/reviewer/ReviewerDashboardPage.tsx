import { useReviewerDashboardStats } from '../../hooks/useDashboard';
import { getActiveClientId } from '../../lib/authStore';
import { InspectionStatus, PriorityTier } from '../../types/index';
import Card from '../../components/Card';
import Skeleton, { StatCardSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const STATUS_BAR_COLORS: Record<string, string> = {
  Submitted: '#f59e0b',
  Approved: '#10b981',
  Returned: '#ef4444',
  InProgress: '#6366f1',
  Draft: '#94a3b8',
  Assigned: '#3b82f6',
};

export default function ReviewerDashboardPage() {
  const { data, isLoading, isError } = useReviewerDashboardStats(getActiveClientId());

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data) return <div className="p-6 text-red-600 text-center">Failed to load dashboard data.</div>;

  const { inspections, deficiencies } = data;
  const submittedCount = inspections.filter(i => i.status === InspectionStatus.Submitted).length;
  const returnedCount = inspections.filter(i => i.status === InspectionStatus.Returned).length;
  const approvedCount = inspections.filter(i => i.status === InspectionStatus.Approved).length;
  const inProgressCount = inspections.filter(i => i.status === InspectionStatus.InProgress).length;
  const draftCount = inspections.filter(i => i.status === InspectionStatus.Draft).length;
  const assignedCount = inspections.filter(i => i.status === InspectionStatus.Assigned).length;
  const totalCount = inspections.length;
  const p1Count = deficiencies.filter(d => d.priority_tier === PriorityTier.P1).length;

  const statuses = [
    { label: 'Submitted', count: submittedCount },
    { label: 'Returned', count: returnedCount },
    { label: 'Approved', count: approvedCount },
    { label: 'In Progress', count: inProgressCount },
    { label: 'Draft', count: draftCount },
    { label: 'Assigned', count: assignedCount },
  ];
  const maxCount = Math.max(...statuses.map(s => s.count), 1);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Reviewer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-5xl font-bold text-text-primary mb-3">{totalCount}</p>
              <p className="text-sm font-medium text-text-secondary">Total Inspections</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-5xl font-bold text-yellow-600 mb-3">{submittedCount}</p>
              <p className="text-sm font-medium text-text-secondary">Pending Review</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-5xl font-bold text-red-600 mb-3">{returnedCount}</p>
              <p className="text-sm font-medium text-text-secondary">Returned</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-5xl font-bold text-red-600 mb-3">{p1Count}</p>
              <p className="text-sm font-medium text-text-secondary">P1 Deficiencies</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg" className="mb-8 shadow-card">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Inspections by Status</h2>
        <div className="flex gap-4 mb-6 flex-wrap">
          {statuses.filter(s => s.count > 0).map(s => (
            <span key={s.label} className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: STATUS_BAR_COLORS[s.label] ?? '#94a3b8' }} />
              {s.label}: {s.count}
            </span>
          ))}
        </div>
        <div className="flex items-end gap-2 h-40">
          {statuses.filter(s => s.count > 0).map(s => (
            <div key={s.label} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
              <span className="text-sm font-semibold text-text-primary">{s.count}</span>
              <div
                className="w-full rounded-t-md transition-all duration-500 hover:opacity-80"
                style={{
                  height: `${(s.count / maxCount) * 100}%`,
                  backgroundColor: STATUS_BAR_COLORS[s.label] ?? '#94a3b8',
                  minHeight: s.count > 0 ? '8px' : '0',
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg" className="shadow-card">
        <h2 className="text-xl font-semibold text-text-primary mb-6">P1 Priority Items</h2>
        {deficiencies.filter(d => d.priority_tier === PriorityTier.P1).length === 0 ? (
          <EmptyState icon="check" title="No P1 deficiencies" description="All priority items have been addressed." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 text-text-secondary font-semibold">Title</th>
                  <th className="pb-3 text-text-secondary font-semibold">Inspection</th>
                  <th className="pb-3 text-text-secondary font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {deficiencies.filter(d => d.priority_tier === PriorityTier.P1).map(d => {
                  const insp = inspections.find(i => i.id === d.inspection_id);
                  return (
                    <tr key={d.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="py-3 text-text-primary font-medium">{d.title}</td>
                      <td className="py-3 text-text-secondary">{d.inspection_id}</td>
                      <td className="py-3">
                        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-medium">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}