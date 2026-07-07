import { Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    user?: {
      sub: string;
      client_id: string;
      role: 'Admin' | 'Reviewer' | 'Contractor';
      inspector_id?: string;
      iat: number;
      exp: number;
      iss: 'structapp-app';
      aud: 'structapp-api';
    };
  }
}

export function requireTenantContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user?.client_id) {
    return next();
  }
  next();
}