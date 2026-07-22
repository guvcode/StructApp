// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole } from '../src/types/index';
import PendingDeficiencyDetailPage from '../src/pages/mobile/PendingDeficiencyDetailPage';

const mockStructureTypes = [
  { structure_type_id: 'st-1', name: 'Steel' },
  { structure_type_id: 'st-2', name: 'Concrete' },
];

const mockTaxonomyNodes = [
  { node_id: 'cat-1', parent_id: null, level: 'category', category: 'Steel', label: 'Steel', display_order: 1, is_active: true },
  { node_id: 'et-1', parent_id: 'cat-1', level: 'equipment_type', category: 'Steel', label: 'Girder', display_order: 1, is_active: true },
  { node_id: 'comp-1', parent_id: 'et-1', level: 'component', category: 'Steel', label: 'Flange', display_order: 1, is_active: true },
  { node_id: 'sub-1', parent_id: 'comp-1', level: 'sub_component', category: 'Steel', label: 'Top Flange', display_order: 1, is_active: true },
  { node_id: 'fa-1', parent_id: 'sub-1', level: 'focus_area', category: 'Steel', label: 'North Face', display_order: 1, is_active: true },
  { node_id: 'dc-1', parent_id: 'fa-1', level: 'deficiency_category', category: 'Steel', label: 'Corrosion', display_order: 1, is_active: true },
  { node_id: 'dd-1', parent_id: 'dc-1', level: 'detailed_description', category: 'Steel', label: 'Surface rust', display_order: 1, is_active: true },
];

const offlineRecords: Array<Record<string, unknown>> = vi.hoisted(() => []);

const mockApiClient = vi.hoisted(() =>
  vi.fn().mockImplementation((url: string) => {
    if (url.includes('structure-types')) return Promise.resolve(mockStructureTypes);
    if (url.includes('taxonomy')) return Promise.resolve(mockTaxonomyNodes);
    if (url.includes('sites')) return Promise.resolve({ id: 'site-1', name: 'Test Site' });
    if (url.includes('templates')) return Promise.resolve({ templates: [{ taxonomy_node_id: 'cat-1' }], ancestors: { 'cat-1': [] } });
    return Promise.resolve({});
  })
);

const mockMutateAsync = vi.hoisted(() => vi.fn(mockApiClient));

vi.mock('../src/services/api/apiClient', () => ({
  apiClient: mockApiClient,
  ApiError: class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
}));

vi.mock('../src/hooks/usePendingStructures', () => ({
  usePendingStructure: () => ({
    data: { pending_structure_id: 'ps-001', asset_tag: 'A-001', description: 'Test structure', status: 'rejected', site_id: 'site-1' },
    isLoading: false,
    isError: false,
  }),
  useAddPendingDeficiency: () => ({
    mutateAsync: mockMutateAsync,
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../src/lib/db', () => ({
  db: {
    offlinePendingStructureDeficiencies: {
      clear: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockImplementation((record: Record<string, unknown>) => {
        offlineRecords.push(record);
        return Promise.resolve(offlineRecords.length);
      }),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(offlineRecords.filter(r => (r as any).syncState === 'Pending_Sync')),
        }),
      }),
    },
    offlinePendingStructurePhotos: {
      clear: vi.fn().mockResolvedValue(undefined),
    },
    offlineTaxonomy: {
      bulkPut: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  clearSession();
  localStorage.clear();
  offlineRecords.length = 0;
  mockApiClient.mockImplementation((url: string) => {
    if (url.includes('structure-types')) return Promise.resolve(mockStructureTypes);
    if (url.includes('taxonomy')) return Promise.resolve(mockTaxonomyNodes);
    if (url.includes('sites')) return Promise.resolve({ id: 'site-1', name: 'Test Site' });
    if (url.includes('templates')) return Promise.resolve({ templates: [{ taxonomy_node_id: 'cat-1' }], ancestors: { 'cat-1': [] } });
    return Promise.resolve({});
  });
});

describe('Bundle 7 — Pending Deficiency Offline Parity', () => {
  describe('B7-T01 — PendingDeficiencyDetailPage renders create form', () => {
    it('shows new deficiency heading and cascading taxonomy fields', async () => {
      render(wrap(
        <MemoryRouter initialEntries={['/m/pending-structures/ps-001/deficiencies/new']}>
          <Routes>
            <Route path="/m/pending-structures/:id/deficiencies/:localId" element={<PendingDeficiencyDetailPage />} />
          </Routes>
        </MemoryRouter>
      ));
      expect(await screen.findByText(/new deficiency/i)).toBeInTheDocument();
      expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument();
    });

    it('enables save button when category is selected', async () => {
      render(wrap(
        <MemoryRouter initialEntries={['/m/pending-structures/ps-001/deficiencies/new']}>
          <Routes>
            <Route path="/m/pending-structures/:id/deficiencies/:localId" element={<PendingDeficiencyDetailPage />} />
          </Routes>
        </MemoryRouter>
      ));
      const saveBtn = await screen.findByRole('button', { name: /save deficiency/i });
      expect(saveBtn).not.toBeDisabled();
    });
  });

  describe('B7-T02 — PendingDeficiencyDetailPage offline fallback', () => {
    it('writes to offlinePendingStructureDeficiencies when offline', async () => {
      mockApiClient.mockImplementation(() => Promise.reject(new Error('offline')));

      render(wrap(
        <MemoryRouter initialEntries={['/m/pending-structures/ps-001/deficiencies/new']}>
          <Routes>
            <Route path="/m/pending-structures/:id/deficiencies/:localId" element={<PendingDeficiencyDetailPage />} />
          </Routes>
        </MemoryRouter>
      ));

      const categorySelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(categorySelect, { target: { value: 'Steel' } });

      const saveBtn = await screen.findByRole('button', { name: /save deficiency/i });
      fireEvent.click(saveBtn);

      await waitFor(async () => {
        expect(offlineRecords.filter(r => (r as any).syncState === 'Pending_Sync').length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
