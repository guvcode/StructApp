import { updatePhoto } from '../src/services/photos';
import { pool } from '../src/lib/db';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('photos service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePhoto', () => {
    it('throws NO_UPDATES_PROVIDED when no updates provided', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}), // set_config
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(updatePhoto('photo-id', 'client-id', {})).rejects.toThrow('NO_UPDATES_PROVIDED');
    });

    it('throws PHOTO_NOT_FOUND for non-existent photo', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // UPDATE returns no rows
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(updatePhoto('non-existent', 'client-id', { caption: 'New caption' })).rejects.toThrow('PHOTO_NOT_FOUND');
    });

    it('updates photo purpose successfully', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ photo_id: 'photo-123' }], rowCount: 1 }) // UPDATE
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await updatePhoto('photo-123', 'client-id', { purpose: 'remediation_evidence' });
      expect(result.photo_id).toBe('photo-123');
    });
  });
});