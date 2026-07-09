import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSessionExpiry } from '../lib/useSessionExpiry';
import TenantContextBadge from '../components/TenantContextBadge';
import MobileBottomNav from '../components/MobileBottomNav';
import InstallPrompt from '../components/InstallPrompt';

export default function MobileShell() {
  useSessionExpiry();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="https://www.nerizon.ca/img/new-logo.jpg" alt="Nerizon" className="h-8 w-auto" />
          <span className="text-sm font-bold text-text-primary">StructApp</span>
        </div>
        <TenantContextBadge />
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {!online && (
          <div className="bg-yellow-600 text-white text-center text-xs py-1 rounded mb-3">
            You are offline — changes will sync when connected
          </div>
        )}
        <InstallPrompt />
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}