import { useState, useMemo, useCallback } from 'react';

type SortDir = 'asc' | 'desc';

export function useSearchSort<T>(
  items: T[],
  searchFields: (keyof T)[],
  defaultSortKey: keyof T
) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = useCallback((field: keyof T) => {
    setSortKey(prev => {
      if (prev === field) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const sortedFiltered = useMemo(() => {
    const lower = search.toLowerCase();
    let filtered = items;

    if (search.trim()) {
      filtered = items.filter(item =>
        searchFields.some(field => {
          const val = item[field];
          return String(val ?? '').toLowerCase().includes(lower);
        })
      );
    }

    return [...filtered].sort((a, b) => {
      const aVal = String(a[sortKey] ?? '');
      const bVal = String(b[sortKey] ?? '');
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [items, search, searchFields, sortKey, sortDir]);

  return {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    sortedFiltered,
  };
}

export function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-text-muted opacity-30">↕</span>;
  return <span className="ml-1 text-accent">{dir === 'asc' ? '↑' : '↓'}</span>;
}