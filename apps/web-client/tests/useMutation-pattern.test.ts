import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');

function getSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    .map((f) => path.join(dir, f));
}

describe('XCQ-602: useMutation + invalidateQueries + no useEffect fetching', () => {
  const scanDirs = [
    path.join(projectRoot, 'apps/web-client/src/components'),
    path.join(projectRoot, 'apps/web-client/src/hooks'),
  ];

  it('files with direct fetch must use React Query', () => {
    const files = scanDirs.flatMap(getSourceFiles);
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const hasFetch = content.includes('fetch(');
      const usesReactQuery = content.includes('useQuery') || content.includes('useMutation');

      if (hasFetch && !usesReactQuery) {
        violations.push(path.relative(projectRoot, file));
      }
    }

    expect(violations).toEqual([]);
  });
});
