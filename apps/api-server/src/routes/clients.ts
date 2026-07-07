import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { requireAuth, requireRole } from '../middleware/auth';
import * as clientService from '../services/clients';

const router = Router();

const clientCreateSchema = z.object({ name: z.string().min(1).max(200), safety_email: z.string().email().optional() });
const clientUpdateSchema = z.object({ name: z.string().min(1).max(200).optional(), safety_email: z.string().email().optional() });

router.get('/', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await clientService.listClients();
    const clients = rows.map(r => ({ id: r.client_id, name: r.name, created_at: r.created_at }));
    res.json({ success: true, data: clients });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await clientService.getClientById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Client not found' });
    res.json({ success: true, data: { id: row.client_id, name: row.name, created_at: row.created_at } });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = clientCreateSchema.parse(req.body);
    const row = await clientService.createClient(input.name, input.safety_email);
    logger.info('Client created', { clientId: row.client_id, name: row.name });
    res.status(201).json({ success: true, data: { id: row.client_id, name: row.name, created_at: row.created_at } });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = clientUpdateSchema.parse(req.body);
    const fields: Record<string, unknown> = {};
    if (input.name) fields.name = input.name;
    if (input.safety_email !== undefined) fields.safety_contact_email = input.safety_email;
    if (Object.keys(fields).length === 0) return res.status(400).json({ success: false, error_code: 'NO_FIELDS', message: 'No fields to update' });
    const row = await clientService.updateClient(req.params.id, fields);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Client not found' });
    res.json({ success: true, data: { id: row.client_id, name: row.name, created_at: row.created_at } });
  } catch (err) { next(err); }
});

router.get('/:id/projects', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await clientService.getClientProjects(req.params.id);
    const projects = rows.map(r => ({ id: r.project_id, client_id: r.client_id, title: r.title, type: r.type, due_date: r.due_date, created_at: r.created_at }));
    res.json({ success: true, data: projects });
  } catch (err) { next(err); }
});

export const clientsRouter = router;