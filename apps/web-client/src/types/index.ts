export const UserRole = {
  inspector: 'inspector',
  admin: 'admin',
  owner: 'owner',
  contractor: 'contractor',
  reviewer: 'reviewer',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const BackendUserRole = {
  Admin: 'Admin',
  Reviewer: 'Reviewer',
  Contractor: 'Contractor',
} as const;
export type BackendUserRole = (typeof BackendUserRole)[keyof typeof BackendUserRole];

const ROLE_MAP: Record<BackendUserRole, UserRole> = {
  Admin: UserRole.admin,
  Reviewer: UserRole.reviewer,
  Contractor: UserRole.contractor,
};

export function mapBackendRole(role: string): UserRole {
  return ROLE_MAP[role as BackendUserRole] ?? UserRole.contractor;
}

export function mapToBackendRole(role: string): BackendUserRole {
  const reverseMap: Record<string, BackendUserRole> = {
    admin: BackendUserRole.Admin,
    reviewer: BackendUserRole.Reviewer,
    contractor: BackendUserRole.Contractor,
    inspector: BackendUserRole.Contractor,
    owner: BackendUserRole.Reviewer,
  };
  return reverseMap[role] ?? BackendUserRole.Contractor;
}

// --- Guard helpers (string-based, for pages with role:string not User) ---

export function isAdmin(role: string | null): boolean {
  return role === UserRole.admin;
}

export function isReviewer(role: string | null): boolean {
  return role === UserRole.reviewer;
}

export function isContractor(role: string | null): boolean {
  return role === UserRole.contractor;
}

export function isReviewerOrAdmin(role: string | null): boolean {
  return role === UserRole.reviewer || role === UserRole.admin;
}

export const ClientRole = {
  primary: 'primary',
  secondary: 'secondary',
} as const;
export type ClientRole = (typeof ClientRole)[keyof typeof ClientRole];

export const InspectionStatus = {
  Draft: 'Draft',
  Assigned: 'Assigned',
  InProgress: 'InProgress',
  Submitted: 'Submitted',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Returned: 'Returned',
} as const;
export type InspectionStatus = (typeof InspectionStatus)[keyof typeof InspectionStatus];

export const DeficiencyStatus = {
  Open: 'Open',
  InRemediation: 'InRemediation',
  Resolved: 'Resolved',
  Closed: 'Closed',
} as const;
export type DeficiencyStatus = (typeof DeficiencyStatus)[keyof typeof DeficiencyStatus];

export const RemediationStatus = {
  Open: 'Open',
  RemediationScheduled: 'Remediation_Scheduled',
  PendingVerification: 'Remediated_Pending_Verification',
  VerifiedClosed: 'Verified_Closed',
} as const;
export type RemediationStatus = (typeof RemediationStatus)[keyof typeof RemediationStatus];

export const PriorityTier = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
  P5: 'P5',
} as const;
export type PriorityTier = (typeof PriorityTier)[keyof typeof PriorityTier];

export const PRIORITY_DESCRIPTIONS: Record<string, string> = {
  P1: 'Critical Condition — Immediate action required; repair within 60 days max',
  P2: 'Poor Condition — Repair actions needed within 12 months',
  P3: 'Bad Condition — Repairs needed within 24 to 36 months',
  P4: 'Fair Condition — Monitor before next scheduled inspection',
  P5: 'Good Condition — No repairs required',
};

export const TimesheetStatus = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  Approved: 'Approved',
  Rejected: 'Rejected',
} as const;
export type TimesheetStatus = (typeof TimesheetStatus)[keyof typeof TimesheetStatus];

export const ReportJobStatus = {
  Queued: 'Queued',
  Processing: 'Processing',
  Ready: 'Ready',
  Failed: 'Failed',
} as const;
export type ReportJobStatus = (typeof ReportJobStatus)[keyof typeof ReportJobStatus];

export const ReportOutputType = {
  DraftPdf: 'draft_pdf',
  FinalPdf: 'final_pdf',
  Word: 'word',
  Excel: 'excel',
  Csv: 'csv',
} as const;
export type ReportOutputType = (typeof ReportOutputType)[keyof typeof ReportOutputType];

export const SyncState = {
  synced: 'synced',
  pending: 'pending',
  conflict: 'conflict',
  offline: 'offline',
} as const;
export type SyncState = (typeof SyncState)[keyof typeof SyncState];

export const FeatureFlagId = {
  auth: 'auth',
  inspections: 'inspections',
  deficiencies: 'deficiencies',
  remediation: 'remediation',
  timesheets: 'timesheets',
  reports: 'reports',
  sync: 'sync',
  client_management: 'client_management',
  audit_logs: 'audit_logs',
  picklists: 'picklists',
  imports: 'imports',
  calendar: 'calendar',
} as const;
export type FeatureFlagId = (typeof FeatureFlagId)[keyof typeof FeatureFlagId];

export interface ClientMembership {
  client_id: string;
  client_role: ClientRole;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string | null;
  invite_accepted_at?: string | null;
  client_memberships: ClientMembership[];
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  safety_email?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  code: string;
  status: string;
  region?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface Site {
  id: string;
  project_id: string;
  name: string;
  address: string;
  status: string;
  safety_email?: string;
  coordinates?: { lat: number; lng: number };
  created_at: string;
}

export interface StructureAsset {
  id: string;
  site_id: string;
  name: string;
  type: string;
  identifier: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Inspection {
  id: string;
  site_id: string;
  site_name?: string;
  structure_id?: string;
  client_id: string;
  assigned_to: string;
  assigned_by: string;
  status: InspectionStatus;
  scheduled_date?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
  assignee_email?: string;
  return_reason?: string;
  approved_by?: string;
  approved_at?: string;
  reopened_by?: string;
  reopened_at?: string;
  reopen_reason?: string;
  schedule_id?: string;
  generated?: boolean;
}

export interface Deficiency {
  id: string;
  inspection_id: string;
  inspection_name?: string;
  title: string;
  description: string;
  severity: string;
  status: DeficiencyStatus;
  priority_tier: PriorityTier;
  previous_deficiency_id?: string | null;
  triage_state?: string;
  source_inspection_id?: string;
  source_inspection_date?: string;
  site_name?: string;
  structure_tag?: string;
  component_note?: string;
  location_desc?: string;
  photo_ids?: string[];
  created_at: string;
  updated_at: string;
  override_priority_tier?: string;
  override_justification?: string;
  override_by?: string;
  override_at?: string;
  remediation_status?: RemediationStatus;
  remediation_due_date?: string;
  verified_by?: string;
  verified_at?: string;
  assignee_name?: string;

  category?: string;
  equipment_type?: string;
  component?: string;
  sub_component?: string;
  focus_area?: string;
  deficiency_category?: string;
  detailed_description?: string;
  mechanisms?: string;
  vibration_present?: boolean;
  ndt_required?: boolean;
  further_investigation_required?: boolean;
  recommended_action?: string;
  consequence_severity?: number;
  likelihood?: string;
  most_affected_consequence?: string;
  risk_rank?: number;
  risk_rating?: string;
}

export interface PhotoRecord {
  id: string;
  deficiency_local_id: string;
  dataUrl: string;
  caption: string;
  purpose: 'evidence' | 'remediation_evidence';
  created_at: string;
  sync_state: SyncState;
  original_filename?: string;
  captured_at?: string;
  camera_make?: string;
  camera_model?: string;
  raw_exif_payload?: string;
  gps_latitude?: number;
  gps_longitude?: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'deficiency' | 'photo' | 'inspection_submit';
  payload: unknown;
  status: 'pending' | 'synced' | 'error';
  error?: string;
  created_at: string;
}

export interface TriageDecision {
  previous_deficiency_id: string;
  decision: 'new_unrelated' | 'resolved' | 'still_outstanding' | 'worsened';
  note?: string;
}

export interface Timesheet {
  id: string;
  user_id: string;
  project_id?: string;
  project_name?: string;
  inspection_id?: string;
  inspection_name?: string;
  structure_name?: string;
  client_id: string;
  entry_date: string;
  hours: number;
  work_type?: string;
  notes?: string;
  pre_inspection?: boolean;
  status: TimesheetStatus;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  user_name?: string;
}

export interface TimesheetGridCell {
  user_id: string;
  inspection_id: string;
  entries: Timesheet[];
  total_hours: number;
  status: TimesheetStatus | 'Mixed';
}

export interface TimesheetGridData {
  inspections: Array<{ inspection_id: string; inspection_name: string; project_name?: string; structure_name?: string }>;
  contractors: Array<{ user_id: string; user_name: string }>;
  cells: TimesheetGridCell[];
}

export interface ReportJob {
  id: string;
  project_id: string;
  project_name?: string;
  type: ReportOutputType;
  status: ReportJobStatus;
  requested_by: string;
  requested_by_name?: string;
  created_at: string;
  completed_at?: string;
  download_url?: string;
  error_message?: string;
}

export type PicklistType = 'component_type' | 'work_type' | 'structure_type';

export interface PicklistEntry {
  id: string;
  type: PicklistType;
  name: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  roles: UserRole[];
  children?: MenuItem[];
}

export interface FeatureFlag {
  id: FeatureFlagId;
  label: string;
  phase: 'P0' | 'P1' | 'P2';
  enabled: boolean;
}

export interface ReassignmentHistoryEntry {
  log_id: number;
  timestamp: string;
  old_inspector_id: string;
  new_inspector_id: string;
  reason: string;
  performed_by: string;
  performed_by_name: string;
  old_inspector_name: string;
  new_inspector_name: string;
}

export interface AuditLogEntry {
  log_id: number;
  table_name: string;
  record_id: string;
  action: string;
  old_values: unknown;
  new_values: unknown;
  performed_by: string;
  timestamp: string;
}

export interface AuditLogFilter {
  table_name?: string;
  record_id?: string;
  action?: string;
  performed_by?: string;
  start_date?: string;
  end_date?: string;
}

export interface PaginatedResult<T> {
  logs: T[];
  total: number;
  page: number;
  page_size: number;
}

export type ImportBatchStatus = 'Pending' | 'Validated' | 'Committed' | 'Discarded';

export interface ImportRow {
  id: string;
  project_title: string;
  site_name: string;
  asset_tag: string;
  structure_description: string;
  status: 'Valid' | 'Invalid';
  errors: string[];
}

export interface ImportBatch {
  id: string;
  batch_number: number;
  status: ImportBatchStatus;
  rows: ImportRow[];
  created_at: string;
  committed_at?: string;
  discarded_at?: string;
  valid_count: number;
  invalid_count: number;
}

export interface InspectionSchedule {
  id: string;
  structure_id: string;
  structure_name?: string;
  inspector_id: string;
  inspector_name?: string;
  interval_days: number;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthSession {
  token: string;
  refresh_token: string;
  user: User;
  expires_at: string;
  active_client_id?: string;
  hasUnsyncedWork?: boolean;
}

export interface SyncStateInfo {
  lastSync: string;
  pendingCount: number;
  status: SyncState;
}