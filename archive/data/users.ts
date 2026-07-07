import type { User } from '../../types/index';
import { UserRole } from '../../types/index';

export const mockUsers: User[] = [
  {
    id: 'u-eleanor',
    email: 'eleanor@apex.com',
    display_name: 'Eleanor Vance',
    role: UserRole.inspector,
    is_active: true,
    client_memberships: [{ client_id: 'c-apex', client_role: 'primary' }],
  },
  {
    id: 'u-marcus',
    email: 'marcus@buildwell.com',
    display_name: 'Marcus Chen',
    role: UserRole.inspector,
    is_active: true,
    client_memberships: [{ client_id: 'c-buildwell', client_role: 'primary' }],
  },
  {
    id: 'u-priya',
    email: 'priya@structapp.com',
    display_name: 'Priya Sharma',
    role: UserRole.admin,
    is_active: true,
    client_memberships: [
      { client_id: 'c-apex', client_role: 'secondary' },
      { client_id: 'c-buildwell', client_role: 'secondary' },
      { client_id: 'c-skyline', client_role: 'secondary' },
    ],
  },
  {
    id: 'u-jamal',
    email: 'jamal@skyline.com',
    display_name: 'Jamal Williams',
    role: UserRole.owner,
    is_active: true,
    client_memberships: [{ client_id: 'c-skyline', client_role: 'primary' }],
  },
  {
    id: 'u-bob',
    email: 'bob@contractors.com',
    display_name: 'Bob Torres',
    role: UserRole.contractor,
    is_active: true,
    client_memberships: [{ client_id: 'c-apex', client_role: 'secondary' }],
  },
  {
    id: 'u-deactivated',
    email: 'old@user.com',
    display_name: 'Deactivated User',
    role: UserRole.inspector,
    is_active: false,
    client_memberships: [],
  },
];

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}