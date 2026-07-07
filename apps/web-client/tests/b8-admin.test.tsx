import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole } from '../src/types/index';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  clearSession();
  localStorage.clear();
});

function setAdminSession() {
  const user: User = { id: 'u-admin', email: 'admin@example.com', display_name: 'Admin User', role: UserRole.admin, is_active: true, client_memberships: [{ client_id: 'c-apex', client_role: 'primary' }] };
  setSession({ token: 'mock-token', user, expires_at: new Date(Date.now() + 3600_000).toISOString(), active_client_id: 'c-apex' } as AuthSession);
}

describe('Bundle 8 — Admin Reopen and Governance Controls', () => {

  describe('B8-T03 — reopenInspection mock service', () => {
    beforeEach(() => setAdminSession());

    beforeEach(async () => {
      const { mockInspections } = await import('../src/data/mock/inspections');
      const insp = mockInspections.find(i => i.id === 'i-008');
      if (insp) {
        insp.status = 'Approved' as any;
        delete (insp as any).reopened_by;
        delete (insp as any).reopened_at;
        delete (insp as any).reopen_reason;
      }
    });

    it('rejects non-Approved inspections', async () => {
      const { reopenInspection } = await import('../src/services/mockInspection');
      await expect(reopenInspection('i-004', 'Returned', 'Need corrections')).rejects.toThrow('Only Approved');
    });

    it('transitions Approved to Submitted', async () => {
      const { reopenInspection, getInspection } = await import('../src/services/mockInspection');
      await reopenInspection('i-008', 'Submitted', 'Additional review needed');
      const insp = await getInspection('i-008');
      expect(insp?.status).toBe('Submitted');
    });

    it('transitions Approved to Returned', async () => {
      const { reopenInspection, getInspection } = await import('../src/services/mockInspection');
      await reopenInspection('i-008', 'Returned', 'Send back to contractor');
      const insp = await getInspection('i-008');
      expect(insp?.status).toBe('Returned');
    });

    it('stores reopen audit fields', async () => {
      const { reopenInspection, getInspection } = await import('../src/services/mockInspection');
      await reopenInspection('i-008', 'Submitted', 'Missing documentation');
      const insp = await getInspection('i-008');
      expect(insp).toMatchObject({ reopened_by: 'Admin', reopen_reason: 'Missing documentation' });
      expect(insp?.reopened_at).toBeTruthy();
    });
  });

  describe('B8-T04/T06 — GovernanceMetadataPanel', () => {
    it('shows approve provenance', async () => {
      const { GovernanceMetadataPanel } = await import('../src/components/GovernanceMetadataPanel');
      render(<GovernanceMetadataPanel inspection={{ id: 'i-005', approved_by: 'Reviewer', approved_at: '2026-06-01T00:00:00Z', status: 'Approved' } as any} />);
      expect(await screen.findByText(/approved/i)).toBeInTheDocument();
      expect(screen.getByText(/Reviewer/)).toBeInTheDocument();
    });

    it('shows return provenance', async () => {
      const { GovernanceMetadataPanel } = await import('../src/components/GovernanceMetadataPanel');
      render(<GovernanceMetadataPanel inspection={{ id: 'i-004', status: 'Returned', return_reason: 'Missing evidence' } as any} />);
      expect(await screen.findByText(/returned/i)).toBeInTheDocument();
      expect(screen.getByText(/Missing evidence/)).toBeInTheDocument();
    });

    it('shows reopen provenance', async () => {
      const { GovernanceMetadataPanel } = await import('../src/components/GovernanceMetadataPanel');
      render(<GovernanceMetadataPanel inspection={{ id: 'i-005', reopened_by: 'Admin', reopened_at: '2026-06-02T00:00:00Z', reopen_reason: 'Fix data entry error', status: 'Submitted' } as any} />);
      expect(await screen.findByText(/reopened/i)).toBeInTheDocument();
      expect(screen.getByText(/Fix data entry error/)).toBeInTheDocument();
    });

    it('shows override provenance', async () => {
      const { GovernanceMetadataPanel } = await import('../src/components/GovernanceMetadataPanel');
      render(<GovernanceMetadataPanel deficiency={{ id: 'd-004', override_priority_tier: 'P1', override_justification: 'Re-evaluated risk', override_by: 'Reviewer', override_at: '2026-06-01T00:00:00Z' } as any} />);
      expect(await screen.findByText(/priority override/i)).toBeInTheDocument();
      expect(screen.getByText(/Re-evaluated risk/)).toBeInTheDocument();
    });

    it('shows empty state when no governance actions', async () => {
      const { GovernanceMetadataPanel } = await import('../src/components/GovernanceMetadataPanel');
      render(<GovernanceMetadataPanel inspection={{ id: 'i-001', status: 'InProgress' } as any} />);
      expect(await screen.findByText(/no governance actions/i)).toBeInTheDocument();
    });
  });

  describe('B8-T01 — ReopenInspectionModal', () => {
    it('requires reason and confirmation before reopening', async () => {
      const { ReopenInspectionModal } = await import('../src/components/ReopenInspectionModal');
      render(<MemoryRouter><ReopenInspectionModal inspectionId="i-005" onClose={() => {}} onReopen={() => {}} /></MemoryRouter>);
      expect(await screen.findByText(/reopen inspection/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm|reopen/i })).toBeDisabled();
    });
  });

  describe('B8-T02 — Admin Reopen button on InspectionReviewPage', () => {
    it('shows Reopen button for Admin on Approved inspection', async () => {
      setAdminSession();
      const { default: InspectionReviewPage } = await import('../src/pages/reviewer/InspectionReviewPage');
      render(wrap(<MemoryRouter initialEntries={['/inspections/i-005/review']}><Routes><Route path="/inspections/:id/review" element={<InspectionReviewPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/reopen inspection/i)).toBeInTheDocument();
    });
  });

  describe('B8-T05 — ForbiddenPage and NotFoundPage', () => {
    it('ForbiddenPage shows navigation links', async () => {
      const { default: ForbiddenPage } = await import('../src/pages/ForbiddenPage');
      render(<MemoryRouter><ForbiddenPage /></MemoryRouter>);
      expect(await screen.findByText(/403/)).toBeInTheDocument();
      expect(screen.getByText(/go to home/i)).toBeInTheDocument();
    });

    it('NotFoundPage shows navigation links', async () => {
      const { default: NotFoundPage } = await import('../src/pages/NotFoundPage');
      render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
      expect(await screen.findByText(/404/)).toBeInTheDocument();
      expect(screen.getByText(/go to home/i)).toBeInTheDocument();
    });
  });

});
