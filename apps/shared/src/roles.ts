// ---------------------------------------------------------------------------
// Canonical role constants — single source of truth for the entire codebase.
// Never use inline string literals for roles. Import from here.
// ---------------------------------------------------------------------------

// --- Backend/PascalCase (stored in DB, used in JWT claims, middleware) ---
export const BACKEND_ROLE_ADMIN = 'Admin';
export const BACKEND_ROLE_REVIEWER = 'Reviewer';
export const BACKEND_ROLE_CONTRACTOR = 'Contractor';

export const BACKEND_ROLES = [
  BACKEND_ROLE_ADMIN,
  BACKEND_ROLE_REVIEWER,
  BACKEND_ROLE_CONTRACTOR,
] as const;

export type BackendRole = (typeof BACKEND_ROLES)[number];

// Reviewer-only routes
export const BACKEND_ROLES_REVIEWER_ADMIN = [
  BACKEND_ROLE_REVIEWER,
  BACKEND_ROLE_ADMIN,
] as const;

// Contractor-only routes
export const BACKEND_ROLES_CONTRACTOR = [BACKEND_ROLE_CONTRACTOR] as const;

// Admin-only routes
export const BACKEND_ROLES_ADMIN = [BACKEND_ROLE_ADMIN] as const;

// Open to all
export const BACKEND_ROLES_ALL = [...BACKEND_ROLES] as const;

// --- Frontend/lowercase (used in client-side routing, guards, components) ---
export const ROLE_ADMIN = 'admin';
export const ROLE_REVIEWER = 'reviewer';
export const ROLE_CONTRACTOR = 'contractor';
export const ROLE_INSPECTOR = 'inspector'; // maps to Contractor on backend
export const ROLE_OWNER = 'owner';         // maps to Reviewer on backend

export const ROLES = [
  ROLE_ADMIN,
  ROLE_REVIEWER,
  ROLE_CONTRACTOR,
  ROLE_INSPECTOR,
  ROLE_OWNER,
] as const;

export type Role = (typeof ROLES)[number];

// --- Bidirectional mapping (frontend lowercase <-> backend PascalCase) ---

export const BACKEND_TO_FRONTEND: Record<string, Role> = {
  [BACKEND_ROLE_ADMIN]: ROLE_ADMIN,
  [BACKEND_ROLE_REVIEWER]: ROLE_REVIEWER,
  [BACKEND_ROLE_CONTRACTOR]: ROLE_CONTRACTOR,
};

export const FRONTEND_TO_BACKEND: Record<string, BackendRole> = {
  [ROLE_ADMIN]: BACKEND_ROLE_ADMIN,
  [ROLE_REVIEWER]: BACKEND_ROLE_REVIEWER,
  [ROLE_CONTRACTOR]: BACKEND_ROLE_CONTRACTOR,
  [ROLE_INSPECTOR]: BACKEND_ROLE_CONTRACTOR,
  [ROLE_OWNER]: BACKEND_ROLE_REVIEWER,
};

// --- Helper functions ---

export function mapBackendRole(role: string): Role {
  return BACKEND_TO_FRONTEND[role] ?? ROLE_CONTRACTOR;
}

export function mapToBackendRole(role: string): BackendRole {
  return FRONTEND_TO_BACKEND[role] ?? BACKEND_ROLE_CONTRACTOR;
}

// --- Guard helpers for frontend ---

export function isAdmin(role: string): boolean {
  return role === ROLE_ADMIN;
}

export function isReviewer(role: string): boolean {
  return role === ROLE_REVIEWER;
}

export function isContractor(role: string): boolean {
  return role === ROLE_CONTRACTOR;
}

export function isReviewerOrAdmin(role: string): boolean {
  return role === ROLE_REVIEWER || role === ROLE_ADMIN;
}