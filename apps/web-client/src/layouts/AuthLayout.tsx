import { Outlet } from 'react-router-dom';
import { useSessionExpiry } from '../lib/useSessionExpiry';

export default function AuthLayout() {
  useSessionExpiry();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b border-border flex items-center gap-3">
        <img src="https://www.nerizon.ca/img/new-logo.jpg" alt="Nerizon" className="h-10 w-auto" />
        <span className="text-lg font-bold text-text-primary">StructApp <span className="text-text-secondary font-medium">by Nerizon</span></span>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
      <footer className="p-2 text-center text-xs text-text-secondary border-t border-border">
        v2.0.0
      </footer>
    </div>
  );
}