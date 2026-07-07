import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Bundle 1 — App Placeholder', () => {

  it('renders without crashing', async () => {
    const { default: App } = await import('../src/App');
    const { container } = render(App());
    expect(container).toBeDefined();
  });

  it('displays StructApp branding', async () => {
    const { default: App } = await import('../src/App');
    render(App());
    expect(screen.getByText(/StructApp/i)).toBeInTheDocument();
  });

  it('displays Bundle 1 ready indicator', async () => {
    const { default: App } = await import('../src/App');
    render(App());
    expect(screen.getByText(/bundle 1|foundation|v2/i)).toBeInTheDocument();
  });
});