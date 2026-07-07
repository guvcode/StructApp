import type { InspectionSchedule, Inspection } from '../types/index';
import { mockInspections } from '../data/mock/inspections';

function delay(ms = 40): Promise<number> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 30));
}

let nextId = 100;

export const mockSchedules: InspectionSchedule[] = [];

export function seedSchedules(): void {
  mockSchedules.length = 0;
  const now = new Date();
  const july = new Date(now.getFullYear(), 6, 1);
  mockSchedules.push(
    { id: 'sched-1', structure_id: 'str-harbor-main', structure_name: 'Harbor Main Span', inspector_id: 'u-eleanor', inspector_name: 'Eleanor Vance', interval_days: 90, next_due_date: july.toISOString().slice(0, 10), is_active: true, created_at: new Date(now.getTime() - 86400000 * 30).toISOString() },
    { id: 'sched-2', structure_id: 'str-harbor-pier1', structure_name: 'Harbor Pier 1', inspector_id: 'u-marcus', inspector_name: 'Marcus Chen', interval_days: 180, next_due_date: new Date(july.getTime() + 86400000 * 14).toISOString().slice(0, 10), is_active: true, created_at: new Date(now.getTime() - 86400000 * 60).toISOString() },
    { id: 'sched-3', structure_id: 'str-tower-frame', structure_name: 'Tower Frame', inspector_id: 'u-eleanor', inspector_name: 'Eleanor Vance', interval_days: 365, next_due_date: new Date(july.getTime() + 86400000 * 30).toISOString().slice(0, 10), is_active: false, created_at: new Date(now.getTime() - 86400000 * 90).toISOString() },
  );
}

const mockUsers = [
  { id: 'inspector-1', name: 'Eleanor Vance' },
  { id: 'inspector-2', name: 'Marcus Chen' },
  { id: 'inspector-3', name: 'Sarah Park' },
];

import { InspectionStatus } from '../types/index';

export const mockCalendarInspections: Inspection[] = [];

function seedCalendarInspections(): void {
  mockCalendarInspections.length = 0;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dayInspections = [
    { day: 1, count: 2, assignees: ['inspector-1', 'inspector-2'], generated: false },
    { day: 3, count: 1, assignees: ['inspector-1'], generated: true },
    { day: 5, count: 1, assignees: ['inspector-3'], generated: false },
    { day: 8, count: 3, assignees: ['inspector-1', 'inspector-2', 'inspector-3'], generated: false },
    { day: 10, count: 1, assignees: ['inspector-2'], generated: true },
    { day: 12, count: 2, assignees: ['inspector-1', 'inspector-3'], generated: false },
    { day: 15, count: 2, assignees: ['inspector-2', 'inspector-1'], generated: true },
    { day: 18, count: 1, assignees: ['inspector-3'], generated: false },
    { day: 20, count: 2, assignees: ['inspector-1', 'inspector-2'], generated: false },
    { day: 22, count: 1, assignees: ['inspector-2'], generated: true },
    { day: 25, count: 2, assignees: ['inspector-3', 'inspector-1'], generated: false },
    { day: 28, count: 1, assignees: ['inspector-1'], generated: true },
    { day: 30, count: 2, assignees: ['inspector-2', 'inspector-3'], generated: false },
  ];
  for (const di of dayInspections) {
    for (let i = 0; i < di.count; i++) {
      const dt = new Date(year, month, di.day);
      const inspectorId = di.assignees[i % di.assignees.length]!;
      const inspectorName = mockUsers.find(u => u.id === inspectorId)?.name ?? 'Unknown';
      mockCalendarInspections.push({
        id: `cal-ins-${year}${String(month + 1).padStart(2, '0')}${String(di.day).padStart(2, '0')}-${i}`,
        site_id: 's-demo',
        structure_id: `str-demo-${di.day}`,
        assigned_to: inspectorId,
        assigned_by: 'admin',
        status: 'Assigned' as InspectionStatus,
        scheduled_date: dt.toISOString().slice(0, 10),
        created_at: dt.toISOString(),
        updated_at: dt.toISOString(),
        assignee_name: inspectorName,
        generated: di.generated,
      });
    }
  }
}

export async function getSchedules(): Promise<InspectionSchedule[]> {
  await delay();
  return [...mockSchedules];
}

export async function getSchedule(id: string): Promise<InspectionSchedule | undefined> {
  await delay(20);
  return mockSchedules.find(s => s.id === id);
}

export async function createSchedule(input: {
  structure_id: string;
  inspector_id: string;
  interval_days: number;
  next_due_date: string;
}): Promise<InspectionSchedule> {
  await delay(30);
  const inspector = mockUsers.find(u => u.id === input.inspector_id);
  const schedule: InspectionSchedule = {
    id: `sched-${nextId++}`,
    structure_id: input.structure_id,
    structure_name: `Structure ${input.structure_id.slice(-4)}`,
    inspector_id: input.inspector_id,
    inspector_name: inspector?.name ?? 'Unknown',
    interval_days: input.interval_days,
    next_due_date: input.next_due_date,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  mockSchedules.push(schedule);
  return schedule;
}

export async function updateSchedule(id: string, input: Partial<{
  inspector_id: string;
  interval_days: number;
  next_due_date: string;
}>): Promise<InspectionSchedule> {
  await delay(20);
  const schedule = mockSchedules.find(s => s.id === id);
  if (!schedule) throw new Error('Schedule not found');
  if (input.inspector_id) {
    schedule.inspector_id = input.inspector_id;
    schedule.inspector_name = mockUsers.find(u => u.id === input.inspector_id)?.name ?? 'Unknown';
  }
  if (input.interval_days !== undefined) schedule.interval_days = input.interval_days;
  if (input.next_due_date) schedule.next_due_date = input.next_due_date;
  return schedule;
}

export async function toggleSchedulePause(id: string): Promise<InspectionSchedule> {
  await delay(20);
  const schedule = mockSchedules.find(s => s.id === id);
  if (!schedule) throw new Error('Schedule not found');
  schedule.is_active = !schedule.is_active;
  return schedule;
}

export async function getCalendarInspections(year: number, month: number, inspectorId?: string): Promise<Inspection[]> {
  await delay();
  if (mockCalendarInspections.length === 0) seedCalendarInspections();
  let result = mockCalendarInspections.filter(ins => {
    if (!ins.scheduled_date) return false;
    const parts = ins.scheduled_date.split('-').map(Number);
    const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  if (inspectorId) {
    result = result.filter(ins => ins.assigned_to === inspectorId);
  }
  return result;
}

export async function rescheduleInspection(id: string, newDate: string): Promise<Inspection> {
  await delay(20);
  const ins = mockCalendarInspections.find(i => i.id === id) ?? mockInspections.find(i => i.id === id);
  if (!ins) throw new Error('Inspection not found');
  ins.scheduled_date = newDate;
  return ins;
}

export async function reassignInspection(id: string, newInspectorId: string): Promise<Inspection> {
  await delay(20);
  const ins = mockCalendarInspections.find(i => i.id === id) ?? mockInspections.find(i => i.id === id);
  if (!ins) throw new Error('Inspection not found');
  ins.assigned_to = newInspectorId;
  ins.assignee_name = mockUsers.find(u => u.id === newInspectorId)?.name ?? 'Unknown';
  return ins;
}

seedSchedules();