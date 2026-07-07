import { useQuery } from '@tanstack/react-query';
import { getSession, getActiveClientId } from '../lib/authStore';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';

export default function TenantContextBadge() {
  const activeClientId = getActiveClientId();
  const session = getSession();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient<Array<{ id: string; name: string }>>(ENDPOINTS.clients.list),
    enabled: !!session,
  });

  const clientId = activeClientId || session?.user?.client_memberships?.[0]?.client_id;
  const client = clients.find(c => c.id === clientId);
  const label = client?.name || 'No client';

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-lg border border-border whitespace-nowrap">
      <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <span className="text-sm font-medium text-text-primary">{label}</span>
    </div>
  );
}