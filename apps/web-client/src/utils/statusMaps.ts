export const INSPECTION_STATUS_STYLES: Record<string, string> = {
  Submitted: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  Approved: 'bg-green-50 text-green-700 border border-green-200',
  Returned: 'bg-red-50 text-red-700 border border-red-200',
  InProgress: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  Draft: 'bg-gray-50 text-gray-600 border border-gray-200',
  Assigned: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export const TIMESHEET_STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-50 text-gray-700 border border-gray-200',
  Submitted: 'bg-blue-50 text-blue-700 border border-blue-200',
  Approved: 'bg-green-50 text-green-700 border border-green-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
};

export const PROJECT_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  'on-hold': 'bg-yellow-100 text-yellow-700',
};

export const REMEDIATION_STATUS_STYLES: Record<string, string> = {
  Open: 'bg-gray-50 text-gray-700 border border-gray-200',
  Remediation_Scheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
  Remediated_Pending_Verification: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  Verified_Closed: 'bg-green-50 text-green-700 border border-green-200',
};

export const REPORT_STATUS_STYLES: Record<string, string> = {
  Queued: 'bg-gray-50 text-gray-600 border border-gray-200',
  Processing: 'bg-blue-50 text-blue-700 border border-blue-200',
  Ready: 'bg-green-50 text-green-700 border border-green-200',
  Failed: 'bg-red-50 text-red-700 border border-red-200',
};

export const PRIORITY_STYLES: Record<string, string> = {
  P1: 'bg-red-50 text-red-700 border border-red-200',
  P2: 'bg-orange-50 text-orange-700 border border-orange-200',
  P3: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  P4: 'bg-blue-50 text-blue-700 border border-blue-200',
  P5: 'bg-gray-50 text-gray-600 border border-gray-200',
};

export const RISK_RATING_STYLES: Record<string, string> = {
  High: 'bg-red-50 text-red-700 border border-red-200',
  Medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  Low: 'bg-green-50 text-green-700 border border-green-200',
};