import { pool } from '../src/lib/db';

jest.mock('../src/lib/db', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

describe('structure taxonomy templates service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplatesForStructureType', () => {
    it('returns templates for a given structure type', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // set_config 1
          .mockResolvedValueOnce({}) // set_config 2
          .mockResolvedValueOnce({
            rows: [
              { template_id: 'tpl-1', structure_type_id: 'st-1', taxonomy_node_id: 'node-1', created_at: '2025-01-01T00:00:00Z' },
              { template_id: 'tpl-2', structure_type_id: 'st-1', taxonomy_node_id: 'node-2', created_at: '2025-01-01T00:00:01Z' },
            ],
          }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { getTemplatesForStructureType } = require('../src/services/structureTemplates');
      const result = await getTemplatesForStructureType('client-1', 'st-1');
      expect(result).toHaveLength(2);
      expect(result[0].taxonomy_node_id).toBe('node-1');
      expect(result[1].taxonomy_node_id).toBe('node-2');
    });

    it('returns empty array when no templates exist', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // set_config 1
          .mockResolvedValueOnce({}) // set_config 2
          .mockResolvedValueOnce({ rows: [] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { getTemplatesForStructureType } = require('../src/services/structureTemplates');
      const result = await getTemplatesForStructureType('client-1', 'st-unknown');
      expect(result).toHaveLength(0);
    });
  });

  describe('getTemplateAncestors', () => {
    it('returns ancestor chain from node to root', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // set_config 1
          .mockResolvedValueOnce({}) // set_config 2
          .mockResolvedValueOnce({
            rows: [
              { node_id: 'root-cat', parent_id: null, level: 'category', label: 'Process Equipment', category: 'Process Equipment' },
              { node_id: 'comp-node', parent_id: 'root-cat', level: 'component', label: 'Lime Silo', category: 'Process Equipment' },
            ],
          }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const { getTemplateAncestors } = require('../src/services/structureTemplates');
      const result = await getTemplateAncestors('client-1', 'comp-node');
      expect(result).toHaveLength(2);
      expect(result[0].level).toBe('category');
      expect(result[1].level).toBe('component');
    });
  });
});