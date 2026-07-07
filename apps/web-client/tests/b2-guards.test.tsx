import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

describe('Bundle 2 — Guards', () => {

  it('ForbiddenPage renders access denied message', async () => {
    const { default: ForbiddenPage } = await import('../src/pages/ForbiddenPage');
    render(<MemoryRouter><ForbiddenPage /></MemoryRouter>);
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/access/i)).toBeInTheDocument();
  });

  it('NotFoundPage renders not found message', async () => {
    const { default: NotFoundPage } = await import('../src/pages/NotFoundPage');
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});