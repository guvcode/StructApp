import type { ReportJob } from '../types/index';
import { ReportJobStatus, ReportOutputType } from '../types/index';
import { mockProjects } from '../data/mock/projects';

function delay(ms = 60): Promise<number> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 70));
}

export const mockReportJobs: ReportJob[] = [
  { id: 'rpt-001', project_id: 'p-bridge-1', project_name: 'Harbor Bridge Inspection', type: ReportOutputType.DraftPdf, status: ReportJobStatus.Ready, requested_by: 'u-priya', requested_by_name: 'Priya Sharma', created_at: '2025-06-20T10:00:00Z', completed_at: '2025-06-20T10:02:00Z', download_url: '/mock-downloads/rpt-001.pdf' },
  { id: 'rpt-002', project_id: 'p-tower-1', project_name: 'Downtown Tower Assessment', type: ReportOutputType.FinalPdf, status: ReportJobStatus.Ready, requested_by: 'u-priya', requested_by_name: 'Priya Sharma', created_at: '2025-06-19T14:00:00Z', completed_at: '2025-06-19T14:03:00Z', download_url: '/mock-downloads/rpt-002.pdf' },
  { id: 'rpt-003', project_id: 'p-bridge-1', project_name: 'Harbor Bridge Inspection', type: ReportOutputType.Word, status: ReportJobStatus.Processing, requested_by: 'u-priya', requested_by_name: 'Priya Sharma', created_at: '2025-06-21T08:00:00Z' },
  { id: 'rpt-004', project_id: 'p-plant-1', project_name: 'River Plant Structural Audit', type: ReportOutputType.FinalPdf, status: ReportJobStatus.Failed, requested_by: 'u-priya', requested_by_name: 'Priya Sharma', created_at: '2025-06-18T09:00:00Z', error_message: 'Project data export failed: timeout exceeded. Please try again.' },
  { id: 'rpt-005', project_id: 'p-tower-1', project_name: 'Downtown Tower Assessment', type: ReportOutputType.Excel, status: ReportJobStatus.Queued, requested_by: 'u-priya', requested_by_name: 'Priya Sharma', created_at: '2025-06-21T09:00:00Z' },
];

export async function getReportJobs(): Promise<ReportJob[]> {
  await delay();
  return [...mockReportJobs];
}

export async function getReportJobById(id: string): Promise<ReportJob | null> {
  await delay(30);
  return mockReportJobs.find(j => j.id === id) ?? null;
}

export async function generateReport(
  type: ReportOutputType,
  projectId: string,
  requesterName: string
): Promise<ReportJob> {
  await delay(50);
  const project = mockProjects.find(p => p.id === projectId);
  const job: ReportJob = {
    id: `rpt-${Date.now()}`,
    project_id: projectId,
    project_name: project?.name ?? 'Unknown',
    type,
    status: ReportJobStatus.Queued,
    requested_by: 'u-current',
    requested_by_name: requesterName,
    created_at: new Date().toISOString(),
  };
  mockReportJobs.push(job);
  simulateProcessing(job.id);
  return job;
}

function simulateProcessing(jobId: string) {
  const job = mockReportJobs.find(j => j.id === jobId);
  if (!job) return;
  setTimeout(() => {
    job.status = ReportJobStatus.Processing;
  }, 500);
  setTimeout(() => {
    const success = Math.random() > 0.2;
    if (success) {
      job.status = ReportJobStatus.Ready;
      job.completed_at = new Date().toISOString();
      const expires = Date.now() + 3600000;
      job.download_url = `/mock-downloads/${job.id}.${job.type === ReportOutputType.Word ? 'docx' : job.type === ReportOutputType.Excel ? 'xlsx' : 'pdf'}?token=mock-signed&expires=${expires}`;
    } else {
      job.status = ReportJobStatus.Failed;
      job.error_message = 'Report generation failed due to a timeout. Please try again.';
    }
  }, 2000);
}

export async function retryReportJob(jobId: string): Promise<ReportJob> {
  await delay(40);
  const job = mockReportJobs.find(j => j.id === jobId);
  if (!job) throw new Error('Report job not found');
  job.status = ReportJobStatus.Queued;
  delete job.error_message;
  simulateProcessing(jobId);
  return job;
}

export const OUTPUT_TYPE_LABELS: Record<ReportOutputType, string> = {
  [ReportOutputType.DraftPdf]: 'Draft PDF',
  [ReportOutputType.FinalPdf]: 'Final PDF',
  [ReportOutputType.Word]: 'Word',
  [ReportOutputType.Excel]: 'Excel',
};