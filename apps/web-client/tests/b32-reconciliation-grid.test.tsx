// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole } from '../src/types/index';
import ReconciliationQueuePage from '../src/pages/reviewer/ReconciliationQueuePage';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>;
}

const mockPending = [
  {
    pending_structure_id: 'ps-001',
    asset_tag: 'A-001',
    description: 'Test steel beam',
    status: 'pending',
    created_at: '2025-01-15T10:00:00Z',
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
    site_id: 'site-1',
    client_id: 'c-1',
    contractor_id: 'u-1',
    local_id: 'LOCAL-1',
    qr_code_value: null,
    updated_at: '2025-01-15T10:00:00Z',
  },
];

const mockDeficiencies = [
  {
    pending_deficiency_id: 'pd-1',
    pending_structure_id: 'ps-001',
    category: 'Structural',
    equipment_type: 'Steel',
    component: 'Beam',
    sub_component: 'Flange',
    focus_area: 'North',
    deficiency_category: 'Corrosion',
    detailed_description: 'Surface rust on beam flange',
    consequence_severity: 3,
    likelihood: 'B',
    recommended_action: 'Repair within 12 months',
    most_affected_consequence: 'Structural integrity',
    gps_latitude: 51.5,
    gps_longitude: -0.12,
    local_id: 'pd-1-local',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  },
];

const mockPhotos = [
  {
    pending_photo_id: 'pp-1',
    pending_structure_id: 'ps-001',
    pending_deficiency_id: 'pd-1',
    filename: 'DSC_0001.jpg',
    storage_url: 'https://example.com/photo1.jpg',
    caption: 'Beam flange corrosion',
    display_order: 1,
    created_at: '2025-01-15T10:00:00Z',
    original_filename: 'DSC_0001.jpg',
    captured_at: '2025-01-15T09:30:00Z',
    camera_make: 'Canon',
    camera_model: 'EOS R5',
    raw_exif_payload: JSON.stringify({ GPSLatitude: 51.5, GPSLongitude: -0.12 }),
    gps_latitude: 51.5,
    gps_longitude: -0.12,
  },
  {
    pending_photo_id: 'pp-2',
    pending_structure_id: 'ps-001',
    pending_deficiency_id: null,
    filename: 'structure-wide.jpg',
    storage_url: 'https://example.com/struct.jpg',
    caption: 'Structure overview',
    display_order: 0,
    created_at: '2025-01-15T10:00:00Z',
    original_filename: 'structure-wide.jpg',
    captured_at: '2025-01-15T09:00:00Z',
    camera_make: undefined,
    camera_model: undefined,
    raw_exif_payload: undefined,
    gps_latitude: undefined,
    gps_longitude: undefined,
  },
];

beforeEach(() => {
  clearSession();
  localStorage.clear();
  const user: User = { id: 'u-1', email: 'r@test.com', display_name: 'Reviewer', role: UserRole.reviewer, is_active: true, client_memberships: [{ client_id: 'c-1', client_role: 'primary' }] };
  setSession({ token: 'mock-token', user, expires_at: new Date(Date.now() + 3600_000).toISOString(), active_client_id: 'c-1' } as AuthSession);
});

vi.mock('../src/hooks/usePendingStructures', () => ({
  usePendingStructuresForReview: () => ({
    data: mockPending,
    isLoading: false,
    isError: false,
  }),
  usePendingDeficiencies: () => ({
    data: mockDeficiencies,
    isLoading: false,
    isError: false,
  }),
  usePendingPhotos: () => ({
    data: mockPhotos,
    isLoading: false,
    isError: false,
  }),
  useApprovePendingStructure: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRejectPendingStructure: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('Bundle 32 — ReconciliationQueuePage image grid', () => {
  beforeEach(() => {
    testQueryClient.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders pending structures in left pane', async () => {
    render(wrap(
      <MemoryRouter initialEntries={['/pending-structures']}>
        <Routes>
          <Route path="/pending-structures" element={<ReconciliationQueuePage />} />
        </Routes>
      </MemoryRouter>
    ));

    expect(await screen.findByText(/reconciliation queue/i)).toBeTruthy();
  });

  it('shows approve and reject buttons', async () => {
    render(wrap(
      <MemoryRouter initialEntries={['/pending-structures']}>
        <Routes>
          <Route path="/pending-structures" element={<ReconciliationQueuePage />} />
        </Routes>
      </MemoryRouter>
    ));

    const item = await screen.findByText('A-001');
    fireEvent.click(item);

    expect(screen.getByRole('button', { name: /approve/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /reject/i })).toBeTruthy();
  });

  it('shows bundle details with deficiencies and photos', async () => {
    render(wrap(
      <MemoryRouter initialEntries={['/pending-structures']}>
        <Routes>
          <Route path="/pending-structures" element={<ReconciliationQueuePage />} />
        </Routes>
      </MemoryRouter>
    ));

    const item = await screen.findByText('A-001');
    fireEvent.click(item);

    const descriptions = screen.getAllByText(/Test steel beam/);
    expect(descriptions.length).toBeGreaterThan(0);
    expect(screen.getByText(/Surface rust on beam flange/)).toBeTruthy();
  });

  it('displays photo image grid on pending structure selection', async () => {
    render(wrap(
      <MemoryRouter initialEntries={['/pending-structures']}>
        <Routes>
          <Route path="/pending-structures" element={<ReconciliationQueuePage />} />
        </Routes>
      </MemoryRouter>
    ));

    const assetTag = await screen.findByText(/A-001/i);
    fireEvent.click(assetTag);

    const filenames = screen.getAllByText(/DSC_0001.jpg/);
    expect(filenames.length).toBeGreaterThan(0);
  });

  it('clicking a pending structure shows photo grid with metadata', async () => {
    render(wrap(
      <MemoryRouter initialEntries={['/pending-structures']}>
        <Routes>
          <Route path="/pending-structures" element={<ReconciliationQueuePage />} />
        </Routes>
      </MemoryRouter>
    ));

    const item = await screen.findByText('A-001');
    fireEvent.click(item);

    const filenames = screen.getAllByText(/DSC_0001.jpg/);
    expect(filenames.length).toBeGreaterThan(0);
    expect(screen.getByText(/Canon EOS R5/)).toBeTruthy();
  });
});
