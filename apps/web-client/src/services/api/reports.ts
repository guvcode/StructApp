import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { ReportJob, ReportOutputType } from '../../types';

export async function getReportJobs(): Promise<ReportJob[]> {
  return apiClient(ENDPOINTS.reports.jobs);
}

export async function getReportJobById(id: string): Promise<ReportJob | null> {
  try {
    return await apiClient(ENDPOINTS.reports.byId(id));
  } catch {
    return null;
  }
}

export async function generateReport(type: ReportOutputType, projectId: string, requesterName: string): Promise<ReportJob> {
  return apiClient(ENDPOINTS.reports.generate, {
    method: 'POST',
    body: JSON.stringify({ type, project_id: projectId, requester_name: requesterName }),
  });
}

export async function retryReportJob(jobId: string): Promise<void> {
  await apiClient(ENDPOINTS.reports.retry(jobId), { method: 'POST' });
}