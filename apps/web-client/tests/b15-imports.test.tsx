import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

beforeEach(async () => {
  const mod = await import('../src/services/mockImports');
  mod.mockBatches.length = 0;
  mod.seedBatches();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Bundle 15 — Mock Import Service', () => {
  it('getBatches returns all batches', async () => {
    const mod = await import('../src/services/mockImports');
    const batches = await mod.getBatches();
    expect(batches.length).toBeGreaterThan(0);
  });

  it('simulateUpload creates a new Validated batch with rows', async () => {
    const mod = await import('../src/services/mockImports');
    const batch = await mod.simulateUpload();
    expect(batch.status).toBe('Validated');
    expect(batch.rows.length).toBeGreaterThan(0);
    expect(batch.rows.some(r => r.status === 'Valid')).toBe(true);
  });

  it('commitBatch sets status to Committed', async () => {
    const mod = await import('../src/services/mockImports');
    const batch = await mod.simulateUpload();
    const committed = await mod.commitBatch(batch.id);
    expect(committed.status).toBe('Committed');
  });

  it('discardBatch sets status to Discarded', async () => {
    const mod = await import('../src/services/mockImports');
    const batch = await mod.simulateUpload();
    const discarded = await mod.discardBatch(batch.id);
    expect(discarded.status).toBe('Discarded');
  });

  it('throws when committing a non-existent batch', async () => {
    const mod = await import('../src/services/mockImports');
    await expect(mod.commitBatch('nonexistent')).rejects.toThrow('not found');
  });

  it('getBatch returns a single batch', async () => {
    const mod = await import('../src/services/mockImports');
    const all = await mod.getBatches();
    const batch = await mod.getBatch(all[0].id);
    expect(batch?.id).toBe(all[0].id);
  });
});

describe('Bundle 15 — Import Center Page', () => {
  async function renderPage() {
    const PageModule = await import('../src/pages/admin/ImportCenterPage');
    const Page = PageModule.default;
    return render(wrap(<Page />));
  }

  it('renders Import Center with title', async () => {
    await renderPage();
    expect(screen.getByText(/Import Center/i)).toBeInTheDocument();
  });

  it('shows Simulate Upload button', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /simulate upload/i })).toBeInTheDocument();
    });
  });

  it('shows validation table after upload', async () => {
    await renderPage();
    await waitFor(() => {
      const btn = screen.queryByRole('button', { name: /simulate upload/i });
      if (btn) fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(screen.getAllByText(/batch #/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Bundle 15 — Import History Page', () => {
  async function renderPage() {
    const PageModule = await import('../src/pages/admin/ImportHistoryPage');
    const Page = PageModule.default;
    return render(wrap(<Page />));
  }

  it('renders Import History with title', async () => {
    await renderPage();
    expect(screen.getByText(/Import History/i)).toBeInTheDocument();
  });

  it('shows batch list with statuses', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('Committed')).toBeInTheDocument();
    });
    expect(screen.getByText('Discarded')).toBeInTheDocument();
  });
});