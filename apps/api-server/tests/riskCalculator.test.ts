import { calculateGlencoreRisk, GLENCORE_GRID } from '../src/utils/riskCalculator';

describe('GLENCORE_GRID', () => {
  test('contains all 25 cells', () => {
    expect(Object.keys(GLENCORE_GRID)).toHaveLength(25);
  });

  test('values range from 1 to 25', () => {
    const values = Object.values(GLENCORE_GRID);
    expect(Math.min(...values)).toBe(1);
    expect(Math.max(...values)).toBe(25);
  });

  test('highest risk is 5A = 25', () => {
    expect(GLENCORE_GRID['5A']).toBe(25);
  });

  test('lowest risk is 1E = 1', () => {
    expect(GLENCORE_GRID['1E']).toBe(1);
  });
});

describe('calculateGlencoreRisk', () => {
  test('returns High for rank >= 17', () => {
    const result = calculateGlencoreRisk(5, 'A');
    expect(result.riskRank).toBe(25);
    expect(result.riskRating).toBe('High');
  });

  test('returns High at boundary rank 17', () => {
    const result = calculateGlencoreRisk(3, 'B');
    expect(result.riskRank).toBe(17);
    expect(result.riskRating).toBe('High');
  });

  test('returns Medium for rank 7-16', () => {
    const result = calculateGlencoreRisk(2, 'B');
    expect(result.riskRank).toBe(12);
    expect(result.riskRating).toBe('Medium');
  });

  test('returns Medium at boundary rank 7', () => {
    const result = calculateGlencoreRisk(1, 'B');
    expect(result.riskRank).toBe(7);
    expect(result.riskRating).toBe('Medium');
  });

  test('returns Low for rank <= 6', () => {
    const result = calculateGlencoreRisk(1, 'E');
    expect(result.riskRank).toBe(1);
    expect(result.riskRating).toBe('Low');
  });

  test('returns Low at boundary rank 6', () => {
    const result = calculateGlencoreRisk(3, 'E');
    expect(result.riskRank).toBe(6);
    expect(result.riskRating).toBe('Low');
  });

  test('all 25 combinations produce valid rating', () => {
    const severities = [1, 2, 3, 4, 5] as const;
    const likelihoods = ['A', 'B', 'C', 'D', 'E'] as const;
    for (const s of severities) {
      for (const l of likelihoods) {
        const result = calculateGlencoreRisk(s, l);
        expect(result.riskRank).toBeGreaterThanOrEqual(1);
        expect(result.riskRank).toBeLessThanOrEqual(25);
        expect(['High', 'Medium', 'Low']).toContain(result.riskRating);
      }
    }
  });
});