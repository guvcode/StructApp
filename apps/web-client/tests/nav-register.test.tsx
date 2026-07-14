import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = (ui: React.ReactElement) => (
  <QueryClientProvider client={testQueryClient}>
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

beforeEach(() => {
  localStorage.clear();
});

function expandRegister() {
  const btn = screen.getByRole('button', { name: /(expand|collapse) register submenu/i });
  if (btn.getAttribute('aria-label')?.startsWith('Expand')) {
    fireEvent.click(btn);
  }
}

describe('Register Nav Sidebar', () => {
  it('no longer shows Component Types submenu item', async () => {
    const { default: DesktopSidebar } = await import('../src/components/DesktopSidebar');
    render(wrap(<DesktopSidebar role="reviewer" />));
    await expandRegister();
    expect(screen.queryByText(/component types/i)).not.toBeInTheDocument();
  });

  it('shows Work Types (Timesheet) instead of Work Types', async () => {
    const { default: DesktopSidebar } = await import('../src/components/DesktopSidebar');
    render(wrap(<DesktopSidebar role="reviewer" />));
    await expandRegister();
    expect(screen.getByText(/work types \(timesheet\)/i)).toBeInTheDocument();
    expect(screen.queryByText('Work Types')).not.toBeInTheDocument();
  });

  it('still shows Register with Projects, Sites, Structures', async () => {
    const { default: DesktopSidebar } = await import('../src/components/DesktopSidebar');
    render(wrap(<DesktopSidebar role="reviewer" />));
    await expandRegister();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Sites')).toBeInTheDocument();
    expect(screen.getByText('Structures')).toBeInTheDocument();
  });

  it('still shows Taxonomy under Register', async () => {
    const { default: DesktopSidebar } = await import('../src/components/DesktopSidebar');
    render(wrap(<DesktopSidebar role="reviewer" />));
    await expandRegister();
    expect(screen.getByText('Taxonomy')).toBeInTheDocument();
  });
});