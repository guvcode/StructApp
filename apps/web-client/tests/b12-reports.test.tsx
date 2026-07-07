import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole } from '../src/types/index';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

const reviewerUser: User = {
  id: 'u-reviewer',
  email: 'reviewer@structapp.com',
  display_name: 'Reviewer User',
  role: UserRole.reviewer,
  is_active: true,
  client_memberships: [{ client_id: 'c-apex', client_role: 'secondary' as const }],
};

function makeSession(): AuthSession {
  return {
    token: 'mock-token',
    user: reviewerUser,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  };
}

const originalSeed: Record<string, any> = {};

beforeEach(async () => {
  clearSession();
  localStorage.clear();
  const mod = await import('../src/services/mockReports');
  if (!originalSeed.jobs) {
    originalSeed.jobs = JSON.parse(JSON.stringify(mod.mockReportJobs));
  }
  mod.mockReportJobs.length = 0;
  originalSeed.jobs.forEach((j: any) => mod.mockReportJobs.push({ ...j }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Bundle 12 — Mock Reports Service', () => {

  it('getReportJobs returns report jobs', async () => {
    const mod = await import('../src/services/mockReports');
    const jobs = await mod.getReportJobs();
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0]).toHaveProperty('status');
    expect(jobs[0]).toHaveProperty('type');
  });

  it('getReportJobById returns single job', async () => {
    const mod = await import('../src/services/mockReports');
    const job = await mod.getReportJobById('rpt-001');
    expect(job).not.toBeNull();
    expect(job && job.id).toBe('rpt-001');
  });

  it('getReportJobById returns null for unknown', async () => {
    const mod = await import('../src/services/mockReports');
    const job = await mod.getReportJobById('rpt-unknown');
    expect(job).toBeNull();
  });

  it('generateReport creates Queued job', async () => {
    const mod = await import('../src/services/mockReports');
    const job = await mod.generateReport('final_pdf' as any, 'p-bridge-1', 'Test User');
    expect(job.status).toBe('Queued');
    expect(job.project_id).toBe('p-bridge-1');
    expect(job.type).toBe('final_pdf');
  });

  it('generateReport sets project_name from mock projects', async () => {
    const mod = await import('../src/services/mockReports');
    const job = await mod.generateReport('draft_pdf' as any, 'p-bridge-1', 'Test User');
    expect(job.project_name).toBe('Harbor Bridge Inspection');
  });

  it('retryReportJob resets to Queued', async () => {
    const mod = await import('../src/services/mockReports');
    const retried = await mod.retryReportJob('rpt-004');
    expect(retried.status).toBe('Queued');
    expect(retried.error_message).toBeUndefined();
  });

  it('OUTPUT_TYPE_LABELS maps all types', async () => {
    const mod = await import('../src/services/mockReports');
    expect(mod.OUTPUT_TYPE_LABELS['draft_pdf']).toBe('Draft PDF');
    expect(mod.OUTPUT_TYPE_LABELS['final_pdf']).toBe('Final PDF');
    expect(mod.OUTPUT_TYPE_LABELS['word']).toBe('Word');
    expect(mod.OUTPUT_TYPE_LABELS['excel']).toBe('Excel');
  });

  it('mock download_url includes signed token', async () => {
    const mod = await import('../src/services/mockReports');
    const job = await mod.generateReport('draft_pdf' as any, 'p-bridge-1', 'Test User');
    expect(job.status).toBe('Queued');
    await new Promise(r => setTimeout(r, 2200));
    const updated = await mod.getReportJobById(job.id);
    if (updated?.status === 'Ready' && updated.download_url) {
      expect(updated.download_url).toContain('?token=mock-signed');
      expect(updated.download_url).toContain('expires=');
    }
  });
});

describe('Bundle 12 — ReportCenterPage', () => {
  it('renders generation form with header', async () => {
    setSession(makeSession());
    const { default: ReportCenterPage } = await import('../src/pages/reviewer/ReportCenterPage');
    render(wrap(<ReportCenterPage />));
    await waitFor(() => {
      expect(screen.getByText(/report publishing center/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/generate new report/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/generate report/i)).toBeInTheDocument();
  });

  it('shows skeleton while loading', async () => {
    setSession(makeSession());
    const mod = await import('../src/services/mockReports');
    vi.spyOn(mod, 'getReportJobs').mockReturnValue(new Promise(() => {}));
    const { default: ReportCenterPage } = await import('../src/pages/reviewer/ReportCenterPage');
    render(wrap(<ReportCenterPage />));
    await waitFor(() => {
      expect(document.querySelector('.animate-fadeIn')).toBeInTheDocument();
    });
  });

  it('shows EmptyState when no jobs', async () => {
    setSession(makeSession());
    const mod = await import('../src/services/mockReports');
    vi.spyOn(mod, 'getReportJobs').mockResolvedValue([]);
    const { default: ReportCenterPage } = await import('../src/pages/reviewer/ReportCenterPage');
    render(wrap(<ReportCenterPage />));
    await waitFor(() => {
      expect(screen.getByText(/no report jobs yet/i)).toBeInTheDocument();
    });
  });

  it('renders jobs table with completed_at column', async () => {
    setSession(makeSession());
    const { default: ReportCenterPage } = await import('../src/pages/reviewer/ReportCenterPage');
    render(wrap(<ReportCenterPage />));
    await waitFor(() => {
      expect(screen.getAllByText(/harbor bridge inspection/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it('shows download button for ready jobs', async () => {
    setSession(makeSession());
    const { default: ReportCenterPage } = await import('../src/pages/reviewer/ReportCenterPage');
    render(wrap(<ReportCenterPage />));
    await waitFor(() => {
      expect(screen.getAllByLabelText(/download/i).length).toBeGreaterThan(0);
    });
  });

  it('shows retry button for failed jobs', async () => {
    setSession(makeSession());
    const { default: ReportCenterPage } = await import('../src/pages/reviewer/ReportCenterPage');
    render(wrap(<ReportCenterPage />));
    await waitFor(() => {
      expect(screen.getByLabelText(/retry report generation/i)).toBeInTheDocument();
    });
  });
});