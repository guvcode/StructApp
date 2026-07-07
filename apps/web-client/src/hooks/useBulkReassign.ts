import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';

export interface BulkReassignResult {
  reassignedCount: number;
}

export function useBulkReassign(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation<BulkReassignResult, Error, { sourceInspectorId: string; targetInspectorId: string; inspectionIds: string[]; reason?: string }>({
    mutationFn: (payload) =>
      apiClient<BulkReassignResult>(ENDPOINTS.inspections.bulkReassign, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['inspections'] });
      onSuccess?.();
    },
  });
}
