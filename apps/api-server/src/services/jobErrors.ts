import { pool } from '../lib/db';

export interface JobError {
  error_id: string;
  job_id: string | null;
  job_type: string;
  error_code: string;
  error_message: string;
  error_stack: string | null;
  attempt_count: number;
  last_attempted_at: string;
  input_payload: unknown;
  dismissed_at: string | null;
  dismissed_by: string | null;
}

export interface JobErrorFilters {
  jobType?: string;
  errorCode?: string;
  dismissed?: boolean;
  startDate?: string;
  endDate?: string;
}

export async function listJobErrors(
  _clientId: string,
  filters: JobErrorFilters = {},
  page: number = 1,
  pageSize: number = 50
): Promise<{ errors: JobError[]; total: number; page: number; pageSize: number }> {
  const client = await pool.connect();
  try {
    const conditions: string[] = [];
    const values: (string | number | boolean)[] = [];
    let idx = 1;

    if (filters.jobType) {
      conditions.push(`job_type = $${idx++}`);
      values.push(filters.jobType);
    }
    if (filters.errorCode) {
      conditions.push(`error_code = $${idx++}`);
      values.push(filters.errorCode);
    }
    if (filters.dismissed !== undefined) {
      if (filters.dismissed) {
        conditions.push(`dismissed_at IS NOT NULL`);
      } else {
        conditions.push(`dismissed_at IS NULL`);
      }
    }
    if (filters.startDate) {
      conditions.push(`last_attempted_at >= $${idx++}`);
      values.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`last_attempted_at <= $${idx++}`);
      values.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await client.query(
      `SELECT COUNT(*) FROM system_job_errors ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const offset = (page - 1) * pageSize;
    const result = await client.query(
      `SELECT error_id, job_id, job_type, error_code, error_message, error_stack,
              attempt_count, last_attempted_at, input_payload, dismissed_at, dismissed_by
       FROM system_job_errors
       ${whereClause}
       ORDER BY last_attempted_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, pageSize, offset]
    );

    return {
      errors: result.rows,
      total,
      page,
      pageSize,
    };
  } finally {
    client.release();
  }
}

function stripPii(text: string): string {
  return text
    .replace(/^Bearer\s+\S+/gi, '[REDACTED_TOKEN]')
    .replace(/[^@\s]+@[^@\s]+\.[^@\s]+/g, '[REDACTED_EMAIL]');
}

export async function recordClientError(
  payload: { error_message: string; error_stack?: string; error_code?: string },
  userSub?: string,
  ip?: string
): Promise<void> {
  const { checkRateLimit } = await import('../lib/rateLimiter');

  const userKey = userSub ? `user:${userSub}` : null;
  const ipKey = ip ? `ip:${ip}` : null;

  if (userKey && !checkRateLimit(userKey, 10)) {
    throw new Error('RATE_LIMITED');
  }
  if (ipKey && !checkRateLimit(ipKey, 100)) {
    throw new Error('RATE_LIMITED');
  }

  const client = await pool.connect();
  try {
    const errorStack = payload.error_stack ? stripPii(payload.error_stack) : null;
    const inputPayload = {
      error_message: payload.error_message,
      error_code: payload.error_code,
      userSub: userSub || null,
      ip: ip || null,
    };

    const trimmedStack = errorStack && errorStack.length > 8192
      ? errorStack.slice(0, 8192)
      : errorStack;

    await client.query(
      `INSERT INTO system_job_errors (job_type, error_code, error_message, error_stack, job_id, input_payload)
       VALUES ('pwa_client', $1, $2, $3, NULL, $4)`,
      [
        payload.error_code || 'UNKNOWN',
        payload.error_message,
        trimmedStack,
        JSON.stringify(inputPayload),
      ]
    );
  } finally {
    client.release();
  }
}
