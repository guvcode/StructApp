import { useCallback } from 'react';
import { db } from '../lib/db';
import { getSession, setSession } from '../lib/authStore';
import { syncPinToServer } from '../services/api/auth';

const PIN_ATTEMPTS_KEY = 'pin_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getAttempts(): { count: number; lockedUntil: number } {
  try {
    const raw = localStorage.getItem(PIN_ATTEMPTS_KEY);
    if (!raw) return { count: 0, lockedUntil: 0 };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function setAttempts(count: number, lockedUntil: number): void {
  localStorage.setItem(PIN_ATTEMPTS_KEY, JSON.stringify({ count, lockedUntil }));
}

export function resetPinAttempts(): void {
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
}

export function isPinLockedOut(): boolean {
  const { lockedUntil } = getAttempts();
  if (lockedUntil === 0) return false;
  if (Date.now() >= lockedUntil) {
    resetPinAttempts();
    return false;
  }
  return true;
}

export function getRemainingLockoutMs(): number {
  const { lockedUntil } = getAttempts();
  if (lockedUntil === 0) return 0;
  return Math.max(0, lockedUntil - Date.now());
}

async function recordFailedAttempt(): Promise<number> {
  const { count } = getAttempts();
  const newCount = count + 1;
  if (newCount >= MAX_ATTEMPTS) {
    setAttempts(newCount, Date.now() + LOCKOUT_DURATION_MS);
  } else {
    setAttempts(newCount, 0);
  }
  return MAX_ATTEMPTS - newCount;
}

function mapRoleToBackend(role: string): 'Admin' | 'Reviewer' | 'Contractor' {
  switch (role) {
    case 'admin': return 'Admin';
    case 'reviewer': return 'Reviewer';
    default: return 'Contractor';
  }
}

export async function savePinLocally(pin: string): Promise<void> {
  const session = getSession();
  if (!session) throw new Error('No active session');

  const pinHash = await sha256(pin);
  const userData = JSON.stringify({
    token: session.token,
    refresh_token: session.refresh_token,
    user: session.user,
    expires_at: session.expires_at,
    active_client_id: session.active_client_id,
  });

  await db.authState.put({
    id: 'current',
    accessToken: session.token,
    refreshToken: session.refresh_token,
    clientId: session.active_client_id || '',
    userId: session.user.id,
    role: mapRoleToBackend(session.user.role),
    pinHash,
    userData,
  });

  syncPinToServer(pinHash).catch(() => {});
}

export async function verifyPinLocally(pin: string): Promise<boolean> {
  if (isPinLockedOut()) return false;

  const authState = await db.authState.get('current');
  if (!authState?.pinHash) return false;

  const inputHash = await sha256(pin);
  if (inputHash !== authState.pinHash) {
    const remaining = await recordFailedAttempt();
    if (remaining > 0) throw new Error(`Incorrect PIN. ${remaining} attempts remaining.`);
    throw new Error('Too many incorrect attempts. Try again in 30 seconds.');
  }

  resetPinAttempts();

  if (authState.userData) {
    try {
      const data = JSON.parse(authState.userData);
      setSession({
        token: data.token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_at: data.expires_at,
        active_client_id: data.active_client_id,
      });
    } catch {
      return false;
    }
  }

  return true;
}

export async function hasLocalPin(): Promise<boolean> {
  try {
    const authState = await db.authState.get('current');
    return !!authState?.pinHash;
  } catch {
    return false;
  }
}

export async function clearLocalPin(): Promise<void> {
  const authState = await db.authState.get('current');
  if (authState) {
    const { pinHash, userData, ...rest } = authState;
    await db.authState.put(rest);
  }
}

export async function syncPinFromServer(): Promise<void> {
  return;
}

export function usePinAuth() {
  const savePin = useCallback(async (pin: string) => {
    await savePinLocally(pin);
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    return verifyPinLocally(pin);
  }, []);

  const clearPin = useCallback(async () => {
    await clearLocalPin();
  }, []);

  return { savePin, verifyPin, clearPin };
}