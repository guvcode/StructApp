import type { AuditLogEntry, AuditLogFilter, PaginatedResult } from '../types/index';

function delay(ms = 40): Promise<number> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 30));
}

export const mockAuditLogs: AuditLogEntry[] = [];

export function seedAuditLogs(): void {
  mockAuditLogs.length = 0;
  const entries: AuditLogEntry[] = [
    { log_id: 1, table_name: 'inspections', record_id: 'ins-001', action: 'APPROVE', old_values: { status: 'Submitted' }, new_values: { status: 'Approved' }, performed_by: 'Alice Admin', timestamp: '2026-06-28T09:00:00Z' },
    { log_id: 2, table_name: 'inspections', record_id: 'ins-002', action: 'RETURN', old_values: { status: 'Submitted' }, new_values: { status: 'Returned' }, performed_by: 'Alice Admin', timestamp: '2026-06-28T09:30:00Z' },
    { log_id: 3, table_name: 'inspections', record_id: 'ins-003', action: 'SUBMIT', old_values: { status: 'InProgress' }, new_values: { status: 'Submitted' }, performed_by: 'Bob Contractor', timestamp: '2026-06-28T10:00:00Z' },
    { log_id: 4, table_name: 'inspections', record_id: 'ins-001', action: 'REOPEN', old_values: { status: 'Approved' }, new_values: { status: 'Returned' }, performed_by: 'Alice Admin', timestamp: '2026-06-28T10:30:00Z' },
    { log_id: 5, table_name: 'users', record_id: 'usr-001', action: 'UPDATE', old_values: { role: 'contractor' }, new_values: { role: 'reviewer' }, performed_by: 'Alice Admin', timestamp: '2026-06-28T11:00:00Z' },
    { log_id: 6, table_name: 'deficiencies', record_id: 'def-001', action: 'CREATE', old_values: null, new_values: { severity: 'High' }, performed_by: 'Bob Contractor', timestamp: '2026-06-28T11:30:00Z' },
    { log_id: 7, table_name: 'inspections', record_id: 'ins-004', action: 'REASSIGN', old_values: { inspector_id: 'usr-002' }, new_values: { inspector_id: 'usr-003' }, performed_by: 'Carol Reviewer', timestamp: '2026-06-28T12:00:00Z' },
    { log_id: 8, table_name: 'inspections', record_id: 'ins-005', action: 'BULK_REASSIGN', old_values: null, new_values: { count: 3 }, performed_by: 'Carol Reviewer', timestamp: '2026-06-28T12:30:00Z' },
    { log_id: 9, table_name: 'users', record_id: 'usr-004', action: 'PIN_FALLBACK_ATTEMPT', old_values: null, new_values: { success: true, source_ip: '192.168.1.50' }, performed_by: 'Dave Contractor', timestamp: '2026-06-28T13:00:00Z' },
    { log_id: 10, table_name: 'photos', record_id: 'pho-001', action: 'DELETE', old_values: { deleted_at: null }, new_values: { deleted_at: '2026-06-28T13:30:00Z' }, performed_by: 'Bob Contractor', timestamp: '2026-06-28T13:30:00Z' },
    { log_id: 11, table_name: 'inspections', record_id: 'ins-002', action: 'APPROVE', old_values: { status: 'Submitted' }, new_values: { status: 'Approved' }, performed_by: 'Carol Reviewer', timestamp: '2026-06-27T15:00:00Z' },
    { log_id: 12, table_name: 'clients', record_id: 'cli-001', action: 'UPDATE', old_values: { name: 'Old Corp' }, new_values: { name: 'New Corp' }, performed_by: 'Alice Admin', timestamp: '2026-06-27T14:00:00Z' },
    { log_id: 13, table_name: 'timesheets', record_id: 'ts-001', action: 'APPROVE', old_values: { status: 'Submitted' }, new_values: { status: 'Approved' }, performed_by: 'Carol Reviewer', timestamp: '2026-06-27T12:00:00Z' },
    { log_id: 14, table_name: 'remediation', record_id: 'rem-001', action: 'VERIFY_CLOSURE', old_values: { status: 'Remediated_Pending_Verification' }, new_values: { status: 'Verified_Closed' }, performed_by: 'Carol Reviewer', timestamp: '2026-06-27T11:00:00Z' },
    { log_id: 15, table_name: 'deficiencies', record_id: 'def-002', action: 'OVERRIDE_PRIORITY', old_values: { priority_tier: 'P3' }, new_values: { priority_tier: 'P1' }, performed_by: 'Carol Reviewer', timestamp: '2026-06-27T10:00:00Z' },
  ];
  entries.forEach(e => mockAuditLogs.push(e));
}

function matchesFilter(log: AuditLogEntry, filter: AuditLogFilter): boolean {
  if (filter.table_name && !log.table_name.toLowerCase().includes(filter.table_name.toLowerCase())) return false;
  if (filter.record_id && !log.record_id.toLowerCase().includes(filter.record_id.toLowerCase())) return false;
  if (filter.action && !log.action.toLowerCase().includes(filter.action.toLowerCase())) return false;
  if (filter.performed_by && !log.performed_by.toLowerCase().includes(filter.performed_by.toLowerCase())) return false;
  if (filter.start_date && log.timestamp < filter.start_date) return false;
  if (filter.end_date && log.timestamp > filter.end_date + 'T23:59:59Z') return false;
  return true;
}

export async function getAuditLogs(filter: AuditLogFilter, page: number, pageSize: number): Promise<PaginatedResult<AuditLogEntry>> {
  await delay();
  const filtered = mockAuditLogs.filter(l => matchesFilter(l, filter));
  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const start = (page - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);
  return { logs: paged, total: filtered.length, page, page_size: pageSize };
}

seedAuditLogs();