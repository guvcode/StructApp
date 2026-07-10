import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSession } from '../../lib/authStore';
import { login as apiLogin } from '../../services/api/auth';
import { hasLocalPin, verifyPinLocally, isPinLockedOut, resetPinAttempts, getRemainingLockoutMs } from '../../hooks/usePinAuth';
import Card from '../../components/Card';
import { UserRole } from '../../types/index';

function getClientMembershipCount(session: import('../../types').AuthSession): number {
  return session.user.client_memberships?.length ?? 0;
}

function getFirstClientId(session: import('../../types').AuthSession): string | undefined {
  return session.user.client_memberships?.[0]?.client_id;
}

async function redirectAfterLogin(session: import('../../types').AuthSession, navigate: ReturnType<typeof useNavigate>) {
  const hasPin = await hasLocalPin();
  if (!hasPin && navigator.onLine && session.user.role === UserRole.contractor) {
    try {
      sessionStorage.setItem('pin_setup_prompt', 'true');
    } catch {
    }
  }
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
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [checkingPin, setCheckingPin] = useState(true);

  useEffect(() => {
    const offline = !navigator.onLine;
    setIsOffline(offline);
    if (offline) {
      hasLocalPin().then(p => {
        setHasPin(p);
        setCheckingPin(false);
      });
    } else {
      setCheckingPin(false);
    }
  }, []);

  useEffect(() => {
    if (lockoutCountdown > 0) {
      const timer = setInterval(() => {
        const remaining = getRemainingLockoutMs();
        if (remaining <= 0) {
          setLockoutCountdown(0);
          resetPinAttempts();
          setPinError('');
        } else {
          setLockoutCountdown(Math.ceil(remaining / 1000));
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutCountdown]);

  const handleOnlineSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) {
        toast.error('Email and password are required');
        return;
      }
      setLoading(true);
      try {
        const session = await apiLogin(email, password);
        await redirectAfterLogin(session, navigate);
      } catch (err: any) {
        toast.error(err.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    },
    [email, password, navigate],
  );

  const handlePinDigit = useCallback((digit: string) => {
    if (pin.length < 6) setPin(prev => prev + digit);
    setPinError('');
  }, [pin.length]);

  const handlePinBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setPinError('');
  }, []);

  const handlePinSubmit = useCallback(async () => {
    if (pin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (isPinLockedOut()) {
      setLockoutCountdown(Math.ceil(getRemainingLockoutMs() / 1000));
      return;
    }
    try {
      const ok = await verifyPinLocally(pin);
      if (ok) {
        const session = getSession();
        if (session) {
          await redirectAfterLogin(session, navigate);
        }
      }
    } catch (err: any) {
      setPinError(err.message || 'Invalid PIN');
      setPin('');
      if (err.message?.includes('30 seconds')) {
        setLockoutCountdown(30);
      }
    }
  }, [pin, navigate]);

  if (checkingPin) {
    return (
      <Card className="w-full max-w-md">
        <div className="text-center py-8 text-text-secondary">Loading...</div>
      </Card>
    );
  }

  if (isOffline && hasPin) {
    return (
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Offline Access</h1>
          <p className="text-text-secondary">Enter your PIN to sign in</p>
        </div>

        {lockoutCountdown > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-sm text-red-700">
            Too many attempts. Try again in {lockoutCountdown}s
          </div>
        )}

        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                i < pin.length ? 'bg-accent border-accent' : 'border-border'
              }`}
            />
          ))}
        </div>

        {pinError && (
          <p className="text-center text-sm text-red-500 mb-4">{pinError}</p>
        )}

        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-4">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d}
              onClick={() => handlePinDigit(d)}
              disabled={lockoutCountdown > 0}
              className="w-full aspect-square text-xl font-semibold bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary active:scale-95 transition-all disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handlePinDigit('0')}
            disabled={lockoutCountdown > 0}
            className="w-full aspect-square text-xl font-semibold bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary active:scale-95 transition-all disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handlePinBackspace}
            disabled={lockoutCountdown > 0}
            className="w-full aspect-square text-xl font-semibold bg-surface-primary border border-border rounded-xl hover:bg-surface-secondary active:scale-95 transition-all disabled:opacity-50"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handlePinSubmit}
          disabled={pin.length < 4 || lockoutCountdown > 0}
          className="w-full py-3 px-4 bg-accent text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Sign in with PIN
        </button>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-text-secondary">
            {navigator.onLine ? (
              <button onClick={() => setIsOffline(false)} className="text-accent hover:underline font-medium">
                Sign in with email instead
              </button>
            ) : (
              'No network connection available'
            )}
          </p>
        </div>
      </Card>
    );
  }

  if (isOffline && !hasPin) {
    return (
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">No Network</h1>
          <p className="text-text-secondary">Sign in with email/password when connected</p>
        </div>
        <div className="text-center text-sm text-text-muted">
          <p>To use offline access:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Connect to the internet</li>
            <li>Sign in with your email and password</li>
            <li>Set up a PIN in Settings</li>
            <li>Sign in offline with your PIN next time</li>
          </ol>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome back</h1>
        <p className="text-text-secondary">Sign in to your Nerizon account</p>
      </div>
      
      <form onSubmit={handleOnlineSubmit} className="space-y-5">
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