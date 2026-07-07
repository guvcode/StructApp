import { useCreateClient } from '../../hooks/useClients';
import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../components/Card';

export default function NewClientPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [safetyEmail, setSafetyEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createClient = useCreateClient();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Client name is required'); return; }
    if (!safetyEmail.trim()) { setError('Safety contact email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safetyEmail)) { setError('Invalid email format'); return; }
    setError(null);
    try {
      await createClient.mutateAsync({ name: name.trim(), safety_email: safetyEmail.trim() });
      navigate('/admin/clients', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  }, [name, safetyEmail, navigate, createClient]);

  return (
    <div className="p-8 max-w-7xl animate-fadeIn">
      <h2 className="text-3xl font-bold text-text-primary mb-8">New Client</h2>
      <Card className="shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="client-name" className="block text-sm font-semibold text-text-primary mb-2">Client Name</label>
            <input id="client-name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" disabled={createClient.isPending} placeholder="Enter client name" />
          </div>
          <div>
            <label htmlFor="safety-email" className="block text-sm font-semibold text-text-primary mb-2">Safety Contact Email</label>
            <input id="safety-email" type="email" value={safetyEmail} onChange={e => setSafetyEmail(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" disabled={createClient.isPending} placeholder="safety@example.com" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3" role="alert">{error}</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={createClient.isPending} className="px-5 py-2.5 bg-accent text-white font-semibold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all animate-buttonLift hover:animate-buttonLift-hover">
              {createClient.isPending ? 'Creating...' : 'Create Client'}
            </button>
            <Link to="/admin/clients" className="px-5 py-2.5 border border-border text-text-primary font-medium rounded-lg hover:bg-surface-secondary transition-colors">Cancel</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}