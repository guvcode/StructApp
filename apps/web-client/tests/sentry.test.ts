import { describe, it, expect } from 'vitest';
import { scrubPii } from '../src/lib/sentry';

describe('scrubPii', () => {
  it('redacts email addresses', () => {
    const event = {
      message: 'Contact user@example.com for details',
      exception: {
        values: [
          {
            value: 'Failed at user@example.com',
          },
        ],
      },
    };
    const scrubbed = scrubPii(event as any);
    expect(scrubbed.message).toBe('Contact [REDACTED] for details');
    expect((scrubbed.exception as any)?.values?.[0]?.value).toBe('Failed at [REDACTED]');
  });

  it('redacts E.164 phone numbers', () => {
    const event = {
      user: {
        phone: '+12025551234',
      },
    };
    const scrubbed = scrubPii(event as any);
    expect((scrubbed.user as any)?.phone).toBe('[REDACTED]');
  });

  it('redacts Bearer tokens and JWT-like strings', () => {
    const event = {
      request: {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      },
      extra: {
        token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      },
    };
    const scrubbed = scrubPii(event as any);
    expect((scrubbed.request as any)?.headers?.authorization).toBe('[REDACTED]');
    expect((scrubbed.extra as any)?.token).toBe('[REDACTED]');
  });

  it('redacts GPS coordinates', () => {
    const event = {
      contexts: {
        gps: {
          latitude: 40.71283,
          longitude: -74.00612,
        },
      },
    };
    const scrubbed = scrubPii(event as any);
    const gps = (scrubbed.contexts as any)?.gps;
    expect(gps.latitude).toBe('[REDACTED]');
    expect(gps.longitude).toBe('[REDACTED]');
  });

  it('redacts email in stack frames', () => {
    const event = {
      exception: {
        values: [
          {
            value: 'Error',
            stacktrace: {
              frames: [
                {
                  filename: '/home/user@example.com/project/file.ts',
                  function: 'myFunc',
                },
              ],
            },
          },
        ],
      },
    };
    const scrubbed = scrubPii(event as any);
    const frames = (scrubbed.exception as any)?.values?.[0]?.stacktrace?.frames;
    expect(frames?.[0]?.filename).toBe('/home/[REDACTED]/project/file.ts');
  });

  it('returns original event unchanged when no PII found', () => {
    const event = {
      message: 'Simple error',
      extra: {
        count: 42,
        flag: true,
      },
    };
    const scrubbed = scrubPii(event as any);
    expect(scrubbed.message).toBe('Simple error');
    expect((scrubbed.extra as any)?.count).toBe(42);
  });

  it('handles null and undefined gracefully', () => {
    const event = {
      message: null,
      user: undefined,
      extra: null,
    };
    const scrubbed = scrubPii(event as any);
    expect(scrubbed.message).toBeNull();
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.extra).toBeNull();
  });
});
