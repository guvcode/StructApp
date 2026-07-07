import type { StructureAsset } from '../../types/index';

export const mockStructures: StructureAsset[] = [
  { id: 'str-harbor-main', site_id: 's-harbor-bridge', name: 'Main Suspension Cable', type: 'cable', identifier: 'CBL-001', created_at: '2025-03-20T00:00:00Z' },
  { id: 'str-harbor-pier1', site_id: 's-harbor-bridge', name: 'North Pier Foundation', type: 'foundation', identifier: 'FND-001', created_at: '2025-03-20T00:00:00Z' },
  { id: 'str-harbor-pier2', site_id: 's-harbor-bridge', name: 'South Pier Foundation', type: 'foundation', identifier: 'FND-002', created_at: '2025-03-20T00:00:00Z' },
  { id: 'str-approach-ramp', site_id: 's-harbor-approach', name: 'North Approach Ramp', type: 'ramp', identifier: 'RMP-001', created_at: '2025-03-20T00:00:00Z' },
  { id: 'str-tower-frame', site_id: 's-downtown-tower', name: 'Main Structural Frame', type: 'frame', identifier: 'FRM-001', created_at: '2025-04-25T00:00:00Z' },
  { id: 'str-tower-foundation', site_id: 's-downtown-tower', name: 'Foundation Slab', type: 'foundation', identifier: 'FND-003', created_at: '2025-04-25T00:00:00Z' },
  { id: 'str-plant-main', site_id: 's-river-plant', name: 'Main Processing Building Frame', type: 'frame', identifier: 'FRM-002', created_at: '2025-02-20T00:00:00Z' },
  { id: 'str-plant-roof', site_id: 's-river-plant', name: 'Processing Building Roof', type: 'roof', identifier: 'ROF-001', created_at: '2025-02-20T00:00:00Z' },
  { id: 'str-cooling-tower', site_id: 's-river-plant-cooling', name: 'Cooling Tower Structure', type: 'tower', identifier: 'TWR-001', created_at: '2025-02-20T00:00:00Z' },
  { id: 'str-plaza-deck', site_id: 's-meridian-plaza', name: 'Parking Deck Level 1', type: 'deck', identifier: 'DCK-001', created_at: '2025-01-10T00:00:00Z' },
  { id: 'str-ped-bridge', site_id: 's-riverside-park-1', name: 'Pedestrian Bridge Arch', type: 'arch', identifier: 'ARC-001', created_at: '2025-05-20T00:00:00Z' },
  { id: 'str-obs-tower', site_id: 's-riverside-park-2', name: 'Observation Tower Structure', type: 'tower', identifier: 'TWR-002', created_at: '2025-05-20T00:00:00Z' },
];

export function getStructureById(id: string): StructureAsset | undefined {
  return mockStructures.find(s => s.id === id);
}

export function getStructuresBySiteId(siteId: string): StructureAsset[] {
  return mockStructures.filter(s => s.site_id === siteId);
}