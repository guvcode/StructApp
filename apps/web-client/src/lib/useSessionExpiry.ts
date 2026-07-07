import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, isSessionExpired, clearSession } from '../lib/authStore';

export function useSessionExpiry(intervalMs = 30_000) {
  const navigate = useNavigate();
  const notifiedRef = useRef(false);

  useEffect(() => {
    const check = () => {
      const session = getSession();
      if (session && isSessionExpired() && !notifiedRef.current) {
        notifiedRef.current = true;
        clearSession();
        navigate('/session-expired', { replace: true });
      }
    };
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [navigate, intervalMs]);
}

export function resetExpiryNotification() {
  const { notifiedRef } = {} as { notifiedRef: { current: boolean } };
}