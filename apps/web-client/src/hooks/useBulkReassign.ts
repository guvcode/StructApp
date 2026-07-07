import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

export interface BulkReassignResult {
  reassignedCount: number;
}

export function useBulkReassign(onSuccess?: () => void) {
  const client = useQueryClient();

  return useMutation<BulkReassignResult, Error, { sourceInspectorId: string; targetInspectorId: string; inspectionIds: string[]; reason?: string }>({
    mutationFn: async (payload) => {
      const authState = await db.authState.get('current');
      if (!authState) {
        throw new Error('No authentication state found');
      }

      const response = await fetch('/api/v1/inspections/bulk-reassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Bulk reassign failed') as Error & { error_code?: string; offending_ids?: string[] };
        error.error_code = data.error_code;
        error.offending_ids = data.offending_ids;
        throw error;
      }

      return data as BulkReassignResult;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['inspections'] });
      onSuccess?.();
    },
  });
}
