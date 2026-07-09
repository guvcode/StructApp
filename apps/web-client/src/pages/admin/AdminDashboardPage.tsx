import { useAdminDashboardStats } from '../../hooks/useDashboard';
import { useInspections } from '../../hooks/useInspections';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Skeleton, { StatCardSkeleton } from '../../components/Skeleton';
import { useState, useEffect } from 'react';
import { getCachedClientNames } from '../../lib/clientNameCache';

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboardStats();
  const { data: inspections = [], isLoading: loadingInspections } = useInspections();
  const [clientNames, setClientNames] = useState<Record<string, string>>({});

  useEffect(() => {
    getCachedClientNames().then(setClientNames);
  }, []);

  // Merge client names into cached ones from API response
  useEffect(() => {
    if (inspections.length > 0) {
      const names: Record<string, string> = {};
      inspections.forEach(insp => {
        if (insp.site_name) names[insp.site_id] = insp.site_name;
      });
      if (Object.keys(names).length > 0) {
        setClientNames(prev => ({ ...prev, ...names }));
      }
    }
  }, [inspections]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  const clients = data?.clients ?? [];
  const users = data?.users ?? [];
  const fieldWorkers = users.filter(u => u.role === 'inspector' || u.role === 'contractor').length;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-5xl font-bold text-text-primary mb-3">{clients.length}</p>
              <p className="text-sm font-medium text-text-secondary">Clients</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-5xl font-bold text-text-primary mb-3">{users.length}</p>
              <p className="text-sm font-medium text-text-secondary">Users</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-5xl font-bold text-text-primary mb-3">{fieldWorkers}</p>
              <p className="text-sm font-medium text-text-secondary">Field Workers</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-3 mb-10">
        <Link
          to="/admin/clients/new"
          className="px-5 py-2.5 bg-accent text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition-all"
        >
          Create Client
        </Link>
        <Link
          to="/admin/users/invite"
          className="px-5 py-2.5 bg-accent text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition-all"
        >
          Invite User
        </Link>
        <Link
          to="/inspections"
          className="px-5 py-2.5 border border-border text-text-primary font-medium rounded-lg hover:bg-surface-secondary transition-colors"
        >
          View Inspections
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Recent Inspections</h2>
          <Link to="/inspections" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        <Card padding="none" className="shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-text-secondary font-semibold">Inspection</th>
                  <th className="py-3 text-text-secondary font-semibold">Status</th>
                  <th className="py-3 text-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingInspections ? (
                  <tr><td colSpan={3} className="p-6"><Skeleton className="h-48 w-full rounded-lg" /></td></tr>
                ) : inspections.slice(0, 5).map(insp => {
                  return (
                    <tr key={insp.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 text-text-primary font-medium">
                        <span className="block">{insp.site_name || clientNames[insp.site_id] || insp.site_id}</span>
                        <span className="block text-xs text-text-secondary mt-0.5">{insp.scheduled_date ? `Scheduled: ${new Date(insp.scheduled_date).toLocaleDateString()}` : ''}</span>
                      </td>
                      <td className="py-4"><span className={`px-2 py-0.5 text-xs rounded-full ${insp.status === 'Approved' ? 'bg-green-100 text-green-700' : insp.status === 'Submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{insp.status}</span></td>
                      <td className="py-4">
                        <Link
                          to={`/inspections/${insp.id}/detail`}
                          className="text-xs text-accent hover:underline font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}