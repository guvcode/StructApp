import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

beforeEach(async () => {
  const mod = await import('../src/services/mockAuditLogs');
  mod.mockAuditLogs.length = 0;
  mod.seedAuditLogs();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Bundle 14 — Mock Audit Logs Service', () => {
  it('getAuditLogs returns paginated results', async () => {
    const mod = await import('../src/services/mockAuditLogs');
    const result = await mod.getAuditLogs({}, 1, 10);
    expect(result.logs.length).toBeLessThanOrEqual(10);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
  });

  it('getAuditLogs filters by table_name', async () => {
    const mod = await import('../src/services/mockAuditLogs');
    const result = await mod.getAuditLogs({ table_name: 'inspections' }, 1, 50);
    expect(result.logs.every(l => l.table_name === 'inspections')).toBe(true);
  });

  it('getAuditLogs filters by action', async () => {
    const mod = await import('../src/services/mockAuditLogs');
    const result = await mod.getAuditLogs({ action: 'APPROVE' }, 1, 50);
    expect(result.logs.every(l => l.action === 'APPROVE')).toBe(true);
  });

  it('getAuditLogs filters by date range', async () => {
    const mod = await import('../src/services/mockAuditLogs');
    const result = await mod.getAuditLogs({ start_date: '2099-01-01', end_date: '2099-12-31' }, 1, 50);
    expect(result.logs.length).toBe(0);
  });

  it('getAuditLogs supports pagination', async () => {
    const mod = await import('../src/services/mockAuditLogs');
    const page1 = await mod.getAuditLogs({}, 1, 5);
    const page2 = await mod.getAuditLogs({}, 2, 5);
    expect(page1.logs.length).toBe(5);
    expect(page2.logs.length).toBeGreaterThan(0);
    expect(page1.logs[0].log_id).not.toBe(page2.logs[0].log_id);
  });
});

describe('Bundle 14 — Audit Log Page', () => {
  async function renderPage() {
    const AuditLogPageModule = await import('../src/pages/admin/AuditLogPage');
    const AuditLogPage = AuditLogPageModule.default;
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuditLogPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  it('renders the audit log viewer', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText(/System Audit Log/i)).toBeInTheDocument();
    });
  });

  it('shows audit log entries after loading', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('inspections').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('APPROVE').length).toBeGreaterThanOrEqual(1);
  });

  it('shows filter inputs', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/table name/i)).toBeInTheDocument();
    });
    expect(screen.getAllByPlaceholderText(/record id/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText(/action/i)).toBeInTheDocument();
  });
});