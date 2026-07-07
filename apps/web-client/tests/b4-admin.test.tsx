import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession, getActiveClientId } from '../src/lib/authStore';
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
  client_memberships: [
    { client_id: 'c-apex', client_role: 'primary' as const },
    { client_id: 'c-buildwell', client_role: 'secondary' as const },
    { client_id: 'c-skyline', client_role: 'secondary' as const },
  ],
};

function makeAdminSession(): AuthSession {
  return {
    token: 'mock-token',
    user: adminUser,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  };
}

beforeEach(() => {
  clearSession();
  localStorage.clear();
});

describe('Bundle 4 — Admin Dashboard', () => {
  it('renders governance cards', async () => {
    setSession(makeAdminSession());
    const { default: AdminDashboardPage } = await import('../src/pages/admin/AdminDashboardPage');
    render(wrap(<AdminDashboardPage />));
    await waitFor(() => {
      expect(screen.getByText(/clients/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/users/i)).toBeInTheDocument();
  });

  it('renders quick action links', async () => {
    setSession(makeAdminSession());
    const { default: AdminDashboardPage } = await import('../src/pages/admin/AdminDashboardPage');
    render(wrap(<AdminDashboardPage />));
    await waitFor(() => {
      expect(screen.getByText(/create client/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/invite user/i)).toBeInTheDocument();
  });
});

describe('Bundle 4 — Client Management', () => {
  it('renders client table with name and safety email', async () => {
    setSession(makeAdminSession());
    const { default: ClientListPage } = await import('../src/pages/admin/ClientListPage');
    render(wrap(<ClientListPage />));
    await waitFor(() => {
      expect(screen.getByText(/apex construction/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/buildwell corp/i)).toBeInTheDocument();
  });

  it('opens edit drawer on edit button click', async () => {
    setSession(makeAdminSession());
    const { default: ClientListPage } = await import('../src/pages/admin/ClientListPage');
    render(wrap(<ClientListPage />));
    await waitFor(() => {
      expect(screen.getByText(/apex construction/i)).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByDisplayValue(/apex construction/i)).toBeInTheDocument();
    });
  });
});

describe('Bundle 4 — New Client', () => {
  it('renders create form with name and safety email fields', async () => {
    const { default: NewClientPage } = await import('../src/pages/admin/NewClientPage');
    render(wrap(<NewClientPage />));
    expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/safety contact email/i)).toBeInTheDocument();
  });

  it('shows error on empty submit', async () => {
    const { default: NewClientPage } = await import('../src/pages/admin/NewClientPage');
    render(wrap(<NewClientPage />));
    fireEvent.click(screen.getByRole('button', { name: /create client/i }));
    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });
});

describe('Bundle 4 — User Management', () => {
  it('renders user table with name, email, role', async () => {
    setSession(makeAdminSession());
    const { default: UserListPage } = await import('../src/pages/admin/UserListPage');
    render(wrap(<UserListPage />));
    await waitFor(() => {
      expect(screen.getByText(/eleanor vance/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/priya sharma/i)).toBeInTheDocument();
  });

  it('opens role/membership editor drawer', async () => {
    setSession(makeAdminSession());
    const { default: UserListPage } = await import('../src/pages/admin/UserListPage');
    render(wrap(<UserListPage />));
    await waitFor(() => {
      expect(screen.getByText(/eleanor vance/i)).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getAllByText(/role/i).length).toBeGreaterThan(0);
    });
  });

  it('shows deactivate confirmation dialog', async () => {
    setSession(makeAdminSession());
    const { default: UserListPage } = await import('../src/pages/admin/UserListPage');
    render(wrap(<UserListPage />));
    await waitFor(() => {
      expect(screen.getByText(/eleanor vance/i)).toBeInTheDocument();
    });
    const deactivateButtons = screen.getAllByRole('button', { name: /deactivate/i });
    fireEvent.click(deactivateButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/confirm/i)).toBeInTheDocument();
    });
  });
});

describe('Bundle 4 — Invite User', () => {
  it('renders invite form fields', async () => {
    const { default: InviteUserPage } = await import('../src/pages/admin/InviteUserPage');
    render(wrap(<InviteUserPage />));
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });
});

describe('Bundle 4 — TenantContextBadge', () => {
  it('shows active client name from authStore', async () => {
    const session = makeAdminSession();
    setSession(session);
    const { setActiveClientId } = await import('../src/lib/authStore');
    setActiveClientId('c-apex');
    const { default: TenantContextBadge } = await import('../src/components/TenantContextBadge');
    render(<TenantContextBadge />);
    expect(screen.getByText(/apex construction/i)).toBeInTheDocument();
  });
});

describe('Bundle 4 — Mock Services', () => {
  it('createClient adds a new client', async () => {
    const { createClient } = await import('../src/services/mockClient');
    const client = await createClient({ name: 'Test Co', safety_email: 'test@test.com' });
    expect(client.name).toBe('Test Co');
    expect(client.safety_email).toBe('test@test.com');
    expect(client.id).toBeTruthy();
  });

  it('updateClient modifies existing client', async () => {
    const { updateClient } = await import('../src/services/mockClient');
    const updated = await updateClient('c-apex', { name: 'Apex Updated' });
    expect(updated.name).toBe('Apex Updated');
  });

  it('updateUser changes user role', async () => {
    const { updateUser } = await import('../src/services/mockUser');
    const updated = await updateUser('u-eleanor', { role: UserRole.reviewer });
    expect(updated.role).toBe(UserRole.reviewer);
  });

  it('deactivateUser sets is_active to false', async () => {
    const { deactivateUser } = await import('../src/services/mockUser');
    const updated = await deactivateUser('u-eleanor');
    expect(updated.is_active).toBe(false);
  });
});

describe('Bundle 4 — Admin Client Switcher', () => {
  it('renders client dropdown for admin', async () => {
    setSession(makeAdminSession());
    const { default: AdminClientSwitcher } = await import('../src/components/AdminClientSwitcher');
    render(wrap(<AdminClientSwitcher />));
    fireEvent.click(screen.getByText(/switch client/i));
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('switches active client on selection', async () => {
    setSession(makeAdminSession());
    const { default: AdminClientSwitcher } = await import('../src/components/AdminClientSwitcher');
    render(wrap(<AdminClientSwitcher />));
    fireEvent.click(screen.getByText(/switch client/i));
    await waitFor(() => {
      expect(screen.getByText(/buildwell corp/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/buildwell corp/i));
    expect(getActiveClientId()).toBe('c-buildwell');
  });
});