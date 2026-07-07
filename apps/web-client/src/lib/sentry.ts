import * as Sentry from '@sentry/react';
import { type Event, type Exception, type StackFrame, type Breadcrumb } from '@sentry/types';

const PII_REGEXES = [
  { name: 'email', pattern: /[^\s/<>"']+@[^\s/<>"']+\.[^\s/<>"']+/g },
  { name: 'phone_e164', pattern: /\+[1-9]\d{1,14}/g },
  { name: 'jwt_bearer', pattern: /^Bearer\s+\S+/gi },
  { name: 'jwt_eyj', pattern: /eyJ[A-Za-z0-9_.-]+/g },
  { name: 'gps', pattern: /-?\d{1,3}\.\d{4,}/g },
] as const;

function scrubString(value: string): string {
  let result = value;
  for (const { pattern } of PII_REGEXES) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

function scrubValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return scrubString(value);
  }

  if (typeof value === 'number') {
    if (/-?\d{1,3}\.\d{4,}/.test(String(value))) {
      return '[REDACTED]';
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }

  if (value !== null && typeof value === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      scrubbed[key] = scrubValue(val);
    }
    return scrubbed;
  }

  return value;
}

function scrubStackFrame(frame: StackFrame): StackFrame {
  return {
    ...frame,
    filename: scrubValue(frame.filename) as string | undefined,
    function: scrubValue(frame.function) as string | undefined,
    module: scrubValue(frame.module) as string | undefined,
  } as StackFrame;
}

function scrubException(exception: Exception): Exception {
  const stacktrace = exception.stacktrace
    ? {
        ...exception.stacktrace,
        frames: exception.stacktrace.frames?.map(scrubStackFrame),
      }
    : undefined;
  const result = {
    ...exception,
    value: exception.value as string,
    stacktrace: stacktrace,
  };
  if (exception.value) result.value = scrubValue(exception.value) as string;
  if (stacktrace) result.stacktrace = stacktrace;
  return result as Exception;
}

export function scrubPii(event: Event): Event {
  const result: Record<string, unknown> = {
    ...event,
    message: event.message as string,
    exception: event.exception?.values
      ? { values: event.exception.values.map(scrubException) }
      : undefined,
    request: event.request != null ? scrubValue(event.request) : event.request,
    user: event.user != null ? scrubValue(event.user) : event.user,
    breadcrumbs: event.breadcrumbs?.map((breadcrumb: Breadcrumb) => ({
      ...breadcrumb,
      message: breadcrumb.message ? scrubValue(breadcrumb.message) as string : undefined,
      data: breadcrumb.data != null ? scrubValue(breadcrumb.data) : breadcrumb.data,
    })) as Breadcrumb[] | undefined,
    contexts: event.contexts != null ? scrubValue(event.contexts) : event.contexts,
    extra: event.extra != null ? scrubValue(event.extra) : event.extra,
    tags: event.tags != null ? scrubValue(event.tags) : event.tags,
  };
  if (event.message) result.message = scrubValue(event.message) as string;
  return result as unknown as Event;
}

export function initSentry(): void {
  const beforeSend: (event: Event | null) => Event | null = (event) => {
    if (!event) return null;
    return scrubPii(event);
  };
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    integrations: [],
    beforeSend: beforeSend as unknown as Exclude<NonNullable<Parameters<typeof Sentry.init>[0]>['beforeSend'], undefined>,
  });
}
