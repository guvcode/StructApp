import {
  listProjects, getProjectById, createProject, updateProject,
  listSites, getSiteById, createSite, updateSite,
  listStructures, searchStructures, getStructureById, createStructure, updateStructure,
} from '../src/services/register';

jest.mock('../src/lib/db', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

const mockPool = require('../src/lib/db').pool;

describe('register service', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('projects', () => {
    test('listProjects returns all projects', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ project_id: 'p1', name: 'Project 1' }] });
      const projects = await listProjects();
      expect(projects).toHaveLength(1);
    });

    test('listProjects filters by client_id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await listProjects('c1');
      expect(mockPool.query.mock.calls[0][0]).toContain('WHERE client_id = $1');
    });

    test('getProjectById returns null when not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      expect(await getProjectById('x')).toBeNull();
    });

    test('getProjectById returns project', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ project_id: 'p1', name: 'Project' }] });
      expect(await getProjectById('p1')).not.toBeNull();
    });

    test('createProject inserts and returns project', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ project_id: 'p-new', client_id: 'c1', name: 'New', code: 'N', status: 'active', region: null, start_date: null, end_date: null, created_at: '2026-01-01' }] });
      const result = await createProject({ client_id: 'c1', name: 'New', code: 'N' });
      expect(result.project_id).toBe('p-new');
    });

    test('updateProject returns null when not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      expect(await updateProject('x', { name: 'X' })).toBeNull();
    });
  });

  describe('sites', () => {
    test('listSites returns all sites', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ site_id: 's1', name: 'Site 1' }] });
      expect(await listSites()).toHaveLength(1);
    });

    test('listSites filters by project_id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await listSites('p1');
      expect(mockPool.query.mock.calls[0][0]).toContain('WHERE project_id = $1');
    });

    test('getSiteById returns null when not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      expect(await getSiteById('x')).toBeNull();
    });

    test('createSite inserts and returns site', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ site_id: 's-new', name: 'New Site', project_id: 'p1', iana_timezone: 'UTC' }] });
      const result = await createSite({ project_id: 'p1', name: 'New Site' });
      expect(result.site_id).toBe('s-new');
    });

    test('updateSite returns null with no fields', async () => {
      expect(await updateSite('s1', {})).toBeNull();
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe('structures', () => {
    test('listStructures returns all structures', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ structure_id: 'str1', name: 'Structure 1' }] });
      expect(await listStructures()).toHaveLength(1);
    });

    test('listStructures filters by site_id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await listStructures('s1');
      expect(mockPool.query.mock.calls[0][0]).toContain('WHERE site_id = $1');
    });

    test('searchStructures uses ILIKE', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await searchStructures('bridge');
      expect(mockPool.query.mock.calls[0][1]).toEqual(['%bridge%']);
    });

    test('getStructureById returns null when not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      expect(await getStructureById('x')).toBeNull();
    });

    test('createStructure inserts and returns structure', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ structure_id: 'str-new', site_id: 's1', name: 'New', type: 'Bridge', identifier: 'B-001' }] });
      const result = await createStructure({ site_id: 's1', name: 'New', type: 'Bridge', identifier: 'B-001' });
      expect(result.structure_id).toBe('str-new');
    });

    test('updateStructure returns null with no fields', async () => {
      expect(await updateStructure('s1', {})).toBeNull();
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });
});