import { useQuery } from '@tanstack/react-query';
import * as apiClients from '../services/api/clients';
import * as apiUsers from '../services/api/users';
import * as apiRegister from '../services/api/register';
import * as apiInspections from '../services/api/inspections';
import * as apiDeficiencies from '../services/api/deficiencies';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const [clients, users] = await Promise.all([
        apiClients.getClients(),
        apiUsers.getUsers(),
      ]);
      return { clients, users, clientCount: clients.length, userCount: users.length };
    },
  });
}

export function useReviewerDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'reviewer'],
    queryFn: async () => {
      const [inspections, deficiencies] = await Promise.all([
        apiInspections.getInspections(),
        apiDeficiencies.getDeficiencies(),
      ]);
      const submitted = inspections.filter(i => i.status === 'Submitted');
      const approved = inspections.filter(i => i.status === 'Approved');
      const returned = inspections.filter(i => i.status === 'Returned');
      const p1Count = deficiencies.filter(d => d.priority_tier === 'P1').length;
      return { inspections, deficiencies, submitted, approved, returned, p1Count };
    },
  });
}

export function useRegisterLandingStats() {
  return useQuery({
    queryKey: ['dashboard', 'register'],
    queryFn: async () => {
      const [projects, sites, structures] = await Promise.all([
        apiRegister.getProjects(),
        apiRegister.getSites(),
        apiRegister.getStructures(),
      ]);
      return { projects, sites, structures };
    },
  });
}