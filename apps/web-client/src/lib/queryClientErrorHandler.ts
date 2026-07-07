import { db } from './db';
import { clearSession } from './authStore';
import * as Sentry from '@sentry/react';
import toast from 'react-hot-toast';

export function handleQueryError(error: unknown): void {
  const status = (error as { status?: number })?.status;
  const message =
    (error as { message?: string })?.message ||
    'An unexpected error occurred';

  if (status === 401) {
    db.authState.clear();
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return;
  }

  if (status === 403) {
    toast.error('You do not have permission to perform this action.');
    return;
  }

  toast.error(message);
  Sentry.captureException(error);
}
