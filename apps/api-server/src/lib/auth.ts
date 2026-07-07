import jwt from 'jsonwebtoken';

export function decodeTokenUnsafe(token: string): { sub?: string } | null {
  try {
    return jwt.decode(token) as { sub?: string } | null;
  } catch {
    return null;
  }
}
