import type { Client } from '../../types/index';

export const mockClients: Client[] = [
  {
    id: 'c-apex',
    name: 'Apex Construction',
    slug: 'apex-construction',
    safety_email: 'safety@apex.com',
    is_active: true,
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'c-buildwell',
    name: 'BuildWell Corp',
    slug: 'buildwell-corp',
    safety_email: 'safety@buildwell.com',
    is_active: true,
    created_at: '2025-02-01T00:00:00Z',
  },
  {
    id: 'c-skyline',
    name: 'Skyline Properties',
    slug: 'skyline-properties',
    safety_email: 'safety@skyline.com',
    is_active: true,
    created_at: '2025-03-10T00:00:00Z',
  },
];

export function getClientById(id: string): Client | undefined {
  return mockClients.find(c => c.id === id);
}