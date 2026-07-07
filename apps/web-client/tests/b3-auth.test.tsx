import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { clearSession, setSession, getLandingRoute, isSessionExpired, getActiveClientId, setActiveClientId, getHasUnsyncedWork, isAuthenticated } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole } from '../src/types/index';

beforeEach(() => {
  clearSession();
  localStorage.clear();
});

function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  const user: User = {
    id: 'u-test',
    email: 'test@example.com',
    display_name: 'Test User',
    role: UserRole.contractor,
    is_active: true,
    client_memberships: [{ client_id: 'c-apex', client_role: 'primary' }],
  };
  return {
    token: 'mock-token',
    user,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    ...overrides,
  };
}

describe('Bundle 3 — Auth Screens', () => {

  describe('LoginPage', () => {
    it('renders email and password fields', async () => {
      const { default: LoginPage } = await import('../src/pages/auth/LoginPage');
      render(<MemoryRouter><LoginPage /></MemoryRouter>);
      expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    }, 10000);

    it('shows error on empty submit', async () => {
      const { default: LoginPage } = await import('../src/pages/auth/LoginPage');
      render(<MemoryRouter><LoginPage /></MemoryRouter>);
      const buttons = screen.getAllByRole('button', { name: /sign in/i });
      fireEvent.click(buttons[0]);
      await waitFor(() => {
        expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
      });
    });

    it('has link to activate page', async () => {
      const { default: LoginPage } = await import('../src/pages/auth/LoginPage');
      render(<MemoryRouter><LoginPage /></MemoryRouter>);
      expect(screen.getByText(/Activate your invite/i)).toBeInTheDocument();
    });
  });

  describe('SessionExpiredPage', () => {
    it('renders expired message and sign in link', async () => {
      const { default: SessionExpiredPage } = await import('../src/pages/auth/SessionExpiredPage');
      render(<MemoryRouter><SessionExpiredPage /></MemoryRouter>);
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in again/i })).toBeInTheDocument();
    });
  });

  describe('ActivatePage', () => {
    it('renders password and confirm fields', async () => {
      const { default: ActivatePage } = await import('../src/pages/auth/ActivatePage');
      render(<MemoryRouter initialEntries={['/activate?token=abc']}><ActivatePage /></MemoryRouter>);
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('shows error for short password', async () => {
      const { default: ActivatePage } = await import('../src/pages/auth/ActivatePage');
      render(<MemoryRouter initialEntries={['/activate?token=abc']}><ActivatePage /></MemoryRouter>);
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: '123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /activate/i }));
      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for password mismatch', async () => {
      const { default: ActivatePage } = await import('../src/pages/auth/ActivatePage');
      render(<MemoryRouter initialEntries={['/activate?token=abc']}><ActivatePage /></MemoryRouter>);
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } });
      fireEvent.click(screen.getByRole('button', { name: /activate/i }));
      await waitFor(() => {
        expect(screen.getByText(/do not match/i)).toBeInTheDocument();
      });
    });

    it('shows missing token warning when no token', async () => {
      const { default: ActivatePage } = await import('../src/pages/auth/ActivatePage');
      render(<MemoryRouter><ActivatePage /></MemoryRouter>);
      expect(screen.getByText(/no invitation token found/i)).toBeInTheDocument();
    });
  });

  describe('ClientPickerPage', () => {
    it('renders client list from session', async () => {
      const session = makeSession({
        user: {
          ...makeSession().user,
          client_memberships: [
            { client_id: 'c-apex', client_role: 'primary' as const },
            { client_id: 'c-buildwell', client_role: 'secondary' as const },
          ],
        },
      });
      setSession(session);
      const { default: ClientPickerPage } = await import('../src/pages/auth/ClientPickerPage');
      render(<MemoryRouter><ClientPickerPage /></MemoryRouter>);
      expect(screen.getByText(/apex construction/i)).toBeInTheDocument();
      expect(screen.getByText(/buildwell corp/i)).toBeInTheDocument();
    });

    it('shows empty state when no clients match search', async () => {
      const session = makeSession({
        user: {
          ...makeSession().user,
          client_memberships: [{ client_id: 'c-apex', client_role: 'primary' as const }],
        },
      });
      setSession(session);
      const { default: ClientPickerPage } = await import('../src/pages/auth/ClientPickerPage');
      render(<MemoryRouter><ClientPickerPage /></MemoryRouter>);
      fireEvent.change(screen.getByPlaceholderText(/search clients/i), { target: { value: 'zzzzz' } });
      await waitFor(() => {
        expect(screen.getByText(/no clients available/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Bundle 3 — Auth Store', () => {
  it('getLandingRoute returns correct routes', () => {
    expect(getLandingRoute('admin')).toBe('/admin/dashboard');
    expect(getLandingRoute('reviewer')).toBe('/reviewer/dashboard');
    expect(getLandingRoute('contractor')).toBe('/m/dashboard');
    expect(getLandingRoute('inspector')).toBe('/m/dashboard');
  });

  it('setActiveClientId and getActiveClientId work', () => {
    setSession(makeSession());
    setActiveClientId('c-apex');
    expect(getActiveClientId()).toBe('c-apex');
  });

  it('isSessionExpired returns true for expired session', () => {
    setSession(makeSession({ expires_at: new Date(0).toISOString() }));
    expect(isSessionExpired()).toBe(true);
  });

  it('isSessionExpired returns false for valid session', () => {
    setSession(makeSession());
    expect(isSessionExpired()).toBe(false);
  });

  it('isAuthenticated returns false for expired session', () => {
    setSession(makeSession({ expires_at: new Date(0).toISOString() }));
    expect(isAuthenticated()).toBe(false);
  });

  it('getHasUnsyncedWork returns session value', () => {
    setSession(makeSession({ hasUnsyncedWork: true }));
    expect(getHasUnsyncedWork()).toBe(true);
  });

  it('clearSession clears active client and unsynced flag', () => {
    setSession(makeSession({ active_client_id: 'c-apex', hasUnsyncedWork: true }));
    clearSession();
    expect(getActiveClientId()).toBeUndefined();
    expect(getHasUnsyncedWork()).toBe(false);
  });
});

describe('Bundle 3 — Mock Auth Service', () => {
  it('login returns session for valid credentials', async () => {
    const { login } = await import('../src/services/mockAuth');
    const session = await login('eleanor@apex.com', 'any');
    expect(session.token).toContain('mock-jwt');
    expect(session.user.email).toBe('eleanor@apex.com');
  });

  it('login throws for unknown email', async () => {
    const { login } = await import('../src/services/mockAuth');
    await expect(login('unknown@test.com', 'any')).rejects.toThrow('Invalid credentials');
  });

  it('login throws for inactive user', async () => {
    const { login } = await import('../src/services/mockAuth');
    await expect(login('old@user.com', 'any')).rejects.toThrow('Account is inactive');
  });

  it('login sets session in authStore', async () => {
    const { login } = await import('../src/services/mockAuth');
    await login('eleanor@apex.com', 'any');
    expect(isAuthenticated()).toBe(true);
    expect(getActiveClientId()).toBeUndefined();
  });

  it('logout clears session from authStore', async () => {
    const { login, logout } = await import('../src/services/mockAuth');
    await login('eleanor@apex.com', 'any');
    await logout();
    expect(isAuthenticated()).toBe(false);
  });

  it('activateInvite returns success', async () => {
    const { activateInvite } = await import('../src/services/mockAuth');
    const result = await activateInvite('valid-token', 'password123');
    expect(result.success).toBe(true);
  });
});

describe('Bundle 3 — UnsyncedWarningDialog', () => {
  it('renders when open', async () => {
    const { default: UnsyncedWarningDialog } = await import('../src/components/UnsyncedWarningDialog');
    render(<UnsyncedWarningDialog open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/unsynced work detected/i)).toBeInTheDocument();
    expect(screen.getByText(/log out anyway/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it('does not render when closed', async () => {
    const { default: UnsyncedWarningDialog } = await import('../src/components/UnsyncedWarningDialog');
    const { container } = render(<UnsyncedWarningDialog open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onConfirm when Log out anyway clicked', async () => {
    const onConfirm = vi.fn();
    const { default: UnsyncedWarningDialog } = await import('../src/components/UnsyncedWarningDialog');
    render(<UnsyncedWarningDialog open={true} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText(/log out anyway/i));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel clicked', async () => {
    const onCancel = vi.fn();
    const { default: UnsyncedWarningDialog } = await import('../src/components/UnsyncedWarningDialog');
    render(<UnsyncedWarningDialog open={true} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText(/cancel/i));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});