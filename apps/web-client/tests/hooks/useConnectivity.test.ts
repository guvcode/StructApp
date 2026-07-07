import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useConnectivity } from '../../src/hooks/useConnectivity';

// Mock Dexie to avoid database initialization in test environment
vi.mock('../../src/lib/db', () => ({
  db: {
    authState: {
      get: vi.fn().mockResolvedValue({ accessToken: 'test-token', refreshToken: 'test-refresh' }),
      update: vi.fn(),
    },
    deficiencies: {
      where: () => ({
        equals: () => ({
          count: () => Promise.resolve(0),
        }),
      }),
    },
    pinOutbox: {
      count: () => Promise.resolve(0),
    },
  },
}));

// Mock sync to avoid actual API calls
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
});