import { getSession, setSession, clearSession } from '../../lib/authStore';
import { ENDPOINTS } from './endpoints';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public error_code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const session = getSession();
      if (!session?.token) return false;
      const response = await fetch(ENDPOINTS.auth.refresh, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      if (!response.ok) {
        clearSession();
        return false;
      }
      const json = await response.json();
      if (json.success && json.data?.access_token) {
        const updated = { ...session, token: json.data.access_token };
        setSession(updated);
        import('../../lib/db').then(({ db }) => {
          db.authState.get('current').then(as => {
            if (as?.pinHash) {
              const userData = JSON.stringify({
                token: json.data.access_token,
                refresh_token: session.refresh_token,
                user: session.user,
                expires_at: session.expires_at,
                active_client_id: session.active_client_id,
              });
              db.authState.put({ ...as, accessToken: json.data.access_token, refreshToken: session.refresh_token, userData });
            }
          });
        }).catch(() => {});
        return true;
      }
      clearSession();
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && session?.token) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const newSession = getSession();
      if (newSession?.token) {
        headers['Authorization'] = `Bearer ${newSession.token}`;
      }
      response = await fetch(url, { ...options, headers });
    }
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      json.message || `Request failed with status ${response.status}`,
      response.status,
      json.error_code,
      json.details,
    );
  }

  return json.data as T;
}