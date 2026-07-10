import { logger } from '../lib/logger';
import { pool } from '../lib/db';

export interface NotificationProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSms(to: string, body: string): Promise<void>;
}

export const resendAdapter: NotificationProvider = {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@structapp.com',
      to,
      subject,
      text: body,
    });
    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }
  },

  async sendSms(_to: string, _body: string): Promise<void> {
    // Resend does not handle SMS - use MessageBird
  },
};

export const messagebirdAdapter: NotificationProvider = {
  async sendEmail(_to: string, _subject: string, _body: string): Promise<void> {
    // MessageBird does not handle email - use Resend
  },

  async sendSms(to: string, body: string): Promise<void> {
    const messagebird = await import('messagebird');
    const mb = messagebird.default as unknown as { messages: { create(params: unknown, callback?: unknown): void } };
    await mb.messages.create({
      originator: process.env.MESSAGEBIRD_ORIGINATOR || 'StructApp',
      recipients: [to],
      body,
    });
  },
};

export async function notifyP1Deficiency(
  emailProvider: NotificationProvider,
  smsProvider: NotificationProvider,
  deficiency: { component: string },
  client: { safety_contact_email: string },
  reviewer: { phone_number?: string },
): Promise<void> {
  try {
    await emailProvider.sendEmail(
      client.safety_contact_email,
      'Critical (P1) Structural Deficiency Logged',
      `A P1 deficiency was logged on asset ${deficiency.component}. Review required immediately.`,
    );

    if (reviewer.phone_number) {
      await smsProvider.sendSms(reviewer.phone_number, 'P1 deficiency logged — review required.');
    }
  } catch (err) {
    logger.error({ error: err as Error }, 'P1 notification failed');
    throw err;
  }
}

export async function notifyInspectionAssigned(
  provider: NotificationProvider,
  inspector: { email: string },
  structure: { asset_tag: string },
): Promise<void> {
  try {
    await provider.sendEmail(
      inspector.email,
      'Inspection Assigned',
      `A new inspection has been assigned for asset ${structure.asset_tag}.`,
    );
  } catch (err) {
    logger.error({ error: err as Error }, 'Inspection assigned notification failed');
    throw err;
  }
}

export async function notifyInspectionSubmitted(
  provider: NotificationProvider,
  reviewers: Array<{ email: string }>,
  _clientId: string,
): Promise<void> {
  try {
    for (const reviewer of reviewers) {
      await provider.sendEmail(
        reviewer.email,
        'Inspection Submitted',
        'An inspection has been submitted and requires review.',
      );
    }
  } catch (err) {
    logger.error({ error: err as Error }, 'Inspection submitted notification failed');
    throw err;
  }
}

export async function notifyInspectionReturned(
  provider: NotificationProvider,
  inspectorId: string,
  payload: { inspectionId: string; returnedReason: string },
): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT email FROM users WHERE user_id = $1',
      [inspectorId],
    );

    const email = result.rows[0]?.email;
    if (!email) {
      logger.warn({ inspectorId }, 'No email found for inspector');
      return;
    }

    await provider.sendEmail(
      email,
      'Inspection Returned',
      `Your inspection has been returned. Reason: ${payload.returnedReason}`,
    );
  } catch (err) {
    logger.error({ error: err as Error }, 'Inspection returned notification failed');
    throw err;
  }
}

export async function notifyInspectionReassigned(
  provider: NotificationProvider,
  oldInspectorId: string,
  payload: { structureId: string; scheduledDate: string; reason: string },
): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT email FROM users WHERE user_id = $1',
      [oldInspectorId],
    );

    const email = result.rows[0]?.email;
    if (!email) {
      logger.warn({ inspectorId: oldInspectorId }, 'No email found for inspector');
      return;
    }

    await provider.sendEmail(
      email,
      'Inspection Reassigned',
      `An inspection for structure ${payload.structureId} (scheduled ${payload.scheduledDate}) has been reassigned. Reason: ${payload.reason}`,
    );
  } catch (err) {
    logger.error({ error: err as Error }, 'Inspection reassigned notification failed');
    throw err;
  }
}

export async function notifyBulkReassignSummary(
  provider: NotificationProvider,
  sourceInspectorId: string,
  targetInspectorId: string,
  reassignedCount: number,
): Promise<void> {
  try {
    const sourceResult = await pool.query(
      'SELECT email FROM users WHERE user_id = $1',
      [sourceInspectorId],
    );

    const targetResult = await pool.query(
      'SELECT email FROM users WHERE user_id = $1',
      [targetInspectorId],
    );

    const sourceEmail = sourceResult.rows[0]?.email;
    const targetEmail = targetResult.rows[0]?.email;

    if (!sourceEmail) {
      logger.warn({ inspectorId: sourceInspectorId }, 'No email found for source inspector');
    } else {
      await provider.sendEmail(
        sourceEmail,
        'Inspections Reassigned',
        `${reassignedCount} inspections you were assigned have been reassigned to another inspector.`,
      );
    }

    if (!targetEmail) {
      logger.warn({ inspectorId: targetInspectorId }, 'No email found for target inspector');
    } else {
      await provider.sendEmail(
        targetEmail,
        'New Inspections Assigned',
        `You have been assigned ${reassignedCount} new inspections.`,
      );
    }
  } catch (err) {
    logger.error({ error: err as Error }, 'Bulk reassign summary notification failed');
    throw err;
  }
}