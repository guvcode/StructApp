import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

vi.mock('../src/lib/featureFlags', () => ({
  isFeatureEnabled: () => true,
  getFeatureFlags: () => [],
}));

let authStore: typeof import('../src/lib/authStore');

async function setSession(role: string) {
  if (!authStore) authStore = await import('../src/lib/authStore');
  authStore.setSession({ token: 'mock', user: { id: 'u1', email: 't@t.com', display_name: 'Test', role, is_active: true, client_memberships: [] }, expires_at: '9999-12-31' });
}

async function clearSession() {
  if (!authStore) authStore = await import('../src/lib/authStore');
  authStore.clearSession();
}

describe('Bundle 2 — Routing', () => {

  it('renders login page at /login', async () => {
    await clearSession();
    const { default: AppRoutes } = await import('../src/routes');
    render(wrap(<AppRoutes />));
    const headings = await screen.findAllByRole('heading', { name: /sign in/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  }, 10000);

  describe('authenticated routes', () => {
    beforeAll(async () => { await setSession('admin'); });
    afterAll(async () => { await clearSession(); });

    it('renders mobile dashboard at /m/dashboard', async () => {
      await clearSession();
      await setSession('contractor');
      const { default: AppRoutes } = await import('../src/routes');
      render(wrap(<AppRoutes />));
      await screen.findByText('Dashboard page placeholder');
      expect(screen.getByText('Dashboard page placeholder')).toBeInTheDocument();
    });

    it('renders inspection list at /inspections', async () => {
      await setSession('admin');
      const { default: AppRoutes } = await import('../src/routes');
      render(wrap(<AppRoutes />));
      await screen.findByText('Inspection List page placeholder');
      expect(screen.getByText('Inspection List page placeholder')).toBeInTheDocument();
    });

    it('renders admin dashboard at /admin/dashboard', async () => {
      await setSession('admin');
      const { default: AppRoutes } = await import('../src/routes');
      render(wrap(<AppRoutes />));
      await screen.findByText('Admin Dashboard page placeholder');
      expect(screen.getByText('Admin Dashboard page placeholder')).toBeInTheDocument();
    });
  });

  it('renders 404 for unknown routes', async () => {
    await clearSession();
    const { default: AppRoutes } = await import('../src/routes');
    render(wrap(<AppRoutes />));
    await screen.findByText(/not found/i);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});