import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';

interface NotificationRow {
  id: number;
  notification_type: string;
  payload: Record<string, unknown>;
  status: string;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}

export default function EmailQueuePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ rows: NotificationRow[]; pagination: { page: number; totalPages: number; total: number } }>({
    queryKey: ['notifications', page],
    queryFn: () => apiClient(`${ENDPOINTS.notifications.list}?page=${page}&limit=50`),
  });

  const resendMutation = useMutation({
    mutationFn: (id: number) => apiClient(ENDPOINTS.notifications.resend(id), { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient(ENDPOINTS.notifications.delete(id), { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.rows ?? [];
  const pagination = data?.pagination;

  if (isLoading) return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <button onClick={() => navigate('/admin/dashboard')} className="text-sm text-accent mb-4">&larr; Admin Dashboard</button>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Email Queue</h1>
      <p className="text-sm text-text-secondary mb-4">{pagination?.total ?? 0} notifications total</p>

      <Card padding="none" className="shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Email queue">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-3 text-text-secondary font-semibold">Type</th>
                <th className="py-3 text-text-secondary font-semibold">Status</th>
                <th className="py-3 text-text-secondary font-semibold">Retries</th>
                <th className="py-3 text-text-secondary font-semibold">Created</th>
                <th className="py-3 text-text-secondary font-semibold">Sent</th>
                <th className="py-3 text-text-secondary font-semibold">Error</th>
                <th className="py-3 text-text-secondary font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 text-text-primary font-medium">{n.notification_type}</td>
                  <td className="py-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      n.status === 'sent' ? 'bg-green-100 text-green-800' :
                      n.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="py-4 text-text-secondary">{n.retry_count}/3</td>
                  <td className="py-4 text-text-secondary">{new Date(n.created_at).toLocaleString()}</td>
                  <td className="py-4 text-text-secondary whitespace-nowrap">{n.sent_at ? new Date(n.sent_at).toLocaleString() : '—'}</td>
                  <td className="py-4 text-xs text-red-600 break-words whitespace-normal">{n.last_error ?? '—'}</td>
                  <td className="py-4">
                    <div className="flex gap-2">
                        <button
                          onClick={() => resendMutation.mutate(n.id)}
                          disabled={resendMutation.isPending}
                          className="px-3 py-1.5 text-xs font-medium border border-border text-text-primary rounded-md hover:bg-surface-hover"
                        >
                          Resend
                        </button>
                      <button
                        onClick={() => deleteMutation.mutate(n.id)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 rounded-md hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-text-secondary text-sm">No notifications in queue.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-text-secondary">Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}