import type { Inspection } from '../../types/index';
import { InspectionStatus } from '../../types/index';

export const mockInspections: Inspection[] = [
  { id: 'i-001', site_id: 's-harbor-bridge', structure_id: 'str-harbor-main', client_id: 'client-1', assigned_to: 'u-eleanor', assigned_by: 'u-priya', status: InspectionStatus.InProgress, scheduled_date: '2025-06-10', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z', assignee_name: 'Eleanor Vance' },
  { id: 'i-002', site_id: 's-harbor-bridge', structure_id: 'str-harbor-pier1', client_id: 'client-1', assigned_to: 'u-eleanor', assigned_by: 'u-priya', status: InspectionStatus.Draft, scheduled_date: '2025-06-15', created_at: '2025-06-02T00:00:00Z', updated_at: '2025-06-02T00:00:00Z', assignee_name: 'Eleanor Vance' },
  { id: 'i-003', site_id: 's-harbor-approach', client_id: 'client-1', assigned_to: 'u-marcus', assigned_by: 'u-priya', status: InspectionStatus.Assigned, scheduled_date: '2025-06-12', created_at: '2025-06-03T00:00:00Z', updated_at: '2025-06-03T00:00:00Z', assignee_name: 'Marcus Chen' },
  { id: 'i-004', site_id: 's-downtown-tower', structure_id: 'str-tower-frame', client_id: 'client-1', assigned_to: 'u-eleanor', assigned_by: 'u-priya', status: InspectionStatus.Submitted, scheduled_date: '2025-06-05', submitted_at: '2025-06-08T00:00:00Z', created_at: '2025-05-20T00:00:00Z', updated_at: '2025-06-08T00:00:00Z', assignee_name: 'Eleanor Vance' },
  { id: 'i-005', site_id: 's-downtown-tower', structure_id: 'str-tower-foundation', client_id: 'client-1', assigned_to: 'u-marcus', assigned_by: 'u-priya', status: InspectionStatus.Approved, scheduled_date: '2025-05-25', submitted_at: '2025-05-28T00:00:00Z', created_at: '2025-05-10T00:00:00Z', updated_at: '2025-06-01T00:00:00Z', assignee_name: 'Marcus Chen' },
  { id: 'i-006', site_id: 's-river-plant', structure_id: 'str-plant-main', client_id: 'client-1', assigned_to: 'u-marcus', assigned_by: 'u-priya', status: InspectionStatus.InProgress, scheduled_date: '2025-06-08', created_at: '2025-05-15T00:00:00Z', updated_at: '2025-06-07T00:00:00Z', assignee_name: 'Marcus Chen' },
  { id: 'i-007', site_id: 's-river-plant-cooling', structure_id: 'str-cooling-tower', client_id: 'client-1', assigned_to: 'u-eleanor', assigned_by: 'u-priya', status: InspectionStatus.Draft, scheduled_date: '2025-06-20', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z', assignee_name: 'Eleanor Vance' },
  { id: 'i-008', site_id: 's-meridian-plaza', client_id: 'client-2', assigned_to: 'u-marcus', assigned_by: 'u-priya', status: InspectionStatus.Approved, scheduled_date: '2025-04-10', submitted_at: '2025-04-15T00:00:00Z', created_at: '2025-03-20T00:00:00Z', updated_at: '2025-04-20T00:00:00Z', assignee_name: 'Marcus Chen' },
  { id: 'i-009', site_id: 's-riverside-park-1', structure_id: 'str-ped-bridge', client_id: 'client-1', assigned_to: 'u-eleanor', assigned_by: 'u-priya', status: InspectionStatus.Assigned, scheduled_date: '2025-06-22', created_at: '2025-06-10T00:00:00Z', updated_at: '2025-06-10T00:00:00Z', assignee_name: 'Eleanor Vance' },
  { id: 'i-010', site_id: 's-riverside-park-2', structure_id: 'str-obs-tower', client_id: 'client-1', assigned_to: 'u-marcus', assigned_by: 'u-priya', status: InspectionStatus.Returned, scheduled_date: '2025-05-30', created_at: '2025-05-15T00:00:00Z', updated_at: '2025-06-05T00:00:00Z', assignee_name: 'Marcus Chen' },
];

export function getInspectionById(id: string): Inspection | undefined {
  return mockInspections.find(i => i.id === id);
}

export function getInspectionsBySiteId(siteId: string): Inspection[] {
  return mockInspections.filter(i => i.site_id === siteId);
}

export function getInspectionsByAssignee(userId: string): Inspection[] {
  return mockInspections.filter(i => i.assigned_to === userId);
}