import type { Site } from '../../types/index';

export const mockSites: Site[] = [
  {
    id: 's-harbor-bridge',
    project_id: 'p-bridge-1',
    name: 'Harbor Bridge — Main Span',
    address: '100 Harbor Blvd, Boston, MA',
    coordinates: { lat: 42.3601, lng: -71.0589 },
    status: 'active',
    created_at: '2025-03-20T00:00:00Z',
  },
  {
    id: 's-harbor-approach',
    project_id: 'p-bridge-1',
    name: 'Harbor Bridge — North Approach',
    address: '50 Harbor Blvd, Boston, MA',
    coordinates: { lat: 42.3650, lng: -71.0600 },
    status: 'active',
    created_at: '2025-03-20T00:00:00Z',
  },
  {
    id: 's-downtown-tower',
    project_id: 'p-tower-1',
    name: 'Downtown Tower — Main Structure',
    address: '200 Main St, Boston, MA',
    coordinates: { lat: 42.3550, lng: -71.0650 },
    status: 'active',
    created_at: '2025-04-25T00:00:00Z',
  },
  {
    id: 's-river-plant',
    project_id: 'p-plant-1',
    name: 'River Plant — Processing Building',
    address: '1 Industrial Pkwy, St. Louis, MO',
    coordinates: { lat: 38.6270, lng: -90.1994 },
    status: 'active',
    created_at: '2025-02-20T00:00:00Z',
  },
  {
    id: 's-river-plant-cooling',
    project_id: 'p-plant-1',
    name: 'River Plant — Cooling Tower',
    address: '1 Industrial Pkwy, St. Louis, MO',
    coordinates: { lat: 38.6280, lng: -90.2000 },
    status: 'active',
    created_at: '2025-02-20T00:00:00Z',
  },
  {
    id: 's-meridian-plaza',
    project_id: 'p-plaza-1',
    name: 'Meridian Plaza — Parking Garage',
    address: '500 Meridian Ave, Chicago, IL',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    status: 'completed',
    created_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 's-riverside-park-1',
    project_id: 'p-park-1',
    name: 'Riverside Park — Pedestrian Bridge',
    address: '300 River Rd, Denver, CO',
    coordinates: { lat: 39.7392, lng: -104.9903 },
    status: 'active',
    created_at: '2025-05-20T00:00:00Z',
  },
  {
    id: 's-riverside-park-2',
    project_id: 'p-park-1',
    name: 'Riverside Park — Observation Tower',
    address: '320 River Rd, Denver, CO',
    coordinates: { lat: 39.7400, lng: -104.9910 },
    status: 'active',
    created_at: '2025-05-20T00:00:00Z',
  },
];

export function getSiteById(id: string): Site | undefined {
  return mockSites.find(s => s.id === id);
}

export function getSitesByProjectId(projectId: string): Site[] {
  return mockSites.filter(s => s.project_id === projectId);
}