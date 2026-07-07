import { pool } from '../src/lib/db';

jest.mock('../src/lib/db', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('picklists service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listComponentTypes', () => {
    it('returns active component types for a client', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // set_config 1
          .mockResolvedValueOnce({}) // set_config 2
          .mockResolvedValueOnce({ rows: [{ component_type_id: '1', name: 'Test', is_active: true }] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { listComponentTypes } = require('../src/services/picklists');
      const result = await listComponentTypes('client-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test');
    });
  });

  describe('createComponentType', () => {
    it('creates a new component type', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ component_type_id: 'new-id', name: 'New Type' }] })
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { createComponentType } = require('../src/services/picklists');
      const result = await createComponentType('client-1', 'New Type');
      expect(result.name).toBe('New Type');
    });
  });

  describe('updateComponentType', () => {
    it('throws NO_UPDATES_PROVIDED when no fields given', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { updateComponentType } = require('../src/services/picklists');
      await expect(updateComponentType('client-1', 'id-1', {})).rejects.toThrow('NO_UPDATES_PROVIDED');
    });
  });

  describe('listStructureTypes', () => {
    it('returns active structure types for a client', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // set_config 1
          .mockResolvedValueOnce({}) // set_config 2
          .mockResolvedValueOnce({ rows: [{ structure_type_id: '1', name: 'Bridge', is_active: true }] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { listStructureTypes } = require('../src/services/picklists');
      const result = await listStructureTypes('client-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bridge');
    });
  });

  describe('createStructureType', () => {
    it('creates a new structure type', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ structure_type_id: 'new-id', name: 'Tunnel' }] })
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { createStructureType } = require('../src/services/picklists');
      const result = await createStructureType('client-1', 'Tunnel');
      expect(result.name).toBe('Tunnel');
    });
  });

  describe('updateStructureType', () => {
    it('throws NO_UPDATES_PROVIDED when no fields given', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { updateStructureType } = require('../src/services/picklists');
      await expect(updateStructureType('client-1', 'id-1', {})).rejects.toThrow('NO_UPDATES_PROVIDED');
    });
  });
});