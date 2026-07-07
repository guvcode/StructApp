import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { AuditLogEntry, AuditLogFilter, PaginatedResult } from '../../types';

export async function getAuditLogs(filter: AuditLogFilter, page: number, pageSize: number): Promise<PaginatedResult<AuditLogEntry>> {
  const params = new URLSearchParams();
  if (filter.table_name) params.set('table_name', filter.table_name);
  if (filter.record_id) params.set('record_id', filter.record_id);
  if (filter.action) params.set('action', filter.action);
  if (filter.performed_by) params.set('performed_by', filter.performed_by);
  if (filter.start_date) params.set('start_date', filter.start_date);
  if (filter.end_date) params.set('end_date', filter.end_date);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return apiClient(`${ENDPOINTS.auditLogs.list}?${params.toString()}`);
}