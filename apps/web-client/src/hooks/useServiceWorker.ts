import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(() => 'serviceWorker' in navigator);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker.register('/sw.js').then(
      () => setIsRegistered(true),
      (err) => console.error('Service worker registration failed:', err),
    );
  }, [isSupported]);

  return { isSupported, isRegistered };
}