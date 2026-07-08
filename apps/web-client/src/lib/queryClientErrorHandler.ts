import { db } from './db';
import { clearSession } from './authStore';
import * as Sentry from '@sentry/react';
import toast from 'react-hot-toast';

const THROTTLE_MS = 10_000;
const throttledKeys = new Map<string, number>();

function isThrottled(key: string): boolean {
  const now = Date.now();
  const last = throttledKeys.get(key);
  if (last && now - last < THROTTLE_MS) return true;
  throttledKeys.set(key, now);
  return false;
}

function isBackgroundPoll(key: string): boolean {
  return key.startsWith('sync:') || key === '["sync","state"]';
}

export function handleQueryError(error: unknown, queryKey?: unknown): void {
  const status = (error as { status?: number })?.status;
  const errorCode = (error as { error_code?: string })?.error_code;
  const message =
    (error as { message?: string })?.message ||
    'An unexpected error occurred';

  const key = JSON.stringify(queryKey ?? '');

  if (isBackgroundPoll(key)) {
    return;
  }

  if (status === 401) {
    db.authState.clear();
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return;
  }

  if (status === 403) {
    if (isThrottled('403')) return;
    toast.error('You do not have permission to perform this action.');
    return;
  }

  if (isThrottled(key)) return;
  toast.error(errorCode ? `${errorCode}: ${message}` : message);
  Sentry.captureException(error, { tags: { queryKey: key } });
}
