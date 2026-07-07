import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'Admin' | 'Reviewer' | 'Contractor';
export type TokenClaims = {
  sub: string;
  client_id: string;
  role: UserRole;
  inspector_id?: string;
  iat: number;
  exp: number;
  iss: 'structapp-app';
  aud: 'structapp-api';
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error_code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenClaims;
    (req as Request & { user: TokenClaims }).user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error_code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user: TokenClaims }).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, error_code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user: TokenClaims }).user;
  if (!user || user.role !== 'Admin') {
    return res.status(403).json({ success: false, error_code: 'FORBIDDEN', message: 'Admin privileges required' });
  }
  next();
}