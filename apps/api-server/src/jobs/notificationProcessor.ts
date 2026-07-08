import cron from 'node-cron';
import { logger } from '../lib/logger';
import { processPendingNotifications } from '../services/notificationQueue';

export function startNotificationProcessor(cronSchedule: string = '*/10 * * * * *'): void {
  cron.schedule(cronSchedule, async () => {
    try {
      const processed = await processPendingNotifications();
      if (processed > 0) {
        logger.info({ msg: 'notification_processor_run', processed });
      }
    } catch (error) {
      logger.error({ msg: 'notification_processor_error', error });
    }
  });
}