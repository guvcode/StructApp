import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { pool } from './lib/db';
import { logger } from './lib/logger';
import pinoHttp from 'pino-http';
import { startScheduleGenerator } from './jobs/scheduleGenerator';
import { startNotificationProcessor } from './jobs/notificationProcessor';
import { requireAuth, requireRole, requireAdmin } from './middleware/auth';

import { usersRouter } from './routes/users';
import { clientsRouter } from './routes/clients';

import { registerRouter } from './routes/register';
import { schedulesRouter } from './routes/calendar';

import { inspectionsRouter } from './routes/inspections';
import { syncRouter } from './routes/sync';
import { deficienciesRouter } from './routes/deficiencies';
import { photosRouter } from './routes/photos';
import { picklistsRouter } from './routes/picklists';
import { taxonomyRouter } from './routes/taxonomy';
import { auditLogsRouter } from './routes/auditLogs';
import { jobErrorsRouter } from './routes/jobErrors';
import { clientErrorsRouter } from './routes/clientErrors';
import { notificationRouter } from './routes/notifications';
import { timesheetsRouter } from './routes/timesheets';
import { authRouter } from './routes/auth';
import { reportsRouter } from './routes/reports';
import { importsRouter } from './routes/imports';
import { remediationRouter } from './routes/remediation';
import { structureTemplatesRouter } from './routes/structureTemplates';
import { pendingStructuresRouter } from './routes/pendingStructures';
import { usersRouter as usersRouter2 } from './routes/users';
import { clientsRouter as clientsRouter2 } from './routes/clients';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(pinoHttp({
  logger,
  customProps: (req: express.Request, _res: express.Response) => ({
    userId: req.user?.sub ?? 'anonymous',
    path: req.path,
  }),
}));

app.use('/api/v1/inspections', requireAuth, requireRole('Admin', 'Reviewer', 'Contractor'), inspectionsRouter);
app.use('/api/v1/sync', requireAuth, requireRole('Admin', 'Contractor'), syncRouter);
app.use('/api/v1/deficiencies', requireAuth, requireRole('Admin', 'Reviewer', 'Contractor'), deficienciesRouter);
app.use('/api/v1/photos', requireAuth, requireRole('Contractor'), photosRouter);
app.use('/api/v1/audit-logs', requireAuth, requireRole('Admin'), auditLogsRouter);
app.use('/api/v1/job-errors', requireAuth, requireRole('Admin'), jobErrorsRouter);
app.use('/api/v1/client-errors', requireAuth, requireRole('Admin'), clientErrorsRouter);
app.use('/api/v1/timesheets', requireAuth, requireRole('Admin', 'Reviewer', 'Contractor'), timesheetsRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/notifications', requireAuth, requireRole('Admin', 'Reviewer'), notificationRouter);
app.use('/api/v1/reports', requireAuth, requireRole('Admin', 'Reviewer'), reportsRouter);
app.use('/api/v1/imports', requireAuth, requireRole('Admin'), importsRouter);
app.use('/api/v1/users', requireAuth, usersRouter);
app.use('/api/v1/clients', requireAuth, clientsRouter);
app.use('/api/v1/schedules', requireAuth, requireRole('Admin', 'Contractor'), schedulesRouter);
app.use('/api/v1/remediation/deficiencies', requireAuth, requireRole('Admin', 'Reviewer', 'Contractor'), remediationRouter);
app.use('/api/v1', requireAuth, taxonomyRouter);
app.use('/api/v1', requireAuth, requireRole('Admin', 'Reviewer', 'Contractor'), registerRouter);
app.use('/api/v1', requireAuth, requireRole('Admin', 'Reviewer', 'Contractor'), picklistsRouter);
app.use('/api/v1', requireAuth, requireRole('Admin', 'Reviewer', 'Contractor'), structureTemplatesRouter);
app.use('/api/v1/pending-structures', requireAuth, pendingStructuresRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid request body', details: err.errors });
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ success: false, error_code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
});

startScheduleGenerator(pool);
startNotificationProcessor();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

export { inspectionsRouter } from './routes/inspections';
export { syncRouter } from './routes/sync';
export { deficienciesRouter } from './routes/deficiencies';
export { photosRouter } from './routes/photos';
export { picklistsRouter } from './routes/picklists';
export { taxonomyRouter } from './routes/taxonomy';
export { auditLogsRouter } from './routes/auditLogs';
export { jobErrorsRouter } from './routes/jobErrors';
export { clientErrorsRouter } from './routes/clientErrors';
export { timesheetsRouter } from './routes/timesheets';
export { authRouter } from './routes/auth';
export { reportsRouter } from './routes/reports';
export { importsRouter } from './routes/imports';
export { usersRouter };
export { clientsRouter };
export { registerRouter };
export { schedulesRouter };
export { pendingStructuresRouter };
