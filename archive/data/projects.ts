import type { Project } from '../../types/index';

export const mockProjects: Project[] = [
  {
    id: 'p-bridge-1',
    client_id: 'c-apex',
    name: 'Harbor Bridge Inspection',
    code: 'APX-HBI-2025',
    status: 'active',
    region: 'Northeast',
    start_date: '2025-04-01',
    created_at: '2025-03-15T00:00:00Z',
  },
  {
    id: 'p-tower-1',
    client_id: 'c-apex',
    name: 'Downtown Tower Assessment',
    code: 'APX-DTA-2025',
    status: 'active',
    region: 'Northeast',
    start_date: '2025-05-01',
    created_at: '2025-04-20T00:00:00Z',
  },
  {
    id: 'p-plant-1',
    client_id: 'c-buildwell',
    name: 'River Plant Structural Audit',
    code: 'BW-RPS-2025',
    status: 'active',
    region: 'Midwest',
    start_date: '2025-03-01',
    created_at: '2025-02-15T00:00:00Z',
  },
  {
    id: 'p-plaza-1',
    client_id: 'c-buildwell',
    name: 'Meridian Plaza Garage Review',
    code: 'BW-MPG-2025',
    status: 'completed',
    region: 'Midwest',
    start_date: '2025-01-15',
    end_date: '2025-06-01',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'p-park-1',
    client_id: 'c-skyline',
    name: 'Riverside Park Structures',
    code: 'SKY-RPS-2025',
    status: 'active',
    region: 'West',
    start_date: '2025-06-01',
    created_at: '2025-05-15T00:00:00Z',
  },
];

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find(p => p.id === id);
}

export function getProjectsByClientId(clientId: string): Project[] {
  return mockProjects.filter(p => p.client_id === clientId);
}