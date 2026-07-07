import { db } from './db';
import * as Sentry from '@sentry/react';
import toast from 'react-hot-toast';

export function handleQueryError(error: unknown): void {
  const status = (error as { status?: number })?.status;
  const message =
    (error as { message?: string })?.message ||
    'An unexpected error occurred';

  if (status === 401 || status === 403) {
    db.authState.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return;
  }

  toast.error(message);
  Sentry.captureException(error);
}
