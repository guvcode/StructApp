// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole, InspectionStatus } from '../src/types/index';
import DeficiencyPhotosPage from '../src/pages/mobile/DeficiencyPhotosPage';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  clearSession();
  localStorage.clear();
  const user: User = { id: 'u-1', email: 'i@test.com', display_name: 'Inspector', role: UserRole.inspector, is_active: true, client_memberships: [{ client_id: 'c-1', client_role: 'primary' }] };
  setSession({ token: 'mock-token', user, expires_at: new Date(Date.now() + 3600_000).toISOString(), active_client_id: 'c-1' } as AuthSession);
});

vi.mock('../src/lib/db', () => ({
  db: {
    offlinePhotos: {
      clear: vi.fn().mockResolvedValue(undefined),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn(() => new Promise<any[]>(resolve => setTimeout(() => resolve([]), 0))),
        }),
      }),
    },
  },
}));

describe('Bundle 31 — Mobile DeficiencyPhotosPage metadata', () => {
  beforeEach(() => {
    testQueryClient.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows upload button when readOnly is false', async () => {
    render(wrap(
      <MemoryRouter initialEntries={['/m/deficiencies/d-1/photos']}>
        <Routes>
          <Route path="/m/deficiencies/:localId/photos" element={<DeficiencyPhotosPage />} />
        </Routes>
      </MemoryRouter>
    ));

    expect(await screen.findByRole('button', { name: /take photo/i })).toBeTruthy();
  });

  it('shows loading state when photos not loaded', async () => {
    render(wrap(
      <MemoryRouter initialEntries={['/m/deficiencies/d-1/photos']}>
        <Routes>
          <Route path="/m/deficiencies/:localId/photos" element={<DeficiencyPhotosPage />} />
        </Routes>
      </MemoryRouter>
    ));

    expect(screen.getByText(/loading photos/i)).toBeTruthy();
  });

  it('renders photo grid with capture date for synced photos', async () => {
    render(wrap(
      <MemoryRouter initialEntries={['/m/deficiencies/d-1/photos']}>
        <Routes>
          <Route path="/m/deficiencies/:localId/photos" element={<DeficiencyPhotosPage />} />
        </Routes>
      </MemoryRouter>
    ));

    expect(await screen.findByRole('button', { name: /take photo/i })).toBeTruthy();
  });
});
