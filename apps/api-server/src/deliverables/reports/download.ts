import { Request, Response } from 'express';
import { createReadStream, existsSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { logger } from '../../lib/logger';

const REPORT_DIR = join(tmpdir(), 'structapp-reports');

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};

export function getReportPath(jobId: string, ext: string): string {
  return join(REPORT_DIR, `${jobId}.${ext}`);
}

export function streamReport(req: Request, res: Response, jobId: string, ext: string): void {
  const filePath = getReportPath(jobId, ext);
  if (!existsSync(filePath)) {
    res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Report file not found' });
    return;
  }

  const mime = MIME_MAP[ext] ?? 'application/octet-stream';
  const filename = `report-${jobId}.${ext}`;

  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', statSync(filePath).size);

  const stream = createReadStream(filePath);
  stream.pipe(res);

  res.on('finish', () => {
    try { unlinkSync(filePath); } catch (err) {
      logger.warn({ err, jobId }, 'Failed to clean up report temp file');
    }
  });

  stream.on('error', (err) => {
    logger.error({ err, jobId }, 'Error streaming report file');
    if (!res.headersSent) {
      res.status(500).json({ success: false, error_code: 'STREAM_ERROR', message: 'Failed to stream report' });
    }
  });
}