import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';

describe('Bundle 2 — Layouts', () => {

  it('AuthLayout renders header and footer', async () => {
    const { default: AuthLayout } = await import('../src/layouts/AuthLayout');
    render(
      <MemoryRouter>
        <AuthLayout />
      </MemoryRouter>
    );
    expect(screen.getByText(/structapp/i)).toBeInTheDocument();
  });

  it('MobileShell renders top bar and outlet', async () => {
    const { default: MobileShell } = await import('../src/layouts/MobileShell');
    render(
      <MemoryRouter>
        <MobileShell />
      </MemoryRouter>
    );
    expect(screen.getByText(/structapp/i)).toBeInTheDocument();
  });

  it('DesktopShell renders sidebar area and outlet', async () => {
    const { default: DesktopShell } = await import('../src/layouts/DesktopShell');
    render(
      <MemoryRouter>
        <DesktopShell />
      </MemoryRouter>
    );
    expect(screen.getByText(/structapp/i)).toBeInTheDocument();
  });
});