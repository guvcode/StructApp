import { useState, useCallback } from 'react';

const drafts = new Map<string, unknown>();

export function useLocalState<T>(key: string) {
  const [value, setValue] = useState<T | undefined>(() => drafts.get(key) as T | undefined);

  const save = useCallback((val: T) => {
    drafts.set(key, val);
    setValue(val);
  }, [key]);

  const clear = useCallback(() => {
    drafts.delete(key);
    setValue(undefined);
  }, [key]);

  return { value, save, clear };
}