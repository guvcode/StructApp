import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { activateInvite } from '../../services/api/auth';
import Card from '../../components/Card';

export default function ActivatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) {
        setError('Missing invitation token');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await activateInvite(token, password);
        setSuccess(true);
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } catch (err: any) {
        setError(err.message || 'Activation failed');
      } finally {
        setLoading(false);
      }
    },
    [token, password, confirm, navigate],
  );

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            Account activated successfully!
          </div>
          <p className="text-text-secondary text-sm">
            Redirecting to{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Activate your account</h1>
        <p className="text-text-secondary">Set your password to get started</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {!token && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg px-4 py-3" role="alert">
            No invitation token found. Use the link from your invitation email.
          </div>
        )}
        
        <div>
          <label htmlFor="activate-password" className="block text-sm font-semibold text-text-primary mb-2">
            Password
          </label>
          <input
            id="activate-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="activate-confirm" className="block text-sm font-semibold text-text-primary mb-2">
            Confirm password
          </label>
          <input
            id="activate-confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3" role="alert">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-accent text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
        >
          {loading ? 'Activating...' : 'Activate'}
        </button>
      </form>
      
      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}