import { describe, it, expect } from 'vitest';
import { calculateGlencoreRisk, GLENCORE_GRID } from '../src/utils/riskCalculator';

describe('GLENCORE_GRID', () => {
  it('has 25 cells', () => {
    expect(Object.keys(GLENCORE_GRID)).toHaveLength(25);
  });

  it('matches server-side grid exactly', () => {
    expect(GLENCORE_GRID['5A']).toBe(25);
    expect(GLENCORE_GRID['1E']).toBe(1);
  });
});

describe('calculateGlencoreRisk (shared, client-side)', () => {
  it('returns High for rank >= 17', () => {
    const result = calculateGlencoreRisk(5, 'A');
    expect(result.riskRank).toBe(25);
    expect(result.riskRating).toBe('High');
  });

  it('returns Medium for rank 7-16', () => {
    const result = calculateGlencoreRisk(2, 'B');
    expect(result.riskRank).toBe(12);
    expect(result.riskRating).toBe('Medium');
  });

  it('returns Low for rank <= 6', () => {
    const result = calculateGlencoreRisk(1, 'E');
    expect(result.riskRank).toBe(1);
    expect(result.riskRating).toBe('Low');
  });
});