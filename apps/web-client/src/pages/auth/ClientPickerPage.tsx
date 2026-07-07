import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSession, getLandingRoute } from '../../lib/authStore';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Card from '../../components/Card';

interface ClientOption {
  client_id: string;
  display_name: string;
}

export default function ClientPickerPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const session = getSession();

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient<Array<{ id: string; name: string }>>(ENDPOINTS.clients.list),
    enabled: !!session,
  });

  const clientLookup = useMemo(() => {
    const map = new Map<string, string>();
    allClients.forEach(c => map.set(c.id, c.name));
    return map;
  }, [allClients]);

  const clients = useMemo<ClientOption[]>(() => {
    if (!session?.user?.client_memberships) return [];
    return session.user.client_memberships
      .map(m => {
        const name = clientLookup.get(m.client_id);
        return name ? { client_id: m.client_id, display_name: name } : null;
      })
      .filter((c): c is ClientOption => c !== null);
  }, [session, clientLookup]);

  if (!session) {
    navigate('/login', { replace: true });
    return null;
  }

  const filtered = clients.filter(c =>
    c.display_name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = async (clientId: string) => {
    setLoading(true);
    const { setActiveClientId } = await import('../../lib/authStore');
    setActiveClientId(clientId);
    navigate(getLandingRoute(), { replace: true });
  };

  return (
    <Card className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Select client</h1>
        <p className="text-text-secondary">Choose which client workspace to access</p>
      </div>
      
      <div className="space-y-5">
        <div>
          <label htmlFor="client-search" className="block text-sm font-semibold text-text-primary mb-2">
            Search clients
          </label>
          <input
            id="client-search"
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            disabled={loading}
          />
        </div>
        
        {filtered.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">No clients available</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map(c => (
              <li key={c.client_id}>
                <button
                  onClick={() => handleSelect(c.client_id)}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 border border-border rounded-lg bg-surface-primary hover:bg-surface-secondary text-text-primary font-semibold disabled:opacity-50 transition-all shadow-sm"
                >
                  {c.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}