import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../lib/authStore';

function isPublicRoute(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return ['/login', '/activate', '/select-client', '/session-expired'].some(r => path.startsWith(r));
}

function getRouteRole(pathname: string): string | null {
  const path = pathname.toLowerCase();
  if (path.startsWith('/m/')) return 'contractor';
  if (path.startsWith('/admin/')) return 'admin';
  if (path.startsWith('/reviewer/')) return 'reviewer';
  if (
    path.startsWith('/inspections') ||
    path.startsWith('/deficiencies') ||
    path.startsWith('/register') ||
    path.startsWith('/remediation') ||
    path.startsWith('/timesheets') ||
    path.startsWith('/reports') ||
    path.startsWith('/categories') ||
    path.startsWith('/calendar')
  ) return 'reviewer';
  return null;
}

export default function RouteGuard() {
  const { pathname } = useLocation();

  if (isPublicRoute(pathname)) {
    return <Outlet />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();
  const required = getRouteRole(pathname);

  if (required && role !== required && role !== 'admin') {
    if (required === 'reviewer' && role === 'contractor') {
      return <Navigate to="/forbidden" replace />;
    }
    if (required === 'admin' && role !== 'admin') {
      return <Navigate to="/forbidden" replace />;
    }
    if (required === 'contractor' && role !== 'contractor') {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <Outlet />;
}