import { useEffect, useState, useRef } from 'react';
import { subscribe, getActiveClientId } from '../lib/authStore';

export function useClientScope(fetchFn: () => Promise<void>) {
  const [clientId, setClientId] = useState(getActiveClientId());
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    const unsub = subscribe(() => {
      const newId = getActiveClientId();
      if (newId !== clientId) {
        setClientId(newId);
      }
    });
    return unsub;
  }, [clientId]);

  useEffect(() => {
    fetchRef.current();
  }, [clientId]);

  return { clientId };
}