import { updateComponentNotes } from '../src/services/deficiencies';
import { softDeletePhoto } from '../src/services/photos';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

const mockPool = require('../src/lib/db').pool;

function makeMockClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  };
}

describe('EDT-417: updateComponentNotes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('updates component_notes on deficiency', async () => {
    const mockClient = makeMockClient();
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // set_config
      .mockResolvedValueOnce({}) // set_config
      .mockResolvedValueOnce({ rows: [{ deficiency_id: 'd-1' }], rowCount: 1 }) // SELECT
      .mockResolvedValueOnce({ rows: [{ deficiency_id: 'd-1' }] }); // UPDATE

    const result = await updateComponentNotes('d-1', 'client-1', 'Updated notes');
    expect(result.deficiency_id).toBe('d-1');
    expect(mockClient.query).toHaveBeenCalledTimes(6);
  });

  it('throws when deficiency not found', async () => {
    const mockClient = makeMockClient();
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(updateComponentNotes('d-missing', 'c-1', 'notes')).rejects.toThrow('DEFICIENCY_NOT_FOUND');
  });
});

describe('EDT-418: softDeletePhoto', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('sets deleted_at on photo', async () => {
    const mockClient = makeMockClient();
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // set_config
      .mockResolvedValueOnce({}) // set_config
      .mockResolvedValueOnce({ rows: [{ photo_id: 'p-1' }], rowCount: 1 }) // SELECT
      .mockResolvedValueOnce({ rows: [{ photo_id: 'p-1' }] }); // UPDATE

    const result = await softDeletePhoto('p-1', 'client-1');
    expect(result.photo_id).toBe('p-1');
    expect(mockClient.query.mock.calls[4][0]).toContain('SET deleted_at = NOW()');
  });

  it('throws when photo not found', async () => {
    const mockClient = makeMockClient();
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(softDeletePhoto('p-missing', 'c-1')).rejects.toThrow('PHOTO_NOT_FOUND');
  });
});