import { hashPin, verifyPin, getArgon2Params, ARGON2_PARAMS } from '../src/services/pin';

describe('pin service', () => {
  const PIN = '123456';

  describe('hashPin', () => {
    test('produces a hash for the PIN', async () => {
      const hash = await hashPin(PIN);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(20);
    });

    test('produces a different hash for a different PIN', async () => {
      const hash1 = await hashPin(PIN);
      const hash2 = await hashPin('654321');
      expect(hash1).not.toBe(hash2);
    });

    test('uses pinned Argon2id parameters', async () => {
      const params = getArgon2Params();
      expect(params.type).toBe(2);
      expect(params.timeCost).toBe(3);
      expect(params.memoryCost).toBe(65536);
      expect(params.parallelism).toBe(4);
    });
  });

  describe('verifyPin', () => {
    let storedHash: string;

    beforeEach(async () => {
      storedHash = await hashPin(PIN);
    });

    test('returns true for correct PIN', async () => {
      const result = await verifyPin(PIN, storedHash);
      expect(result).toBe(true);
    });

    test('returns false for wrong PIN', async () => {
      const result = await verifyPin('000000', storedHash);
      expect(result).toBe(false);
    });

    test('returns false for malformed hash', async () => {
      const result = await verifyPin(PIN, 'not-a-valid-hash');
      expect(result).toBe(false);
    });

    test('verification takes measurable time (catches parameter weakening)', async () => {
      const start = Date.now();
      await verifyPin(PIN, storedHash);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });
});
