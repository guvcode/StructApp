import {
  submitPendingStructureBundle,
  addDeficiencyToPendingStructure,
  addPhotoToPendingDeficiency,
  getPendingStructuresForReview,
  getPendingStructureById,
  getPendingDeficienciesForBundle,
  getPendingPhotosForBundle,
  approvePendingStructureBundle,
  rejectPendingStructureBundle,
  getContractorPendingStructures,
  type PendingStructureRow,
  type PendingDeficiencyRow,
  type PendingPhotoRow,
} from '../src/services/pendingStructures';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../src/services/notificationQueue', () => ({
  enqueueNotification: jest.fn(),
}));

const mockPool = require('../src/lib/db').pool;

function makeMockClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  };
}

function resetMocks() {
  jest.clearAllMocks();
  mockPool.query.mockReset();
  mockPool.connect.mockReset();
}

const CLIENT_ID = '00000000-0000-0000-0000-000000000001';
const SITE_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000003';
const REVIEWER_ID = '00000000-0000-0000-0000-000000000004';
const PS_ID = '00000000-0000-0000-0000-000000000005';
const DEF_ID = '00000000-0000-0000-0000-000000000006';
const PHOTO_ID = '00000000-0000-0000-0000-000000000007';
const STRUCT_ID = '00000000-0000-0000-0000-000000000008';
const INSP_ID = '00000000-0000-0000-0000-000000000009';

describe('pendingStructures service', () => {
  beforeEach(() => { resetMocks(); });

  describe('submitPendingStructureBundle', () => {
    test('submits a valid pending structure', async () => {
      const mockClient = makeMockClient();

      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ client_id: CLIENT_ID }] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ site_id: SITE_ID }] })
        .mockResolvedValueOnce({ rows: [] });
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ pending_structure_id: PS_ID, local_id: 'local-1', status: 'pending' }] })
        .mockResolvedValueOnce({});

      const result = await submitPendingStructureBundle(USER_ID, {
        local_id: 'local-1',
        site_id: SITE_ID,
        client_id: CLIENT_ID,
        asset_tag: 'A-001',
        description: 'Discovered boiler',
      });

      expect(result.pending_structure_id).toBe(PS_ID);
      expect(result.local_id).toBe('local-1');
      expect(result.status).toBe('pending');
    });

    test('rejects when contractor is not a member of the client', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(
        submitPendingStructureBundle(USER_ID, {
          local_id: 'local-1',
          site_id: SITE_ID,
          client_id: CLIENT_ID,
          asset_tag: 'A-001',
          description: 'Discovered boiler',
        }),
      ).rejects.toThrow('NOT_A_MEMBER');
    });

    test('rejects when site does not exist in the client', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ client_id: CLIENT_ID }] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(
        submitPendingStructureBundle(USER_ID, {
          local_id: 'local-1',
          site_id: SITE_ID,
          client_id: CLIENT_ID,
          asset_tag: 'A-001',
          description: 'Discovered boiler',
        }),
      ).rejects.toThrow('SITE_NOT_FOUND');
    });
  });

  describe('addDeficiencyToPendingStructure', () => {
    test('adds a deficiency to a pending structure', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ pending_structure_id: PS_ID }] })
        .mockResolvedValueOnce({ rows: [{ pending_deficiency_id: DEF_ID, pending_structure_id: PS_ID, local_id: 'def-1', category: null, equipment_type: null, component: null, sub_component: null, focus_area: null, deficiency_category: null, detailed_description: 'Corrosion', consequence_severity: 3, likelihood: null, recommended_action: null, most_affected_consequence: null, gps_latitude: null, gps_longitude: null }] });

      const result = await addDeficiencyToPendingStructure(PS_ID, USER_ID, {
        local_id: 'def-1',
        detailed_description: 'Corrosion',
        consequence_severity: 3,
      });

      expect(result.pending_deficiency_id).toBe(DEF_ID);
      expect(result.detailed_description).toBe('Corrosion');
    });

    test('throws when pending structure is not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(
        addDeficiencyToPendingStructure(PS_ID, USER_ID, {
          local_id: 'def-1',
          detailed_description: 'Corrosion',
        }),
      ).rejects.toThrow('PENDING_STRUCTURE_NOT_FOUND');
    });
  });

  describe('addPhotoToPendingDeficiency', () => {
    test('adds a photo to a pending deficiency', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ pending_structure_id: PS_ID }] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ pending_deficiency_id: DEF_ID }] })
        .mockResolvedValueOnce({ rows: [{ pending_photo_id: PHOTO_ID, pending_structure_id: PS_ID, pending_deficiency_id: DEF_ID, filename: 'photo.jpg', storage_url: null, caption: '', display_order: 0 }] });

      const result = await addPhotoToPendingDeficiency(PS_ID, DEF_ID, USER_ID, {
        filename: 'photo.jpg',
        data: 'data:image/jpeg;base64,/9j/',
      });

      expect(result.pending_photo_id).toBe(PHOTO_ID);
      expect(result.filename).toBe('photo.jpg');
    });

    test('throws when pending deficiency is not found', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ pending_structure_id: PS_ID }] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(
        addPhotoToPendingDeficiency(PS_ID, DEF_ID, USER_ID, {
          filename: 'photo.jpg',
          data: 'data:image/jpeg;base64,/9j/',
        }),
      ).rejects.toThrow('PENDING_DEFICIENCY_NOT_FOUND');
    });
  });

  describe('getPendingStructuresForReview', () => {
    test('returns pending bundles filtered by client', async () => {
      const mockRows: PendingStructureRow[] = [
        {
          pending_structure_id: PS_ID,
          local_id: 'local-1',
          site_id: SITE_ID,
          client_id: CLIENT_ID,
          contractor_id: USER_ID,
          asset_tag: 'A-001',
          description: 'Discovered',
          qr_code_value: null,
          status: 'pending',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: '2026-07-21T00:00:00Z',
          updated_at: '2026-07-21T00:00:00Z',
        },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await getPendingStructuresForReview(CLIENT_ID);
      expect(result).toHaveLength(1);
      expect(result[0]!.asset_tag).toBe('A-001');
      expect(mockPool.query.mock.calls[0][0]).toContain("status = 'pending'");
      expect(mockPool.query.mock.calls[0][0]).toContain('client_id = $1');
    });

    test('returns all pending bundles when no client filter', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await getPendingStructuresForReview();
      expect(result).toHaveLength(0);
      expect(mockPool.query.mock.calls[0][0]).not.toContain('WHERE client_id');
    });
  });

  describe('getPendingDeficienciesForBundle', () => {
    test('returns deficiencies for a bundle', async () => {
      const mockDefs: PendingDeficiencyRow[] = [
        {
          pending_deficiency_id: DEF_ID,
          pending_structure_id: PS_ID,
          local_id: 'def-1',
          category: 'Structural',
          equipment_type: null,
          component: 'Shell',
          sub_component: null,
          focus_area: null,
          deficiency_category: null,
          detailed_description: 'Corrosion',
          consequence_severity: 3,
          likelihood: 'C',
          recommended_action: null,
          most_affected_consequence: null,
          gps_latitude: null,
          gps_longitude: null,
        },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockDefs });

      const result = await getPendingDeficienciesForBundle(PS_ID);
      expect(result).toHaveLength(1);
      expect(result[0]!.component).toBe('Shell');
    });
  });

  describe('getPendingPhotosForBundle', () => {
    test('returns photos for a bundle', async () => {
      const mockPhotos: PendingPhotoRow[] = [
        {
          pending_photo_id: PHOTO_ID,
          pending_structure_id: PS_ID,
          pending_deficiency_id: DEF_ID,
          filename: 'photo.jpg',
          storage_url: 'https://cdn.example.com/photo.jpg',
          caption: 'Damage',
          display_order: 0,
        },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockPhotos });

      const result = await getPendingPhotosForBundle(PS_ID);
      expect(result).toHaveLength(1);
      expect(result[0]!.filename).toBe('photo.jpg');
    });
  });

  describe('approvePendingStructureBundle', () => {
    test('approves bundle and returns structure and inspection IDs', async () => {
      const mockClient = makeMockClient();
      const queryCalls: Array<{ sql: string; vals: unknown[] }> = [];
      mockClient.query.mockImplementation((sql: string, vals: unknown[]) => {
        queryCalls.push({ sql, vals });
        if (sql.includes('FOR UPDATE')) {
          return Promise.resolve({ rows: [{
            pending_structure_id: PS_ID,
            local_id: 'local-1',
            site_id: SITE_ID,
            client_id: CLIENT_ID,
            contractor_id: USER_ID,
            asset_tag: 'A-001',
            description: 'Discovered',
            qr_code_value: null,
            status: 'pending',
          }], rowCount: 1 });
        }
        if (sql.includes('INSERT INTO structures')) {
          return Promise.resolve({ rows: [{ structure_id: STRUCT_ID }] });
        }
        if (sql.includes('INSERT INTO inspections')) {
          return Promise.resolve({ rows: [{ inspection_id: INSP_ID }] });
        }
        if (sql.includes('pending_structure_deficiencies') && sql.includes('SELECT')) {
          return Promise.resolve({ rows: [] });
        }
        if (sql.includes('pending_structure_photos') && sql.includes('SELECT')) {
          return Promise.resolve({ rows: [] });
        }
        if (sql.includes('UPDATE pending_structures')) {
          return Promise.resolve({ rowCount: 1 });
        }
        if (sql.includes('UPDATE pending_structure_deficiencies') && sql.includes('updated_at')) {
          return Promise.resolve({ rowCount: 1 });
        }
        if (sql === 'COMMIT') {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      });

      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockPool.query.mockResolvedValueOnce({ rows: [{ email: 'contractor@test.com' }] });

      const result = await approvePendingStructureBundle(PS_ID, REVIEWER_ID, {
        name: 'Override Name',
        type: 'Vessel',
      });

      expect(result.structure_id).toBe(STRUCT_ID);
      expect(result.inspection_id).toBe(INSP_ID);
    });

    test('throws when pending structure is not in pending state', async () => {
      const mockClient = makeMockClient();
      mockClient.query.mockImplementation((sql: string) => {
        if (sql.includes('FOR UPDATE')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        return Promise.resolve({});
      });
      mockPool.connect.mockResolvedValueOnce(mockClient);

      await expect(
        approvePendingStructureBundle('ps-bad', REVIEWER_ID, {}),
      ).rejects.toThrow('PENDING_STRUCTURE_NOT_FOUND');
    });
  });

  describe('rejectPendingStructureBundle', () => {
    test('rejects bundle with reason', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ contractor_id: USER_ID, asset_tag: 'A-001' }] })
        .mockResolvedValueOnce({ rows: [{ email: 'contractor@test.com' }] });

      await expect(
        rejectPendingStructureBundle(PS_ID, REVIEWER_ID, 'Duplicate of existing structure'),
      ).resolves.toBeUndefined();
      expect(mockPool.query.mock.calls[0][1]).toEqual(['Duplicate of existing structure', REVIEWER_ID, PS_ID]);
    });

    test('throws when pending structure not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(
        rejectPendingStructureBundle('ps-bad', REVIEWER_ID, 'reason'),
      ).rejects.toThrow('PENDING_STRUCTURE_NOT_FOUND');
    });
  });

  describe('getContractorPendingStructures', () => {
    test('returns contractor pending structures', async () => {
      const mockRows: PendingStructureRow[] = [
        {
          pending_structure_id: PS_ID,
          local_id: 'local-1',
          site_id: SITE_ID,
          client_id: CLIENT_ID,
          contractor_id: USER_ID,
          asset_tag: 'A-001',
          description: 'Discovered',
          qr_code_value: null,
          status: 'pending',
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: '2026-07-21T00:00:00Z',
          updated_at: '2026-07-21T00:00:00Z',
        },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await getContractorPendingStructures(USER_ID, CLIENT_ID);
      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe('pending');
    });
  });
});
