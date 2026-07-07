import { z } from 'zod';
import { type Request, type Response, type NextFunction } from 'express';
import { pool } from '../lib/db';
import { parse } from 'csv-parse/sync';
import { logger } from '../lib/logger';

export const uploadBatchSchema = z.object({
  original_filename: z.string(),
  client_id: z.string().uuid(),
});

export type UploadBatchInput = z.infer<typeof uploadBatchSchema>;

export async function createImportBatch(clientId: string, uploadedBy: string, filename: string): Promise<string> {
  const result = await pool.query(
    `INSERT INTO import_batches (client_id, uploaded_by, original_filename, status)
     VALUES ($1, $2, $3, 'Pending')
     RETURNING batch_id`,
    [clientId, uploadedBy, filename],
  );
  return result.rows[0].batch_id;
}

export async function processCsvRows(
  batchId: string,
  csvContent: string,
): Promise<{ valid: number; invalid: number }> {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  let validCount = 0;
  let invalidCount = 0;

  for (const row of records) {
    const missing: string[] = [];
    if (!row.site_name) missing.push('site_name');
    if (!row.structure_asset_tag) missing.push('structure_asset_tag');
    if (!row.structure_description) missing.push('structure_description');
    if (!row.project_title) missing.push('project_title');

    if (missing.length > 0) {
      await pool.query(
        `INSERT INTO import_rows (batch_id, raw_row, validation_status, validation_errors)
         VALUES ($1, $2, 'Invalid', $3)`,
        [batchId, JSON.stringify(row), JSON.stringify({ missing_fields: missing })],
      );
      invalidCount++;
    } else {
      await pool.query(
        `INSERT INTO import_rows (batch_id, raw_row, validation_status)
         VALUES ($1, $2, 'Valid')`,
        [batchId, JSON.stringify(row)],
      );
      validCount++;
    }
  }

  return { valid: validCount, invalid: invalidCount };
}