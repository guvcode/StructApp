import { updateRemediationStatus, verifyClosure } from '../src/services/deficiencies';
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