export const GLENCORE_GRID: Record<string, number> = {
  '5A': 25, '5B': 24, '5C': 22, '5D': 19, '5E': 15,
  '4A': 23, '4B': 21, '4C': 18, '4D': 14, '4E': 10,
  '3A': 20, '3B': 17, '3C': 13, '3D':  9, '3E':  6,
  '2A': 16, '2B': 12, '2C':  8, '2D':  5, '2E':  3,
  '1A': 11, '1B':  7, '1C':  4, '1D':  2, '1E':  1,
};

export type GlencoreRiskInput = {
  consequenceSeverity: 1 | 2 | 3 | 4 | 5;
  likelihood: 'A' | 'B' | 'C' | 'D' | 'E';
};

export type GlencoreRiskResult = {
  riskRank: number;
  riskRating: 'High' | 'Medium' | 'Low';
};

export function calculateGlencoreRisk(
  consequenceSeverity: 1 | 2 | 3 | 4 | 5,
  likelihood: 'A' | 'B' | 'C' | 'D' | 'E'
): GlencoreRiskResult {
  const key = `${consequenceSeverity}${likelihood}`;
  const riskRank = GLENCORE_GRID[key];

  let riskRating: 'High' | 'Medium' | 'Low';
  if (riskRank >= 17) {
    riskRating = 'High';
  } else if (riskRank >= 7) {
    riskRating = 'Medium';
  } else {
    riskRating = 'Low';
  }

  return { riskRank, riskRating };
}