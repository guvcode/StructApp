import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useClients } from '../../hooks/useClients';
import { inviteUser as apiInviteUser } from '../../services/api/auth';
import Card from '../../components/Card';

export default function InviteUserPage() {
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('contractor');
  const [clientId, setClientId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const inviteMutation = useMutation({
    mutationFn: () => apiInviteUser(email.trim(), role, clientId, displayName.trim() || undefined),
    onSuccess: () => navigate('/admin/users', { replace: true }),
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
        setValidationError('A user with this email already exists');
      } else {
        setValidationError(err instanceof Error ? err.message : 'Failed to invite user');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setValidationError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setValidationError('Invalid email format'); return; }
    if (!clientId) { setValidationError('Select a client'); return; }
    setValidationError(null);
    inviteMutation.mutate();
  };

  const loading = inviteMutation.isPending;

  return (
    <div className="p-8 max-w-7xl animate-fadeIn">
      <h2 className="text-3xl font-bold text-text-primary mb-8">Invite User</h2>
      <Card className="shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-semibold text-text-primary mb-2">Email</label>
            <input id="invite-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" disabled={loading} placeholder="user@example.com" />
          </div>
          <div>
            <label htmlFor="invite-name" className="block text-sm font-semibold text-text-primary mb-2">Name</label>
            <input id="invite-name" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" disabled={loading} placeholder="John Doe" />
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-sm font-semibold text-text-primary mb-2">Role</label>
            <select id="invite-role" value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" disabled={loading}>
              <option value="admin">Admin</option>
              <option value="reviewer">Reviewer</option>
              <option value="contractor">Contractor</option>
              <option value="inspector">Inspector</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div>
            <label htmlFor="invite-client" className="block text-sm font-semibold text-text-primary mb-2">Client</label>
            <select id="invite-client" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" disabled={loading}>
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {validationError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3" role="alert">{validationError}</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-accent text-white font-semibold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all animate-buttonLift hover:animate-buttonLift-hover">
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
            <Link to="/admin/users" className="px-5 py-2.5 border border-border text-text-primary font-medium rounded-lg hover:bg-surface-secondary transition-colors">Cancel</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}