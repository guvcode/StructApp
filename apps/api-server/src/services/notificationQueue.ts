import { pool } from '../lib/db';
import { logger } from '../lib/logger';
import { resendAdapter, messagebirdAdapter } from './notifications';

export type NotificationType =
  | 'inspection_assigned'
  | 'inspection_submitted'
  | 'inspection_returned'
  | 'inspection_reassigned'
  | 'bulk_reassign_summary'
  | 'p1_deficiency';

const MAX_RETRIES = 3;

export async function enqueueNotification(
  notificationType: NotificationType,
  payload: Record<string, unknown>,
): Promise<void> {
  await pool.query(
    `INSERT INTO notification_queue (notification_type, payload)
     VALUES ($1, $2)`,
    [notificationType, JSON.stringify(payload)],
  );
}

type QueueRow = {
  id: number;
  notification_type: string;
  payload: Record<string, unknown>;
  retry_count: number;
};

export async function processPendingNotifications(): Promise<number> {
  const { rows } = await pool.query<QueueRow>(
    `SELECT id, notification_type, payload, retry_count
     FROM notification_queue
     WHERE status = 'pending'
     ORDER BY id ASC
     LIMIT 50`,
  );

  let processed = 0;

  for (const row of rows) {
    try {
      await dispatchNotification(row.notification_type as NotificationType, row.payload);
      await pool.query(
        `UPDATE notification_queue SET status = 'sent', sent_at = NOW() WHERE id = $1`,
        [row.id],
      );
      processed++;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const newRetryCount = row.retry_count + 1;
      logger.warn(
        { notificationId: row.id, type: row.notification_type, retry: newRetryCount, error: errorMessage },
        'Notification dispatch failed',
      );

      if (newRetryCount >= MAX_RETRIES) {
        await pool.query(
          `UPDATE notification_queue SET status = 'failed', retry_count = $1, last_error = $2 WHERE id = $3`,
          [newRetryCount, errorMessage, row.id],
        );
      } else {
        await pool.query(
          `UPDATE notification_queue SET retry_count = $1, last_error = $2, updated_at = NOW() WHERE id = $3`,
          [newRetryCount, errorMessage, row.id],
        );
      }
      processed++;
    }
  }

  return processed;
}

async function dispatchNotification(
  notificationType: NotificationType,
  payload: Record<string, unknown>,
): Promise<void> {
  switch (notificationType) {
    case 'inspection_assigned':
      await resendAdapter.sendEmail(
        payload.inspector_email as string,
        'Inspection Assigned',
        `A new inspection has been assigned for asset ${payload.asset_tag ?? payload.structure_id}.`,
      );
      break;

    case 'inspection_submitted': {
      const reviewerEmails = payload.reviewer_emails as string[];
      for (const email of reviewerEmails) {
        await resendAdapter.sendEmail(
          email,
          'Inspection Submitted',
          'An inspection has been submitted and requires review.',
        );
      }
      break;
    }

    case 'inspection_returned':
      await resendAdapter.sendEmail(
        payload.inspector_email as string,
        'Inspection Returned',
        `Your inspection has been returned. Reason: ${payload.returned_reason}`,
      );
      break;

    case 'inspection_reassigned':
      await resendAdapter.sendEmail(
        payload.old_inspector_email as string,
        'Inspection Reassigned',
        `An inspection for structure ${payload.structure_id} (scheduled ${payload.scheduled_date}) has been reassigned. Reason: ${payload.reason}`,
      );
      break;

    case 'bulk_reassign_summary':
      if (payload.source_email) {
        await resendAdapter.sendEmail(
          payload.source_email as string,
          'Inspections Reassigned',
          `${payload.reassigned_count} inspections you were assigned have been reassigned to another inspector.`,
        );
      }
      if (payload.target_email) {
        await resendAdapter.sendEmail(
          payload.target_email as string,
          'New Inspections Assigned',
          `You have been assigned ${payload.reassigned_count} new inspections.`,
        );
      }
      break;

    case 'p1_deficiency':
      if (payload.client_email) {
        await resendAdapter.sendEmail(
          payload.client_email as string,
          'Critical (P1) Structural Deficiency Logged',
          `A P1 deficiency was logged on asset ${payload.component}. Review required immediately.`,
        );
      }
      if (payload.reviewer_phone) {
        await messagebirdAdapter.sendSms(
          payload.reviewer_phone as string,
          'P1 deficiency logged — review required.',
        );
      }
      break;

    default:
      logger.warn({ notificationType }, 'Unknown notification type');
  }
}