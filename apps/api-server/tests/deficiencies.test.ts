import { createDeficiency, updateRemediationStatus, verifyClosure } from '../src/services/deficiencies';
import { pool } from '../src/lib/db';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('deficiencies service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDeficiency', () => {
    it('INSERT includes new schema columns (structure_id, created_by, priority_tier, location_desc)', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config 1
          .mockResolvedValueOnce({}) // set_config 2
          .mockResolvedValueOnce({ rows: [{ deficiency_id: 'new-id', description: 'test', calculated_priority: 'P3' }] }) // INSERT RETURNING *
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await createDeficiency('inspec-123', 'client-1', 'user-1', {
        description: 'Corrosion on beam',
        category: 'Structural',
        priority_tier: 'P2',
        location_desc: 'Grid B-4, Floor 3',
        risk_rank: 12,
        risk_rating: 'Medium',
      });

      const insertCall = mockClient.query.mock.calls[3];
      const insertSql = insertCall[0] as string;
      expect(insertSql).toContain('structure_id');
      expect(insertSql).toContain('created_by');
      expect(insertSql).toContain('priority_tier');
      expect(insertSql).toContain('location_desc');

      expect(result.deficiency_id).toBe('new-id');
    });

    it('inserts and returns a deficiency with full v4 taxonomy fields', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config 1
          .mockResolvedValueOnce({}) // set_config 2
          .mockResolvedValueOnce({
            rows: [{
              deficiency_id: 'def-456',
              inspection_id: 'inspec-123',
              description: 'test',
              category: 'Structural',
              priority_tier: 'P2',
              calculated_priority: 'P2',
            }],
          })
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await createDeficiency('inspec-123', 'client-1', 'user-1', {
        description: 'Crack in beam',
        category: 'Structural Support',
        sub_component: 'Steel Framing',
        priority_tier: 'P1',
        risk_rank: 20,
        risk_rating: 'High',
      });

      expect(result.description).toBe('test');
      expect(result.calculated_priority).toBe('P2');
    });
  });

  describe('updateRemediationStatus', () => {
    it('throws DEFICIENCY_NOT_FOUND for non-existent deficiency', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // SELECT returns no rows
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(updateRemediationStatus('non-existent', 'client-id', 'user-id', 'Remediation_Scheduled')).rejects.toThrow('DEFICIENCY_NOT_FOUND');
    });

    it('updates remediation status successfully', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ remediation_status: 'Open' }], rowCount: 1 }) // SELECT current
          .mockResolvedValueOnce({ rows: [{ deficiency_id: 'def-123', remediation_status: 'Remediation_Scheduled' }], rowCount: 1 }) // UPDATE
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await updateRemediationStatus('def-123', 'client-id', 'user-id', 'Remediation_Scheduled');
      expect(result.remediation_status).toBe('Remediation_Scheduled');
    });
  });

  describe('verifyClosure', () => {
    it('throws MISSING_REMEDIATION_EVIDENCE when no remediation photo attached', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // SELECT photos - no remediation evidence
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(verifyClosure('def-123', 'client-id', 'admin-id')).rejects.toThrow('MISSING_REMEDIATION_EVIDENCE');
    });

    it('throws DEFICIENCY_NOT_FOUND for non-existent deficiency', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ photo_id: 'photo-123' }], rowCount: 1 }) // has photo
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // UPDATE returns no rows
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(verifyClosure('non-existent', 'client-id', 'admin-id')).rejects.toThrow('DEFICIENCY_NOT_FOUND');
    });

    it('sets Verified_Closed successfully when remediation evidence exists', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ photo_id: 'photo-123' }], rowCount: 1 }) // has remediation photo
          .mockResolvedValueOnce({ rows: [{ deficiency_id: 'def-123', remediation_status: 'Verified_Closed' }], rowCount: 1 }) // UPDATE
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await verifyClosure('def-123', 'client-id', 'admin-id');
      expect(result.remediation_status).toBe('Verified_Closed');
    });
  });
});