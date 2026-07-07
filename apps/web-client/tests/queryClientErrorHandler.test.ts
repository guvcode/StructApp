import { describe, it, expect, vi } from 'vitest';

describe('queryClientErrorHandler', () => {
  it('clears auth state and redirects on 401', async () => {
    const { db } = await import('../src/lib/db');
    const spy = vi.spyOn(db.authState, 'clear').mockImplementation(() => {});

    let href = '';
    vi.stubGlobal('window', {
      location: {
        get href() {
          return href;
        },
        set href(value: string) {
          href = value;
        },
      },
    } as unknown as Window);

    const { handleQueryError } = await import('../src/lib/queryClientErrorHandler');
    handleQueryError({ status: 401 } as any);

    expect(spy).toHaveBeenCalled();
    expect(href).toBe('/login');
    spy.mockRestore();
  });

  it('clears auth state and redirects on 403', async () => {
    const { db } = await import('../src/lib/db');
    const spy = vi.spyOn(db.authState, 'clear').mockImplementation(() => {});

    let href = '';
    vi.stubGlobal('window', {
      location: {
        get href() {
          return href;
        },
        set href(value: string) {
          href = value;
        },
      },
    } as unknown as Window);

    const { handleQueryError } = await import('../src/lib/queryClientErrorHandler');
    handleQueryError({ status: 403 } as any);

    expect(spy).toHaveBeenCalled();
    expect(href).toBe('/login');
    spy.mockRestore();
  });

  it('does not clear auth state on non-auth errors', async () => {
    const { db } = await import('../src/lib/db');
    const spy = vi.spyOn(db.authState, 'clear').mockImplementation(() => {});

    const { handleQueryError } = await import('../src/lib/queryClientErrorHandler');
    handleQueryError(new Error('Network error'));

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
