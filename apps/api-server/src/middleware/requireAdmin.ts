import { Request, Response, NextFunction } from 'express';

export function requireAdmin(
  req: Request & { user?: { role: string } },
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      error_code: 'FORBIDDEN_ADMIN_ONLY',
      message: 'This action is restricted to System Administrators.',
    });
  }
  next();
}

export function requireAdminOrReviewer(
  req: Request & { user?: { role: string } },
  res: Response,
  next: NextFunction
): void {
  if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Reviewer')) {
    return res.status(403).json({
      success: false,
      error_code: 'FORBIDDEN',
      message: 'Access denied.',
    });
  }
  next();
}