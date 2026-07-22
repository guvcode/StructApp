import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncResult, syncWithAutoRefresh, isTokenExpired } from '../src/lib/sync';

const mockDb = vi.hoisted(() => ({
  authState: {
    get: vi.fn(),
    update: vi.fn(),
  },
  deficiencies: {
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  offlineSubmissions: {
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  offlinePendingStructureDeficiencies: {
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  offlinePendingStructurePhotos: {
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('../src/lib/db', () => ({ db: mockDb }));

function createMockToken(expOffsetSeconds: number): string {
  const payload = { sub: 'user-123', exp: Math.floor(Date.now() / 1000) + expOffsetSeconds };
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('getPendingDeficiencies', () => {
  it('returns full deficiency payload including GPS fields for onsite mode', async () => {
    const mockRecord = {
      localId: 42,
      inspectionId: '1a2b3c4d-1234-5678-9abc-def012345678',
      structureId: 'f0000000-0000-0000-0000-000000000001',
      clientId: 'client-123',
      previousDeficiencyId: undefined,
      componentTypeId: 'b0000000-0000-0000-0000-000000000002',
      componentNotes: 'Test component',
      description: 'Crack found in support beam',
      severity: 3,
      probability: 2,
      consequences: 4,
      gpsLatitude: 40.7128,
      gpsLongitude: -74.006,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncState: 'Pending_Sync' as const,
    };

    const toArrayMock = vi.fn().mockResolvedValue([mockRecord]);
    const equalsMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
    mockDb.deficiencies.where.mockReturnValue({ equals: equalsMock });

    const { getPendingDeficiencies } = await import('../src/lib/sync');
    const result = await (getPendingDeficiencies as () => Promise<Array<Record<string, unknown>>>)();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      client_local_id: '42',
      inspection_id: '1a2b3c4d-1234-5678-9abc-def012345678',
      structure_id: 'f0000000-0000-0000-0000-000000000001',
      previous_deficiency_id: null,
      component_type_id: 'b0000000-0000-0000-0000-000000000002',
      description: 'Crack found in support beam',
      severity: 3,
      probability: 2,
      consequences: 4,
      gps_latitude: 40.7128,
      gps_longitude: -74.006,
    });
  });

  it('returns null GPS when coordinates are not set', async () => {
    const mockRecord = {
      localId: 99,
      inspectionId: '1a2b3c4d-1234-5678-9abc-def012345678',
      structureId: 'f0000000-0000-0000-0000-000000000001',
      clientId: 'client-123',
      previousDeficiencyId: undefined,
      componentTypeId: 'b0000000-0000-0000-0000-000000000002',
      componentNotes: '',
      description: 'Minor scratch',
      severity: 1,
      probability: 1,
      consequences: 1,
      gpsLatitude: undefined,
      gpsLongitude: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncState: 'Pending_Sync' as const,
    };

    const toArrayMock = vi.fn().mockResolvedValue([mockRecord]);
    const equalsMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
    mockDb.deficiencies.where.mockReturnValue({ equals: equalsMock });

    const { getPendingDeficiencies } = await import('../src/lib/sync');
    const result = await (getPendingDeficiencies as () => Promise<Array<Record<string, unknown>>>)();

    expect(result[0].gps_latitude).toBeNull();
    expect(result[0].gps_longitude).toBeNull();
  });
});

describe('sync utils', () => {
  describe('isTokenExpired', () => {
    it('returns true for expired token', () => {
      const expiredToken = createMockToken(-60);
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('returns false for valid token', () => {
      const validToken = createMockToken(3600);
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('returns true for malformed token', () => {
      expect(isTokenExpired('not-a-valid-token')).toBe(true);
    });
  });

  describe('syncWithAutoRefresh', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
      mockDb.authState.get.mockResolvedValue({ accessToken: 'test-token', refreshToken: 'test-refresh' });
      vi.clearAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('calls sync endpoint directly when token is valid', async () => {
      const validToken = createMockToken(3600);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const result = await syncWithAutoRefresh(validToken, 'refresh-token');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/sync/push-outbox',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validToken}`,
          }),
        })
      );
    });

    it('refreshes token when expired', async () => {
      const expiredToken = createMockToken(-60);

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { access_token: 'new-token' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });

      const result = await syncWithAutoRefresh(expiredToken, 'refresh-token');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('returns AUTH_EXPIRED when refresh token also expired', async () => {
      const expiredToken = createMockToken(-60);

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Refresh failed'));

      const result = await syncWithAutoRefresh(expiredToken, 'expired-refresh');

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('AUTH_EXPIRED');
    });

    it('Pull should collect pending structures deficiencies and photos', async () => {
      const validToken = createMockToken(3600);

      const pendingDeficiencies = [
        {
          localId: 1,
          pendingStructureLocalId: 10,
          clientLocalId: 'client-1',
          category: 'Steel',
          equipmentType: 'Girder',
          component: 'Flange',
          subComponent: 'Top',
          focusArea: 'North',
          deficiencyCategory: 'Corrosion',
          detailedDescription: 'Rust',
          consequenceSeverity: 3,
          likelihood: 'High',
          recommendedAction: 'Paint',
          mostAffectedConsequence: 'Structural',
          gpsLatitude: 40.7128,
          gpsLongitude: -74.006,
          syncState: 'Pending_Sync',
        },
      ];

      const pendingPhotos = [
        {
          localId: 1,
          pendingStructureLocalId: 10,
          pendingDeficiencyLocalId: 1,
          clientLocalId: 'client-1',
          filename: 'photo.jpg',
          caption: 'Test',
          displayOrder: 0,
          storageUrl: null,
          syncState: 'Pending_Sync',
        },
      ];

      const deficienciesToArray = vi.fn().mockResolvedValue([]);
      const submissionsToArray = vi.fn().mockResolvedValue([]);
      const psDefToArray = vi.fn().mockResolvedValue(pendingDeficiencies);
      const psPhotoToArray = vi.fn().mockResolvedValue(pendingPhotos);

      mockDb.deficiencies.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({ toArray: deficienciesToArray }),
      });
      mockDb.offlineSubmissions.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({ toArray: submissionsToArray }),
      });
      mockDb.offlinePendingStructureDeficiencies.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({ toArray: psDefToArray }),
      });
      mockDb.offlinePendingStructurePhotos.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({ toArray: psPhotoToArray }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const result = await syncWithAutoRefresh(validToken, 'refresh-token');

      expect(result.success).toBe(true);
      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.pending_structures).toHaveLength(1);
      expect(body.pending_structures[0].deficiencies).toHaveLength(1);
      expect(body.pending_structures[0].photos).toHaveLength(1);
    });
  });
});