import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSession, getActiveClientId } from '../lib/authStore';
import { switchClient } from '../services/api/auth';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';

export default function AdminClientSwitcher() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const session = getSession();
  const activeClientId = getActiveClientId();

  const { data: allClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient<Array<{ id: string; name: string }>>(ENDPOINTS.clients.list),
    enabled: !!session,
  });

  const adminClients = useMemo(() => {
    if (!session?.user?.client_memberships || !allClients) return [];
    const memberIds = new Set(session.user.client_memberships.map(m => m.client_id));
    return allClients.filter(c => memberIds.has(c.id));
  }, [session, allClients]);

  const activeClient = adminClients.find(c => c.id === activeClientId) || adminClients[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-lg border border-border hover:bg-surface-hover transition-colors"
      >
        <svg className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium text-text-primary">
          {activeClient?.name || 'Select Client'}
        </span>
        {adminClients.length > 1 && (
          <svg className={`w-4 h-4 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && adminClients.length > 1 && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface-elevated border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Select Client
            </div>
            <div className="space-y-1">
              {adminClients.map(c => {
                const isActive = c.id === activeClientId;
                return (
                  <button
                    key={c.id}
                    onClick={async () => {
                      setOpen(false);
                      try {
                        await switchClient(c.id);
                      } catch {
                        return;
                      }
                      window.location.reload();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="flex-1 text-left">{c.name}</span>
                    {isActive && (
                      <svg className="w-4 h-4 text-accent shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}