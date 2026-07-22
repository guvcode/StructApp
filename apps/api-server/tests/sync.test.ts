import { processSyncPush } from '../src/services/sync';
import { calculatePriorityTier } from '../src/utils/riskCalculator';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../src/services/cloudinary', () => ({
  uploadToCloudinary: jest.fn(),
}));

jest.mock('../src/services/notifications', () => ({
  notifyP1Deficiency: jest.fn(),
  resendAdapter: {},
  messagebirdAdapter: {},
}));

const mockPool = require('../src/lib/db').pool;

function makeMockClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  };
}

describe('processSyncPush', () => {
  const defaultInput = {
    deficiencies: [
      {
        client_local_id: 'local-1',
        inspection_id: '00000000-0000-0000-0000-000000000001',
        structure_id: '00000000-0000-0000-0000-000000000002',
        previous_deficiency_id: null,
        component_type_id: '00000000-0000-0000-0000-000000000003',
        component_notes: 'Test component',
        description: 'Crack found in support beam requiring remediation',
        severity: 3,
        probability: 2,
        consequences: 4,
        gps_latitude: null,
        gps_longitude: null,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('accepts deficiency with null GPS in onsite mode', async () => {
    const mockClient = makeMockClient();

    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // set_config app.current_client_id
      .mockResolvedValueOnce({}) // set_config bypass_tenant_check
      .mockResolvedValueOnce({
        rows: [{ inspection_mode: 'onsite' }],
        rowCount: 1,
      }) // SELECT inspection_mode
      .mockResolvedValueOnce({
        rows: [{ deficiency_id: 'def-001', calculated_priority: 'P3' }],
      }); // INSERT deficiency

    const result = await processSyncPush('client-123', 'user-123', defaultInput);

    expect(result.errors).toHaveLength(0);
    expect(result.synced_deficiencies).toHaveLength(1);
    expect(result.synced_deficiencies[0]!.local_id).toBe('local-1');
  });

  test('accepts deficiency with null GPS in post_inspection mode', async () => {
    const mockClient = makeMockClient();

    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // set_config app.current_client_id
      .mockResolvedValueOnce({}) // set_config bypass_tenant_check
      .mockResolvedValueOnce({
        rows: [{ inspection_mode: 'post_inspection' }],
        rowCount: 1,
      }) // SELECT inspection_mode
      .mockResolvedValueOnce({
        rows: [{ deficiency_id: 'def-002', calculated_priority: 'P3' }],
      }); // INSERT deficiency

    const result = await processSyncPush('client-123', 'user-123', defaultInput);

    expect(result.errors).toHaveLength(0);
    expect(result.synced_deficiencies).toHaveLength(1);
  });

  test('rejects deficiency when inspection is not found', async () => {
    const mockClient = makeMockClient();

    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // set_config app.current_client_id
      .mockResolvedValueOnce({}) // set_config bypass_tenant_check
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      }); // SELECT inspection_mode — not found

    const result = await processSyncPush('client-123', 'user-123', defaultInput);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toContain('Inspection not found');
    expect(result.synced_deficiencies).toHaveLength(0);
  });

  test('accepts onsite mode deficiencies with valid GPS coordinates', async () => {
    const mockClient = makeMockClient();
    const inputWithGps = {
      deficiencies: [{
        client_local_id: 'local-3',
        inspection_id: '00000000-0000-0000-0000-000000000001',
        structure_id: '00000000-0000-0000-0000-000000000002',
        previous_deficiency_id: null,
        component_type_id: '00000000-0000-0000-0000-000000000003',
        component_notes: 'Test component',
        description: 'Crack found in support beam requiring remediation',
        severity: 3,
        probability: 2,
        consequences: 4,
        gps_latitude: 40.7128,
        gps_longitude: -74.006,
      }],
    };

    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // set_config app.current_client_id
      .mockResolvedValueOnce({}) // set_config bypass_tenant_check
      .mockResolvedValueOnce({
        rows: [{ inspection_mode: 'onsite' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ deficiency_id: 'def-003', calculated_priority: 'P3' }],
      });

    const result = await processSyncPush('client-123', 'user-123', inputWithGps);

    expect(result.errors).toHaveLength(0);
    expect(result.synced_deficiencies).toHaveLength(1);
  });
});

describe('processSyncPull', () => {
  it('returns taxonomy in pull response', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // set_config 1
        .mockResolvedValueOnce({}) // set_config 2
        .mockResolvedValueOnce({ rows: [] }) // structures
        .mockResolvedValueOnce({ rows: [] }) // sites
        .mockResolvedValueOnce({ rows: [] }) // projects
        .mockResolvedValueOnce({ rows: [] }) // component_types
        .mockResolvedValueOnce({ rows: [] }) // work_types
        .mockResolvedValueOnce({ rows: [{ node_id: 'n1', level: 'category', label: 'Roofing' }] }) // taxonomy
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);

    const { processSyncPull } = require('../src/services/sync');
    const result = await processSyncPull('client-1', {});

    expect(result.taxonomy).toHaveLength(1);
    expect(result.taxonomy[0].label).toBe('Roofing');
  });
});