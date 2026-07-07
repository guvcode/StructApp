import { useState, Fragment } from 'react';
import { useReportJobs, useGenerateReport, useRetryReportJob } from '../../hooks/useReports';
import { useProjects } from '../../hooks/useRegister';
import type { ReportJob } from '../../types/index';
import { ReportJobStatus, ReportOutputType } from '../../types/index';
import { getSession } from '../../lib/authStore';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { REPORT_STATUS_STYLES } from '../../utils/statusMaps';

const OUTPUT_TYPE_LABELS: Record<string, string> = {
  draft_pdf: 'Draft PDF',
  final_pdf: 'Final PDF',
  word: 'Word',
  excel: 'Excel',
};

export default function ReportCenterPage() {
  const { data: jobs = [], isLoading, refetch } = useReportJobs();
  const { data: projects = [] } = useProjects();
  const generateReport = useGenerateReport();
  const retryReportJob = useRetryReportJob();

  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedType, setSelectedType] = useState<ReportOutputType>(ReportOutputType.DraftPdf);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedProject) { setError('Select a project.'); return; }
    setGenerating(true);
    setError('');
    try {
      const session = getSession();
      const name = session?.user?.display_name ?? session?.user?.email ?? 'Reviewer';
      await generateReport.mutateAsync({ type: selectedType, projectId: selectedProject, requesterName: name });
      refetch();
    } catch {
      setError('Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await retryReportJob.mutateAsync(jobId);
      refetch();
    } catch {
      setError('Failed to retry report job.');
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop() ?? 'report';
    a.click();
  };

  if (isLoading && jobs.length === 0) return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn space-y-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-bold text-text-primary">Report Publishing Center</h1>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>}

      <Card padding="lg" className="shadow-card">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-primary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
            >
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Report Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as ReportOutputType)}
              className="w-full px-4 py-2.5 bg-surface-primary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
            >
              {Object.values(ReportOutputType).map(t => (
                <option key={t} value={t}>{OUTPUT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedProject}
              className="w-full px-4 py-2.5 bg-accent text-white font-medium rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm"
              aria-label="Generate report"
            >
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Report Jobs</h2>

        {jobs.length === 0 ? (
          <Card padding="lg" className="shadow-card">
            <EmptyState icon="report" title="No report jobs yet" description="Generate a report to see jobs here." />
          </Card>
        ) : (
          <Card padding="none" className="shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Report jobs">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-3 text-text-secondary font-semibold">Status</th>
                    <th className="py-3 text-text-secondary font-semibold">Project</th>
                    <th className="py-3 text-text-secondary font-semibold">Type</th>
                    <th className="py-3 text-text-secondary font-semibold">Requested By</th>
                    <th className="py-3 text-text-secondary font-semibold">Created</th>
                    <th className="py-3 text-text-secondary font-semibold">Completed</th>
                    <th className="py-3 text-text-secondary font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <Fragment key={job.id}>
                    <tr className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4">
                        <StatusBadge label={job.status} map={REPORT_STATUS_STYLES} />
                          {job.status === ReportJobStatus.Processing && <span className="ml-1 animate-pulse">...</span>}
                        </td>
                      <td className="py-4 text-text-primary font-medium">{job.project_name ?? '—'}</td>
                      <td className="py-4 text-text-secondary">{OUTPUT_TYPE_LABELS[job.type] ?? job.type}</td>
                      <td className="py-4 text-text-secondary">{job.requested_by_name ?? job.requested_by}</td>
                      <td className="py-4 text-text-secondary">{job.created_at.split('T')[0]}</td>
                      <td className="py-4 text-text-secondary">{job.completed_at ? job.completed_at.split('T')[0] : '—'}</td>
                      <td className="py-4">
                        <div className="flex gap-2 items-center">
                          {job.status === ReportJobStatus.Ready && job.download_url && (
                            <button
                              onClick={() => handleDownload(job.download_url!)}
                              className="px-3 py-1.5 text-xs font-medium border border-green-200 text-green-700 rounded-md hover:bg-green-50 transition-colors shadow-sm"
                              aria-label={`Download ${OUTPUT_TYPE_LABELS[job.type]} for ${job.project_name}`}
                            >Download</button>
                          )}
                          {job.status === ReportJobStatus.Failed && (
                            <button
                              onClick={() => handleRetry(job.id)}
                              className="px-3 py-1.5 text-xs font-medium border border-accent text-accent rounded-md hover:bg-accent/5 transition-colors shadow-sm"
                              aria-label="Retry report generation"
                            >Retry</button>
                          )}
                          {job.status === ReportJobStatus.Queued || job.status === ReportJobStatus.Processing ? (
                            <span className="text-xs text-text-secondary italic">In progress...</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {job.status === ReportJobStatus.Failed && job.error_message && (
                      <tr key={`${job.id}-error`}>
                        <td colSpan={7} className="px-6 pb-4">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            {job.error_message}
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}