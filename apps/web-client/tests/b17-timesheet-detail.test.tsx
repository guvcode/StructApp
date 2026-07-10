import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole } from '../src/types/index';

const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue({ entries: [] }));

vi.mock('../src/hooks/useTimesheets', () => ({
  useCreateTimesheetBatch: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useUpdateTimesheet: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubmitTimesheet: () => ({ mutate: vi.fn() }),
  useDeleteTimesheet: () => ({ mutate: vi.fn() }),
}));

vi.mock('../src/services/api/inspections', () => ({
  getInspections: () => Promise.resolve([
    { id: 'i-001', site_name: 'Test Site', status: 'Assigned', scheduled_date: '2026-07-10' },
  ]),
}));

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

describe('B17-T01 — TimesheetDetailPage cache invalidation', () => {

  it('calls useCreateTimesheetBatch.mutateAsync on save for cache invalidation', async () => {
    mockMutateAsync.mockClear();

    const { default: TimesheetDetailPage } = await import('../src/pages/mobile/TimesheetDetailPage');

    const { container } = render(wrap(
      <MemoryRouter initialEntries={['/m/timesheets/new']}>
        <Routes>
          <Route path="m/timesheets/:id" element={<TimesheetDetailPage />} />
          <Route path="m/timesheets" element={<div>Timesheet List Page</div>} />
        </Routes>
      </MemoryRouter>
    ));

    expect(await screen.findByText('New Timesheet Entry')).toBeInTheDocument();

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-07-10' } });

    const inspectionSelect = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(inspectionSelect, { target: { value: 'i-001' } });

    const entrySelects = container.querySelectorAll('select');
    const workTypeSelect = entrySelects[1] as HTMLSelectElement;
    fireEvent.change(workTypeSelect, { target: { value: 'Field Inspection' } });

    const hoursInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(hoursInput, { target: { value: '8' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });
});