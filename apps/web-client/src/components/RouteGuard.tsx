import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../lib/authStore';
import { UserRole, isReviewerOrAdmin } from '../types/index';

function isPublicRoute(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return ['/login', '/activate', '/select-client', '/session-expired', '/m/setup-pin'].some(r => path.startsWith(r));
}

function getRouteRole(pathname: string): string | null {
  const path = pathname.toLowerCase();
  if (path.startsWith('/m/')) return UserRole.contractor;
  if (path.startsWith('/admin/')) return UserRole.admin;
  if (path.startsWith('/reviewer/')) return UserRole.reviewer;
  if (
    path.startsWith('/inspections') ||
    path.startsWith('/deficiencies') ||
    path.startsWith('/register') ||
    path.startsWith('/remediation') ||
    path.startsWith('/timesheets') ||
    path.startsWith('/reports') ||
    path.startsWith('/categories') ||
    path.startsWith('/calendar')
  ) return UserRole.reviewer;
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

  try {
    if (sessionStorage.getItem('pin_setup_prompt') === 'true' && pathname !== '/m/setup-pin' && pathname.startsWith('/m/')) {
      sessionStorage.removeItem('pin_setup_prompt');
      return <Navigate to="/m/setup-pin" replace />;
    }
  } catch {
  }

  const role = getUserRole();
  const required = getRouteRole(pathname);

  // Redirect bare root path to role-appropriate default
  if (pathname === '/' || pathname === '') {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (role === UserRole.contractor) return <Navigate to="/m/dashboard" replace />;
    if (isReviewerOrAdmin(role)) return <Navigate to="/inspections" replace />;
    return <Navigate to="/login" replace />;
  }

  if (required && role !== required && role !== UserRole.admin) {
    if (required === UserRole.reviewer && role === UserRole.contractor) {
      return <Navigate to="/forbidden" replace />;
    }
    if (required === UserRole.admin && role !== UserRole.admin) {
      return <Navigate to="/forbidden" replace />;
    }
    if (required === UserRole.contractor && role !== UserRole.contractor) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <Outlet />;
}