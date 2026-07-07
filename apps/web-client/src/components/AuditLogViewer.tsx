import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AuditLogEntry, AuditLogFilter } from '../types/index';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';

export function AuditLogViewer() {
  const [filters, setFilters] = useState<AuditLogFilter>({
    table_name: '',
    record_id: '',
    action: '',
    performed_by: '',
    start_date: '',
    end_date: '',
  });
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const cleanFilters: Record<string, string> = {};
  if (filters.table_name) cleanFilters.table_name = filters.table_name;
  if (filters.record_id) cleanFilters.record_id = filters.record_id;
  if (filters.action) cleanFilters.action = filters.action;
  if (filters.performed_by) cleanFilters.performed_by = filters.performed_by;
  if (filters.start_date) cleanFilters.start_date = filters.start_date;
  if (filters.end_date) cleanFilters.end_date = filters.end_date;

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', cleanFilters, page],
    queryFn: () => apiClient<{ logs: AuditLogEntry[]; total: number; page: number; pageSize: number }>(
      `${ENDPOINTS.auditLogs.list}?${new URLSearchParams({ ...cleanFilters, page: String(page), page_size: String(pageSize) }).toString()}`,
    ),
  });

  const handleFilterChange = (key: keyof AuditLogFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <h1 className="text-2xl font-bold text-text-primary mb-6">System Audit Log</h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface-secondary rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <h1 className="text-2xl font-bold text-text-primary mb-6">System Audit Log</h1>
        <div className="rounded-md border border-error/30 bg-error/5 p-4 text-error">Failed to load audit logs</div>
      </div>
    );
  }

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-text-primary mb-6">System Audit Log</h1>

      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <input
          type="text"
          placeholder="Table name"
          value={filters.table_name || ''}
          onChange={(e) => handleFilterChange('table_name', e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="text"
          placeholder="Record ID"
          value={filters.record_id || ''}
          onChange={(e) => handleFilterChange('record_id', e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="text"
          placeholder="Action"
          value={filters.action || ''}
          onChange={(e) => handleFilterChange('action', e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="text"
          placeholder="Performed by"
          value={filters.performed_by || ''}
          onChange={(e) => handleFilterChange('performed_by', e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="date"
          placeholder="Start date"
          value={filters.start_date || ''}
          onChange={(e) => handleFilterChange('start_date', e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="date"
          placeholder="End date"
          value={filters.end_date || ''}
          onChange={(e) => handleFilterChange('end_date', e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="border border-border rounded-lg bg-surface overflow-hidden">
        {logs.length === 0 ? (
          <p className="p-4 text-text-secondary text-sm">No audit events match your filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Time</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Table</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Action</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Record ID</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.log_id} className="hover:bg-surface-secondary">
                  <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-mono text-xs">{log.table_name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-primary font-mono text-xs">{log.record_id}</td>
                  <td className="px-4 py-3 text-text-primary font-mono text-xs">{log.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-text-secondary">
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}