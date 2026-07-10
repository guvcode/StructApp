import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClients, useUpdateClient } from '../../hooks/useClients';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import EditDrawer from '../../components/EditDrawer';

function ClientEditDrawer({ client, onClose, onSaved }: { client: { id: string; name: string; safety_email?: string }; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(client.name);
  const [safetyEmail, setSafetyEmail] = useState(client.safety_email || '');
  const updateClientMutation = useUpdateClient();

  const handleSave = useCallback(async () => {
    const input: { name: string; safety_email?: string } = { name };
    if (safetyEmail) input.safety_email = safetyEmail;
    await updateClientMutation.mutateAsync({ id: client.id, input });
    onSaved();
    onClose();
  }, [client.id, name, safetyEmail, onClose, onSaved, updateClientMutation]);

  return (
    <EditDrawer title="Edit Client" saving={updateClientMutation.isPending} valid={!!name.trim()} onClose={onClose} onSave={handleSave}>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Client Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          placeholder="Enter client name"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Safety Contact Email</label>
        <input
          value={safetyEmail}
          onChange={e => setSafetyEmail(e.target.value)}
          type="email"
          className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          placeholder="safety@example.com"
        />
      </div>
    </EditDrawer>
  );
}

export default function ClientListPage() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading, refetch } = useClients();
  const [editingClient, setEditingClient] = useState<{ id: string; name: string; safety_email?: string } | null>(null);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl animate-fadeIn">
        <button onClick={() => navigate('/admin')} className="text-sm text-accent mb-4">&larr; Admin Dashboard</button>
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl animate-fadeIn">
      <button onClick={() => navigate('/admin')} className="text-sm text-accent mb-4">&larr; Admin Dashboard</button>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Clients</h2>
        <Link
          to="/admin/clients/new"
          className="px-4 py-2 bg-accent text-accent-foreground font-medium rounded-lg shadow-sm hover:opacity-90 transition-all animate-buttonLift hover:animate-buttonLift-hover"
        >
          New Client
        </Link>
      </div>
      {clients.length === 0 ? (
        <Card padding="lg" className="shadow-card">
          <EmptyState icon="inbox" title="No clients found" description="Create your first client to get started." action={{ label: 'Create Client', onClick: () => window.location.href = '/admin/clients/new' }} />
        </Card>
      ) : (
        <Card padding="none" className="shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-text-secondary font-semibold">Name</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Safety Email</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Created</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 text-text-primary font-medium">{c.name}</td>
                    <td className="py-4 text-text-secondary">{c.safety_email || '—'}</td>
                    <td className="py-4 text-text-secondary">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-4">
                      <button
                        onClick={() => setEditingClient(c)}
                        className="px-3 py-1.5 text-accent hover:bg-accent/10 font-medium rounded-md transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {editingClient && (
        <ClientEditDrawer
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}