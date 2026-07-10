import type { AuthSession } from '../types/index';
import { UserRole } from '../types/index';

const STORAGE_KEY = 'structapp_auth_session';

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
  }
}

let currentSession: AuthSession | null = loadSession();

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function getSession(): AuthSession | null {
  return currentSession;
}

export function setSession(session: AuthSession | null): void {
  currentSession = session;
  saveSession(session);
  notify();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isAuthenticated(): boolean {
  return currentSession !== null && !isSessionExpired();
}

export function getUserRole(): string | null {
  return currentSession?.user?.role ?? null;
}

export function clearSession(): void {
  setSession(null);
}

export function getActiveClientId(): string | undefined {
  return currentSession?.active_client_id;
}

export function setActiveClientId(clientId: string): void {
  if (currentSession) {
    currentSession = { ...currentSession, active_client_id: clientId };
    saveSession(currentSession);
    notify();
  }
}

export function getHasUnsyncedWork(): boolean {
  return currentSession?.hasUnsyncedWork ?? false;
}

export function setHasUnsyncedWork(has: boolean): void {
  if (currentSession) {
    currentSession = { ...currentSession, hasUnsyncedWork: has };
    saveSession(currentSession);
    notify();
  }
}

export function isSessionExpired(): boolean {
  if (!currentSession?.expires_at) return true;
  return new Date(currentSession.expires_at).getTime() <= Date.now();
}

export function getLandingRoute(role?: string): string {
  const r = role ?? getUserRole();
  switch (r) {
    case UserRole.admin:
      return '/admin/dashboard';
    case UserRole.reviewer:
      return '/reviewer/dashboard';
    default:
      return '/m/dashboard';
  }
}