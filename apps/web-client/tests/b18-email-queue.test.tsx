import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

const adminUser: User = {
  id: 'u-admin',
  email: 'admin@structapp.com',
  display_name: 'Admin User',
  role: UserRole.admin,
  is_active: true,
  client_memberships: [],
};

function makeAdminSession(): AuthSession {
  return {
    token: 'mock-token',
    user: adminUser,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  };
}

const mockNotifications = [
  {
    id: 1,
    notification_type: 'inspection_assigned',
    payload: { inspector_email: 'test@example.com' },
    status: 'pending',
    retry_count: 0,
    last_error: null,
    created_at: '2026-07-10T10:00:00Z',
    sent_at: null,
  },
  {
    id: 2,
    notification_type: 'inspection_submitted',
    payload: { reviewer_emails: ['r@example.com'] },
    status: 'sent',
    retry_count: 0,
    last_error: null,
    created_at: '2026-07-09T10:00:00Z',
    sent_at: '2026-07-09T10:01:00Z',
  },
  {
    id: 3,
    notification_type: 'p1_deficiency',
    payload: { client_email: 'c@example.com' },
    status: 'failed',
    retry_count: 3,
    last_error: 'Connection refused',
    created_at: '2026-07-08T10:00:00Z',
    sent_at: null,
  },
];

const mockApiResponse = {
  success: true,
  data: {
    rows: mockNotifications,
    pagination: { page: 1, limit: 50, total: 3, totalPages: 1 },
  },
};

describe('Bundle 18 — Email Queue Page', () => {
  beforeEach(() => {
    setSession(makeAdminSession());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    }));
  });

  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it('renders notification rows with type, status, retries, created, error, and actions', async () => {
    const { default: EmailQueuePage } = await import('../src/pages/admin/EmailQueuePage');
    render(wrap(<EmailQueuePage />));

    await waitFor(() => {
      expect(screen.getByText('inspection_assigned')).toBeInTheDocument();
    });

    expect(screen.getByText('inspection_submitted')).toBeInTheDocument();
    expect(screen.getByText('p1_deficiency')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('sent')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(screen.getAllByText('0/3')).toHaveLength(2);
    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });

  it('shows Resend button only for non-sent notifications', async () => {
    const { default: EmailQueuePage } = await import('../src/pages/admin/EmailQueuePage');
    render(wrap(<EmailQueuePage />));

    await waitFor(() => {
      expect(screen.getAllByText('Resend')).toHaveLength(2);
    });
  });

  it('shows Delete button on every row', async () => {
    const { default: EmailQueuePage } = await import('../src/pages/admin/EmailQueuePage');
    render(wrap(<EmailQueuePage />));

    await waitFor(() => {
      expect(screen.getAllByText('Delete')).toHaveLength(3);
    });
  });

  it('shows total notification count', async () => {
    const { default: EmailQueuePage } = await import('../src/pages/admin/EmailQueuePage');
    render(wrap(<EmailQueuePage />));

    await waitFor(() => {
      expect(screen.getByText('3 notifications total')).toBeInTheDocument();
    });
  });
});
