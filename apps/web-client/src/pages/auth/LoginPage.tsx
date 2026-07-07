import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSession } from '../../lib/authStore';
import { login as apiLogin } from '../../services/api/auth';
import Card from '../../components/Card';

function getClientMembershipCount(session: import('../../types').AuthSession): number {
  return session.user.client_memberships?.length ?? 0;
}

function getFirstClientId(session: import('../../types').AuthSession): string | undefined {
  return session.user.client_memberships?.[0]?.client_id;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) {
        toast.error('Email and password are required');
        return;
      }
      setLoading(true);
      try {
        const session = await apiLogin(email, password);
        const membershipCount = getClientMembershipCount(session);
        if (membershipCount <= 1) {
          const clientId = getFirstClientId(session);
          if (clientId) {
            const { setActiveClientId, getLandingRoute } = await import('../../lib/authStore');
            setActiveClientId(clientId);
            navigate(getLandingRoute(), { replace: true });
          } else {
            navigate('/forbidden', { replace: true });
          }
        } else {
          navigate('/select-client', { replace: true });
        }
      } catch (err: any) {
        toast.error(err.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    },
    [email, password, navigate],
  );

  return (
    <Card className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome back</h1>
        <p className="text-text-secondary">Sign in to your Nerizon account</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-text-primary mb-2">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            autoComplete="email"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="login-password" className="block text-sm font-semibold text-text-primary mb-2">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-accent text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      
      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/activate" className="text-accent hover:underline font-medium">
            Activate your invite
          </Link>
        </p>
      </div>
    </Card>
  );
}