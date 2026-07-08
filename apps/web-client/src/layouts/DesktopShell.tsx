import { Outlet } from 'react-router-dom';
import { getUserRole } from '../lib/authStore';
import { useSessionExpiry } from '../lib/useSessionExpiry';
import DesktopSidebar from '../components/DesktopSidebar';
import LogoutButton from '../components/LogoutButton';
import TenantContextBadge from '../components/TenantContextBadge';
import type { UserRole } from '../types/index';

export default function DesktopShell() {
  useSessionExpiry();
  const role = (getUserRole() ?? 'reviewer') as UserRole;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface-elevated shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <img src="https://www.nerizon.ca/img/new-logo.jpg" alt="Nerizon" className="h-10 w-auto" />
            <span className="text-lg font-bold text-text-primary hidden sm:inline">StructApp <span className="text-text-secondary font-medium">by Nerizon</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
          <TenantContextBadge />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary rounded-lg border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-text-primary capitalize">{role}</span>
          </div>
          <LogoutButton />
        </div>
      </header>
      
      <div className="flex flex-1">
        <DesktopSidebar role={role} />
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}