import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api/reports';
import type { ReportOutputType } from '../types';

export function useReportJobs() {
  return useQuery({
    queryKey: ['reports', 'jobs'],
    queryFn: () => api.getReportJobs(),
  });
}

export function useReportJobById(id: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'jobs', id],
    queryFn: () => api.getReportJobById(id!),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ type, projectId, requesterName }: { type: ReportOutputType; projectId: string; requesterName: string }) =>
      api.generateReport(type, projectId, requesterName),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['reports'] }); },
  });
}

export function useRetryReportJob() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.retryReportJob(jobId),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['reports'] }); },
  });
}