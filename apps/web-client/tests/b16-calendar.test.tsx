import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

beforeEach(async () => {
  const mod = await import('../src/services/mockCalendar');
  mod.mockSchedules.length = 0;
  mod.mockCalendarInspections.length = 0;
  mod.seedSchedules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Bundle 16 — Mock Calendar Service', () => {
  it('getSchedules returns all schedules', async () => {
    const mod = await import('../src/services/mockCalendar');
    const schedules = await mod.getSchedules();
    expect(schedules.length).toBeGreaterThan(0);
  });

  it('createSchedule adds a new schedule', async () => {
    const mod = await import('../src/services/mockCalendar');
    const created = await mod.createSchedule({ structure_id: 'str-test', inspector_id: 'u-marcus', interval_days: 30, next_due_date: '2026-08-01' });
    expect(created.structure_id).toBe('str-test');
    expect(created.is_active).toBe(true);
  });

  it('toggleSchedulePause flips is_active', async () => {
    const mod = await import('../src/services/mockCalendar');
    const all = await mod.getSchedules();
    const initialStatus = all[0].is_active;
    const updated = await mod.toggleSchedulePause(all[0].id);
    expect(updated.is_active).toBe(!initialStatus);
  });

  it('getCalendarInspections returns inspections for a month', async () => {
    const mod = await import('../src/services/mockCalendar');
    const now = new Date();
    const result = await mod.getCalendarInspections(now.getFullYear(), now.getMonth());
    expect(result.length).toBeGreaterThan(0);
  });

  it('getCalendarInspections filters by inspector', async () => {
    const mod = await import('../src/services/mockCalendar');
    const now = new Date();
    const result = await mod.getCalendarInspections(now.getFullYear(), now.getMonth(), 'inspector-1');
    result.forEach(ins => expect(ins.assigned_to).toBe('inspector-1'));
  });

  it('rescheduleInspection updates scheduled_date', async () => {
    const mod = await import('../src/services/mockCalendar');
    const now = new Date();
    const result = await mod.getCalendarInspections(now.getFullYear(), now.getMonth());
    expect(result.length).toBeGreaterThan(0);
    const updated = await mod.rescheduleInspection(result[0].id, '2026-08-15');
    expect(updated.scheduled_date).toBe('2026-08-15');
  });

  it('reassignInspection changes assigned_to', async () => {
    const mod = await import('../src/services/mockCalendar');
    const now = new Date();
    const result = await mod.getCalendarInspections(now.getFullYear(), now.getMonth());
    expect(result.length).toBeGreaterThan(0);
    const updated = await mod.reassignInspection(result[0].id, 'new-inspector');
    expect(updated.assigned_to).toBe('new-inspector');
  });
});

describe('Bundle 16 — Calendar Page', () => {
  async function renderPage() {
    const PageModule = await import('../src/pages/reviewer/CalendarPage');
    const Page = PageModule.default;
    return render(wrap(<Page />));
  }

  it('renders calendar with month name', async () => {
    await renderPage();
    await waitFor(() => {
      const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      expect(screen.getByText(monthName)).toBeInTheDocument();
    });
  });

  it('shows inspector filter', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getAllByText(/inspector/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows day detail modal on day click', async () => {
    await renderPage();
    await screen.findByText(/Eleanor/i);
    const dayBtns = await screen.findAllByRole('button');
    const dayOneBtn = dayBtns.find(btn => btn.textContent?.trim() === '1');
    expect(dayOneBtn).toBeTruthy();
    if (dayOneBtn) fireEvent.click(dayOneBtn);
    await waitFor(() => {
      expect(screen.getAllByText(/reschedule/i).length).toBeGreaterThan(0);
    });
  });
});

describe('Bundle 16 — Schedules Page', () => {
  async function renderPage() {
    const PageModule = await import('../src/pages/reviewer/CalendarSchedulesPage');
    const Page = PageModule.default;
    return render(wrap(<Page />));
  }

  it('renders schedules list with title', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText(/recurring schedules/i)).toBeInTheDocument();
    });
  });

  it('shows create schedule button', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create schedule/i })).toBeInTheDocument();
    });
  });

  it('shows schedule cards with status', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Paused').length).toBeGreaterThan(0);
  });
});