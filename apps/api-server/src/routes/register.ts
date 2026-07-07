import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import * as registerService from '../services/register';

const router = Router();

const projectCreateSchema = z.object({
  client_id: z.string().uuid(), title: z.string().min(1).max(200), type: z.string().min(1).max(100), due_date: z.string(),
});

const projectUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(), type: z.string().min(1).max(100).optional(), due_date: z.string().optional(),
});

const siteCreateSchema = z.object({
  project_id: z.string().uuid(), name: z.string().min(1).max(200), iana_timezone: z.string().optional(),
});

const siteUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(), iana_timezone: z.string().optional(),
});

const structureCreateSchema = z.object({
  site_id: z.string().uuid(), asset_tag: z.string().min(1).max(100), description: z.string().min(1), qr_code_value: z.string().optional(),
});

const structureUpdateSchema = z.object({
  asset_tag: z.string().min(1).max(100).optional(), description: z.string().min(1).optional(), qr_code_value: z.string().optional(),
});

function mapProject(r: Record<string, unknown>) {
  return { id: r.project_id, client_id: r.client_id, title: r.title, type: r.type, due_date: r.due_date, created_at: r.created_at };
}

function mapSite(r: Record<string, unknown>) {
  return { id: r.site_id, project_id: r.project_id, client_id: r.client_id, name: r.name, iana_timezone: r.iana_timezone, created_at: r.created_at };
}

function mapStructure(r: Record<string, unknown>) {
  return { id: r.structure_id, site_id: r.site_id, client_id: r.client_id, asset_tag: r.asset_tag, description: r.description, qr_code_value: r.qr_code_value || undefined, created_at: r.created_at };
}

router.get('/projects', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await registerService.listProjects(req.query.client_id as string | undefined);
    res.json({ success: true, data: rows.map(mapProject) });
  } catch (err) { next(err); }
});

router.get('/projects/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await registerService.getProjectById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Project not found' });
    res.json({ success: true, data: mapProject(row) });
  } catch (err) { next(err); }
});

router.post('/projects', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = projectCreateSchema.parse(req.body);
    const row = await registerService.createProject(input);
    res.status(201).json({ success: true, data: mapProject(row) });
  } catch (err) { next(err); }
});

router.patch('/projects/:id', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = projectUpdateSchema.parse(req.body);
    const fields: Record<string, unknown> = {};
    if (input.title) fields.title = input.title;
    if (input.type) fields.type = input.type;
    if (input.due_date !== undefined) fields.due_date = input.due_date;
    if (Object.keys(fields).length === 0) return res.status(400).json({ success: false, error_code: 'NO_FIELDS', message: 'No fields to update' });
    const row = await registerService.updateProject(req.params.id, fields);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Project not found' });
    res.json({ success: true, data: mapProject(row) });
  } catch (err) { next(err); }
});

router.get('/sites', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await registerService.listSites(req.query.project_id as string | undefined);
    res.json({ success: true, data: rows.map(mapSite) });
  } catch (err) { next(err); }
});

router.get('/sites/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await registerService.getSiteById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Site not found' });
    res.json({ success: true, data: mapSite(row) });
  } catch (err) { next(err); }
});

router.post('/sites', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = siteCreateSchema.parse(req.body);
    const row = await registerService.createSite(input);
    res.status(201).json({ success: true, data: mapSite(row) });
  } catch (err) { next(err); }
});

router.patch('/sites/:id', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = siteUpdateSchema.parse(req.body);
    const fields: Record<string, unknown> = {};
    if (input.name) fields.name = input.name;
    if (input.iana_timezone !== undefined) fields.iana_timezone = input.iana_timezone;
    if (Object.keys(fields).length === 0) return res.status(400).json({ success: false, error_code: 'NO_FIELDS', message: 'No fields to update' });
    const row = await registerService.updateSite(req.params.id, fields);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Site not found' });
    res.json({ success: true, data: mapSite(row) });
  } catch (err) { next(err); }
});

router.get('/structures', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await registerService.listStructures(req.query.site_id as string | undefined);
    res.json({ success: true, data: rows.map(mapStructure) });
  } catch (err) { next(err); }
});

router.get('/structures/search', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ success: true, data: [] });
    const rows = await registerService.searchStructures(q);
    res.json({ success: true, data: rows.map(mapStructure) });
  } catch (err) { next(err); }
});

router.get('/structures/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = await registerService.getStructureById(req.params.id);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Structure not found' });
    res.json({ success: true, data: mapStructure(row) });
  } catch (err) { next(err); }
});

router.post('/structures', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = structureCreateSchema.parse(req.body);
    const row = await registerService.createStructure(input);
    res.status(201).json({ success: true, data: mapStructure(row) });
  } catch (err) { next(err); }
});

router.patch('/structures/:id', requireAuth, requireRole('Admin', 'Reviewer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = structureUpdateSchema.parse(req.body);
    const fields: Record<string, unknown> = {};
    if (input.asset_tag) fields.asset_tag = input.asset_tag;
    if (input.description) fields.description = input.description;
    if (input.qr_code_value !== undefined) fields.qr_code_value = input.qr_code_value;
    if (Object.keys(fields).length === 0) return res.status(400).json({ success: false, error_code: 'NO_FIELDS', message: 'No fields to update' });
    const row = await registerService.updateStructure(req.params.id, fields);
    if (!row) return res.status(404).json({ success: false, error_code: 'NOT_FOUND', message: 'Structure not found' });
    res.json({ success: true, data: mapStructure(row) });
  } catch (err) { next(err); }
});

export const registerRouter = router;