import { pool } from '../lib/db';

export interface AuditLogEntry {
  log_id: number;
  table_name: string;
  record_id: string;
  action: string;
  old_values: unknown;
  new_values: unknown;
  performed_by: string;
  timestamp: string;
}

export async function listAuditLogs(
  clientId: string,
  filters: {
    tableName?: string;
    recordId?: string;
    action?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
  },
  page: number = 1,
  pageSize: number = 50
): Promise<{ logs: AuditLogEntry[]; total: number; page: number; pageSize: number }> {
  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");

    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;

    if (filters.tableName) {
      conditions.push(`table_name = $${idx++}`);
      values.push(filters.tableName);
    }
    if (filters.recordId) {
      conditions.push(`record_id = $${idx++}`);
      values.push(filters.recordId);
    }
    if (filters.action) {
      conditions.push(`action = $${idx++}`);
      values.push(filters.action);
    }
    if (filters.performedBy) {
      conditions.push(`performed_by = $${idx++}`);
      values.push(filters.performedBy);
    }
    if (filters.startDate) {
      conditions.push(`timestamp >= $${idx++}`);
      values.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`timestamp <= $${idx++}`);
      values.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await client.query(
      `SELECT COUNT(*) FROM system_audit_logs ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const offset = (page - 1) * pageSize;
    const result = await client.query(
      `SELECT log_id, table_name, record_id, action, old_values, new_values, performed_by, timestamp
       FROM system_audit_logs
       ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, pageSize, offset]
    );

    return {
      logs: result.rows,
      total,
      page,
      pageSize,
    };
  } finally {
    client.release();
  }
}