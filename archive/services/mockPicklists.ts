import type { PicklistEntry, PicklistType } from '../types/index';

function delay(ms = 40): Promise<number> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 30));
}

export const mockPicklistItems: PicklistEntry[] = [
  { id: 'ct-1', type: 'component_type', name: 'Girder', isActive: true },
  { id: 'ct-2', type: 'component_type', name: 'Column', isActive: true },
  { id: 'ct-3', type: 'component_type', name: 'Bearing', isActive: true },
  { id: 'ct-4', type: 'component_type', name: 'Deck', isActive: true },
  { id: 'ct-5', type: 'component_type', name: 'Abutment', isActive: true },
  { id: 'ct-6', type: 'component_type', name: 'Pier', isActive: true },
  { id: 'ct-7', type: 'component_type', name: 'Rail System', isActive: false },
  { id: 'ct-8', type: 'component_type', name: 'Expansion Joint', isActive: false },
  { id: 'wt-1', type: 'work_type', name: 'Field Inspection', isActive: true },
  { id: 'wt-2', type: 'work_type', name: 'Report Writing', isActive: true },
  { id: 'wt-3', type: 'work_type', name: 'Equipment Check', isActive: true },
  { id: 'wt-4', type: 'work_type', name: 'Data Review', isActive: true },
  { id: 'wt-5', type: 'work_type', name: 'Client Meeting', isActive: true },
  { id: 'wt-6', type: 'work_type', name: 'Site Survey', isActive: true },
  { id: 'wt-7', type: 'work_type', name: 'Drone Inspection', isActive: false },
  { id: 'wt-8', type: 'work_type', name: 'Load Testing', isActive: false },
  { id: 'st-1', type: 'structure_type', name: 'Bridge', isActive: true },
  { id: 'st-2', type: 'structure_type', name: 'Tunnel', isActive: true },
  { id: 'st-3', type: 'structure_type', name: 'Overpass', isActive: true },
  { id: 'st-4', type: 'structure_type', name: 'Retaining Wall', isActive: true },
  { id: 'st-5', type: 'structure_type', name: 'Culvert', isActive: false },
  { id: 'st-6', type: 'structure_type', name: 'Sign Gantry', isActive: false },
];

export async function getPicklistEntries(type: PicklistType): Promise<PicklistEntry[]> {
  await delay();
  return mockPicklistItems.filter(i => i.type === type);
}

export async function addPicklistItem(type: PicklistType, name: string): Promise<PicklistEntry> {
  await delay(30);
  const prefix = type === 'component_type' ? 'ct' : type === 'work_type' ? 'wt' : 'st';
  const entry: PicklistEntry = {
    id: `${prefix}-${Date.now()}`,
    type,
    name,
    isActive: true,
  };
  mockPicklistItems.push(entry);
  return entry;
}

export async function renamePicklistItem(id: string, name: string): Promise<PicklistEntry> {
  await delay(20);
  const item = mockPicklistItems.find(i => i.id === id);
  if (!item) throw new Error('Picklist item not found');
  item.name = name;
  return item;
}

export async function deactivatePicklistItem(id: string): Promise<PicklistEntry> {
  await delay(20);
  const item = mockPicklistItems.find(i => i.id === id);
  if (!item) throw new Error('Picklist item not found');
  item.isActive = false;
  return item;
}

export async function reactivatePicklistItem(id: string): Promise<PicklistEntry> {
  await delay(20);
  const item = mockPicklistItems.find(i => i.id === id);
  if (!item) throw new Error('Picklist item not found');
  item.isActive = true;
  return item;
}