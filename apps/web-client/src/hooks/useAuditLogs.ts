import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api/auditLogs';
import type { AuditLogFilter } from '../types';

export function useAuditLogs(filter: AuditLogFilter, page: number, pageSize: number) {
  return useQuery({
    queryKey: ['auditLogs', filter, page, pageSize],
    queryFn: () => api.getAuditLogs(filter, page, pageSize),
  });
}