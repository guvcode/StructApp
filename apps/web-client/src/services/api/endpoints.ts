const API_BASE = '/api/v1';

const BASE_URL = (() => {
  const url = import.meta.env.VITE_API_URL;
  if (url) return `${url}${API_BASE}`;
  const port = import.meta.env.VITE_API_PORT;
  return port ? `http://localhost:${port}${API_BASE}` : API_BASE;
})();

export const ENDPOINTS = {
  auth: {
    login: `${BASE_URL}/auth/login`,
    refresh: `${BASE_URL}/auth/refresh`,
    invite: `${BASE_URL}/auth/invite`,
    activate: `${BASE_URL}/auth/activate`,
    switchClient: `${BASE_URL}/auth/switch-client`,
    forgotPassword: `${BASE_URL}/auth/forgot-password`,
    resetPassword: `${BASE_URL}/auth/reset-password`,
    pin: `${BASE_URL}/auth/pin`,
  },
  users: {
    list: `${BASE_URL}/users`,
    byId: (id: string) => `${BASE_URL}/users/${id}`,
    update: (id: string) => `${BASE_URL}/users/${id}`,
    deactivate: (id: string) => `${BASE_URL}/users/${id}/deactivate`,
    byRole: (role: string) => `${BASE_URL}/users?role=${role}`,
    resendInvite: (id: string) => `${BASE_URL}/users/${id}/resend-invite`,
    inviteLink: (id: string) => `${BASE_URL}/users/${id}/invite-link`,
    revokeInvite: (id: string) => `${BASE_URL}/users/${id}/revoke-invite`,
    resetPassword: (id: string) => `${BASE_URL}/users/${id}/reset-password`,
    resetPin: (id: string) => `${BASE_URL}/users/${id}/reset-pin`,
  },
  clients: {
    list: `${BASE_URL}/clients`,
    mine: `${BASE_URL}/clients/mine`,
    withAssignedInspections: `${BASE_URL}/clients/with-assigned-inspections`,
    byId: (id: string) => `${BASE_URL}/clients/${id}`,
    create: `${BASE_URL}/clients`,
    update: (id: string) => `${BASE_URL}/clients/${id}`,
    projects: (id: string) => `${BASE_URL}/clients/${id}/projects`,
  },
  projects: {
    list: `${BASE_URL}/projects`,
    byId: (id: string) => `${BASE_URL}/projects/${id}`,
    create: `${BASE_URL}/projects`,
    update: (id: string) => `${BASE_URL}/projects/${id}`,
  },
  sites: {
    list: `${BASE_URL}/sites`,
    byId: (id: string) => `${BASE_URL}/sites/${id}`,
    create: `${BASE_URL}/sites`,
    update: (id: string) => `${BASE_URL}/sites/${id}`,
  },
  structures: {
    list: `${BASE_URL}/structures`,
    byId: (id: string) => `${BASE_URL}/structures/${id}`,
    create: `${BASE_URL}/structures`,
    update: (id: string) => `${BASE_URL}/structures/${id}`,
    search: (q: string) => `${BASE_URL}/structures/search?q=${encodeURIComponent(q)}`,
  },
  inspections: {
    list: `${BASE_URL}/inspections`,
    byId: (id: string) => `${BASE_URL}/inspections/${id}`,
    bySite: (siteId: string) => `${BASE_URL}/inspections?site_id=${siteId}`,
    byAssignee: (userId: string) => `${BASE_URL}/inspections?assignee=${userId}`,
    create: `${BASE_URL}/inspections`,
    submit: (id: string) => `${BASE_URL}/inspections/${id}/submit`,
    approve: (id: string) => `${BASE_URL}/inspections/${id}/approve`,
    return_: (id: string) => `${BASE_URL}/inspections/${id}/return`,
    reopen: (id: string) => `${BASE_URL}/inspections/${id}/reopen`,
    reschedule: (id: string) => `${BASE_URL}/inspections/${id}/reschedule`,
    reassign: (id: string) => `${BASE_URL}/inspections/${id}/reassign`,
    bulkReassign: `${BASE_URL}/inspections/bulk-reassign`,
    updateMode: (id: string) => `${BASE_URL}/inspections/${id}/inspection-mode`,
  },
  deficiencies: {
    list: `${BASE_URL}/deficiencies`,
    byId: (id: string) => `${BASE_URL}/deficiencies/${id}`,
    byInspection: (inspectionId: string) => `${BASE_URL}/deficiencies?inspection_id=${inspectionId}`,
    create: (inspectionId: string) => `${BASE_URL}/inspections/${inspectionId}/deficiencies`,
    update: (id: string) => `${BASE_URL}/deficiencies/${id}`,
    overridePriority: (id: string) => `${BASE_URL}/deficiencies/${id}/override-priority`,
    updateComponentNotes: (id: string) => `${BASE_URL}/deficiencies/${id}/component-notes`,
    verifyClosure: (id: string) => `${BASE_URL}/deficiencies/${id}/verify-closure`,
  },
  remediation: {
    list: `${BASE_URL}/remediation/deficiencies`,
    byId: (id: string) => `${BASE_URL}/remediation/deficiencies/${id}`,
    updateStatus: (id: string) => `${BASE_URL}/remediation/deficiencies/${id}/status`,
    photos: (id: string) => `${BASE_URL}/remediation/deficiencies/${id}/photos`,
    addPhoto: (id: string) => `${BASE_URL}/remediation/deficiencies/${id}/photos`,
    hasEvidence: (id: string) => `${BASE_URL}/remediation/deficiencies/${id}/has-evidence`,
  },
  timesheets: {
    list: `${BASE_URL}/timesheets`,
    byId: (id: string) => `${BASE_URL}/timesheets/${id}`,
    create: `${BASE_URL}/timesheets`,
    update: (id: string) => `${BASE_URL}/timesheets/${id}`,
    submit: (id: string) => `${BASE_URL}/timesheets/${id}/submit`,
    delete: (id: string) => `${BASE_URL}/timesheets/${id}`,
    approve: (id: string) => `${BASE_URL}/timesheets/${id}/approve`,
    reject: (id: string) => `${BASE_URL}/timesheets/${id}/reject`,
    groups: `${BASE_URL}/timesheets/groups`,
    approveGroup: (groupId: string) => `${BASE_URL}/timesheets/groups/${groupId}/approve`,
    rejectGroup: (groupId: string) => `${BASE_URL}/timesheets/groups/${groupId}/reject`,
  },
  reports: {
    jobs: `${BASE_URL}/reports/jobs`,
    byId: (id: string) => `${BASE_URL}/reports/jobs/${id}`,
    generate: `${BASE_URL}/reports/generate`,
    retry: (id: string) => `${BASE_URL}/reports/jobs/${id}/retry`,
  },
  sync: {
    state: `${BASE_URL}/sync/state`,
    push: `${BASE_URL}/sync/push-outbox`,
    pull: `${BASE_URL}/sync/pull-package`,
  },
  picklists: {
    byType: (type: 'component-types' | 'work-types' | 'structure-types') => `${BASE_URL}/${type}`,
    item: (type: 'component-types' | 'work-types' | 'structure-types', id: string) => `${BASE_URL}/${type}/${id}`,
  },
  taxonomy: {
    list: `${BASE_URL}/taxonomy`,
    create: `${BASE_URL}/taxonomy`,
    update: (id: string) => `${BASE_URL}/taxonomy/${id}`,
  },
  auditLogs: {
    list: `${BASE_URL}/audit-logs`,
  },
  imports: {
    batches: `${BASE_URL}/imports/batches`,
    batchById: (id: string) => `${BASE_URL}/imports/batches/${id}`,
    upload: `${BASE_URL}/imports/upload`,
    commit: (id: string) => `${BASE_URL}/imports/batches/${id}/commit`,
    discard: (id: string) => `${BASE_URL}/imports/batches/${id}/discard`,
  },
  clientErrors: {
    post: `${BASE_URL}/client-errors`,
  },
  jobErrors: {
    list: `${BASE_URL}/job-errors`,
    dismiss: (id: string) => `${BASE_URL}/job-errors/${id}/dismiss`,
  },
  calendar: {
    schedules: `${BASE_URL}/schedules`,
    scheduleById: (id: string) => `${BASE_URL}/schedules/${id}`,
    togglePause: (id: string) => `${BASE_URL}/schedules/${id}/toggle-pause`,
  },
};