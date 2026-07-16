import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useConnectivity } from '../../src/hooks/useConnectivity';

let mockDeficienciesCount = 0;
let mockSubmissionsCount = 0;

vi.mock('../../src/lib/db', () => ({
  db: {
    authState: {
      get: vi.fn().mockResolvedValue({ accessToken: 'test-token', refreshToken: 'test-refresh' }),
      update: vi.fn(),
    },
    deficiencies: {
      where: () => ({
        equals: () => ({
          count: () => Promise.resolve(mockDeficienciesCount),
        }),
      }),
    },
    pinOutbox: {
      count: () => Promise.resolve(0),
    },
    offlineSubmissions: {
      where: () => ({
        equals: () => ({
          count: () => Promise.resolve(mockSubmissionsCount),
        }),
      }),
    },
  },
}));

const mockSyncWithAutoRefresh = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true, data: [] }));
vi.mock('../../src/lib/sync', () => ({
  syncWithAutoRefresh: mockSyncWithAutoRefresh,
}));

describe('useConnectivity hook', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
    mockDeficienciesCount = 0;
    mockSubmissionsCount = 0;
    mockSyncWithAutoRefresh.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  test('returns initial online state from navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    const { result } = renderHook(() => useConnectivity());
    expect(result.current.isOnline).toBe(true);
  });

  test('returns false for initial offline state', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    const { result } = renderHook(() => useConnectivity());
    expect(result.current.isOnline).toBe(false);
  });

  test('triggerSync triggers sync when online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    const { result } = renderHook(() => useConnectivity());

    await act(async () => {
      await result.current.triggerSync();
    });

    expect(mockSyncWithAutoRefresh).toHaveBeenCalledWith('test-token', 'test-refresh');
  });

  test('online event triggers sync after debounce when pending items exist', async () => {
    vi.useFakeTimers();
    mockDeficienciesCount = 1;

    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    renderHook(() => useConnectivity());

    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    window.dispatchEvent(new Event('online'));

    expect(mockSyncWithAutoRefresh).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSyncWithAutoRefresh).toHaveBeenCalledWith('test-token', 'test-refresh');

    vi.useRealTimers();
  });

  test('does not trigger sync on reconnection when no pending items', async () => {
    vi.useFakeTimers();

    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    renderHook(() => useConnectivity());

    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    window.dispatchEvent(new Event('online'));

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSyncWithAutoRefresh).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});