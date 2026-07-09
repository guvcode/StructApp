import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole, InspectionStatus } from '../src/types/index';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  clearSession();
  localStorage.clear();
  const user: User = { id: 'u-marcus', email: 'marcus@example.com', display_name: 'Marcus Chen', role: UserRole.contractor, is_active: true, client_memberships: [{ client_id: 'c-apex', client_role: 'primary' }] };
  setSession({ token: 'mock-token', user, expires_at: new Date(Date.now() + 3600_000).toISOString(), active_client_id: 'c-apex' } as AuthSession);
});

describe('Bundle 6 — Contractor Mobile', () => {

  describe('B6-T09 — useLocalState', () => {
    it('loads and saves draft state', async () => {
      const { useLocalState } = await import('../src/lib/useLocalState');
      const { result } = renderHook(() => useLocalState<string>('test-key'));
      expect(result.current.value).toBeUndefined();
      act(() => result.current.save('hello'));
      expect(result.current.value).toBe('hello');
    });
  });

  describe('B6-T02 — SyncPage', () => {
    it('renders sync hub with pull/push buttons', async () => {
      const { default: SyncPage } = await import('../src/pages/mobile/SyncPage');
      render(wrap(<MemoryRouter><SyncPage /></MemoryRouter>));
      expect(await screen.findByText(/sync hub/i)).toBeInTheDocument();
      expect(screen.getByText(/pull package/i)).toBeInTheDocument();
      expect(screen.getByText(/push outbox/i)).toBeInTheDocument();
    });
  });

  describe('B6-T01 — DashboardPage', () => {
    it('renders assigned inspections and pending sync card', async () => {
      const { default: DashboardPage } = await import('../src/pages/mobile/DashboardPage');
      render(wrap(<MemoryRouter><DashboardPage /></MemoryRouter>));
      expect(await screen.findByText(/assigned inspections/i)).toBeInTheDocument();
      expect(screen.getByText(/pending sync/i)).toBeInTheDocument();
    });
  });

  describe('B6-T04 — StructureSearchPage', () => {
    it('renders search input and results area', async () => {
      const { default: StructureSearchPage } = await import('../src/pages/mobile/StructureSearchPage');
      render(wrap(<MemoryRouter><StructureSearchPage /></MemoryRouter>));
      expect(await screen.findByPlaceholderText(/search|asset/i)).toBeInTheDocument();
    });
  });

  describe('B6-T03 — InspectionDetailPage', () => {
    it('shows inspection summary and deficiency list', async () => {
      const { default: InspectionDetailPage } = await import('../src/pages/mobile/InspectionDetailPage');
      render(wrap(<MemoryRouter initialEntries={['/m/inspections/i-001']}><Routes><Route path="/m/inspections/:id" element={<InspectionDetailPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/harbor bridge/i)).toBeInTheDocument();
      expect(screen.getByText(/deficiencies/i)).toBeInTheDocument();
    });
  });

  describe('B6-T06 — DeficiencyDetailPage', () => {
    it('renders deficiency create form with cascading taxonomy fields', async () => {
      const { default: DeficiencyDetailPage } = await import('../src/pages/mobile/DeficiencyDetailPage');
      render(wrap(<MemoryRouter initialEntries={['/m/deficiencies/new?inspection_id=i-001']}><Routes><Route path="/m/deficiencies/:localId" element={<DeficiencyDetailPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/new deficiency/i)).toBeInTheDocument();
      expect(screen.getByText(/category/i)).toBeInTheDocument();
      expect(screen.getByText(/component/i)).toBeInTheDocument();
    });

    it('shows edit heading for existing deficiency', async () => {
      const { default: DeficiencyDetailPage } = await import('../src/pages/mobile/DeficiencyDetailPage');
      render(wrap(<MemoryRouter initialEntries={['/m/deficiencies/d-001?inspection_id=i-001']}><Routes><Route path="/m/deficiencies/:localId" element={<DeficiencyDetailPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/edit deficiency/i)).toBeInTheDocument();
    });

    it('disables save button when category not selected', async () => {
      const { default: DeficiencyDetailPage } = await import('../src/pages/mobile/DeficiencyDetailPage');
      render(wrap(<MemoryRouter initialEntries={['/m/deficiencies/new?inspection_id=i-001']}><Routes><Route path="/m/deficiencies/:localId" element={<DeficiencyDetailPage />} /></Routes></MemoryRouter>));
      const saveBtn = await screen.findByRole('button', { name: /save deficiency/i });
      expect(saveBtn).toBeDisabled();
    });
  });

  describe('B6-T07 — DeficiencyPhotosPage', () => {
    it('shows photo manager with add button', async () => {
      const { default: DeficiencyPhotosPage } = await import('../src/pages/mobile/DeficiencyPhotosPage');
      render(wrap(<MemoryRouter initialEntries={['/m/deficiencies/d-001/photos']}><Routes><Route path="/m/deficiencies/:localId/photos" element={<DeficiencyPhotosPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/photo manager|evidence/i)).toBeInTheDocument();
    });
  });

  describe('B6-T08 — InspectionSubmitPage', () => {
    it('shows pre-submit checklist and submit button', async () => {
      const { default: InspectionSubmitPage } = await import('../src/pages/mobile/InspectionSubmitPage');
      render(wrap(<MemoryRouter initialEntries={['/m/inspections/i-001/submit']}><Routes><Route path="/m/inspections/:id/submit" element={<InspectionSubmitPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/pre-submit checklist/i)).toBeInTheDocument();
      expect(screen.getAllByText(/submit inspection/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('B6-T05 — InspectionHistoryPage', () => {
    it('shows unresolved history for a structure', async () => {
      const { default: InspectionHistoryPage } = await import('../src/pages/mobile/InspectionHistoryPage');
      render(wrap(<MemoryRouter initialEntries={['/m/inspections/i-001/history']}><Routes><Route path="/m/inspections/:id/history" element={<InspectionHistoryPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/history|unresolved/i)).toBeInTheDocument();
    });
  });

});