import { queryClient } from '../src/lib/queryClient';
import { QueryClient } from '@tanstack/react-query';

describe('shared queryClient', () => {
  test('exports a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
  });

  test('has correct global query defaults', () => {
    const defaults = queryClient.getDefaultOptions().queries;
    expect(defaults?.staleTime).toBe(30_000);
    expect(defaults?.gcTime).toBe(300_000);
    expect(defaults?.retry).toBe(2);
    expect(defaults?.refetchOnWindowFocus).toBe(false);
  });

  test('sets refetchOnWindowFocus=true for inspections', () => {
    const inspectionDefaults = queryClient.getQueryDefaults(['inspections']);
    expect(inspectionDefaults?.refetchOnWindowFocus).toBe(true);
  });

  test('sets refetchOnWindowFocus=true for deficiencies', () => {
    const deficiencyDefaults = queryClient.getQueryDefaults(['deficiencies']);
    expect(deficiencyDefaults?.refetchOnWindowFocus).toBe(true);
  });
});
