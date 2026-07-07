import { pool } from '../src/lib/db';

jest.mock('../src/lib/db', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('taxonomy service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTaxonomy', () => {
    it('returns active taxonomy nodes for a client', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // set_config 1
          .mockResolvedValueOnce({}) // set_config 2
          .mockResolvedValueOnce({ rows: [{ node_id: '1', level: 'category', label: 'Roofing' }] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { listTaxonomy } = require('../src/services/taxonomy');
      const result = await listTaxonomy('client-1');
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Roofing');
    });
  });

  describe('createTaxonomyNode', () => {
    it('creates a new taxonomy node', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ node_id: 'new-id', label: 'Beam', level: 'component' }] })
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { createTaxonomyNode } = require('../src/services/taxonomy');
      const result = await createTaxonomyNode('client-1', {
        parent_id: null,
        level: 'category',
        category: 'Building Envelope',
        label: 'Roofing',
      });
      expect(result.label).toBe('Beam');
    });
  });

  describe('updateTaxonomyNode', () => {
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

      const { updateTaxonomyNode } = require('../src/services/taxonomy');
      await expect(updateTaxonomyNode('client-1', 'id-1', {})).rejects.toThrow('NO_UPDATES_PROVIDED');
    });

    it('updates label and is_active', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ node_id: 'id-1', label: 'Updated' }] })
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { updateTaxonomyNode } = require('../src/services/taxonomy');
      const result = await updateTaxonomyNode('client-1', 'id-1', { label: 'Updated', is_active: false });
      expect(result.label).toBe('Updated');
    });
  });
});