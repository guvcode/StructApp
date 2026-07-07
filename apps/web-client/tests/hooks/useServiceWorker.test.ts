import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useServiceWorker } from '../../src/hooks/useServiceWorker';

// Mock navigator.serviceWorker
const mockRegister = vi.fn().mockResolvedValue({
  registering: Promise.resolve(),
  waiting: null,
  active: { postMessage: vi.fn() },
});

describe('useServiceWorker hook', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
        ready: Promise.resolve({}),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('registers service worker on mount', () => {
    renderHook(() => useServiceWorker());
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  test('is supported when serviceWorker in navigator', () => {
    const { result } = renderHook(() => useServiceWorker());
    expect(result.current.isSupported).toBe(true);
  });

  test('is not supported when serviceWorker not in navigator', () => {
    // Remove serviceWorker
    const original = navigator.serviceWorker;
    // @ts-expect-error - intentionally removing for test
    delete navigator.serviceWorker;
    
    const { result } = renderHook(() => useServiceWorker());
    expect(result.current.isSupported).toBe(false);
    
    // Restore
    Object.defineProperty(navigator, 'serviceWorker', {
      value: original,
      writable: true,
      configurable: true,
    });
  });
});