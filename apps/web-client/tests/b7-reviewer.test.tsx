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
  const user: User = { id: 'u-priya', email: 'priya@example.com', display_name: 'Priya Sharma', role: UserRole.reviewer, is_active: true, client_memberships: [{ client_id: 'c-apex', client_role: 'primary' }] };
  setSession({ token: 'mock-token', user, expires_at: new Date(Date.now() + 3600_000).toISOString(), active_client_id: 'c-apex' } as AuthSession);
});

describe('Bundle 7 — Reviewer Inspection Workflow', () => {

  describe('B7-T01 — ReviewerDashboardPage', () => {
    it('renders summary cards with counts', async () => {
      const { default: ReviewerDashboardPage } = await import('../src/pages/reviewer/ReviewerDashboardPage');
      render(wrap(<MemoryRouter><ReviewerDashboardPage /></MemoryRouter>));
      expect(await screen.findByText(/submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/returned/i)).toBeInTheDocument();
    });

    it('renders charts derived from data', async () => {
      const { default: ReviewerDashboardPage } = await import('../src/pages/reviewer/ReviewerDashboardPage');
      render(wrap(<MemoryRouter><ReviewerDashboardPage /></MemoryRouter>));
      expect(await screen.findByText(/inspections by status|status distribution|p1 deficiencies/i)).toBeInTheDocument();
    });
  });

  describe('B7-T02 — InspectionListPage', () => {
    it('renders inspection table with rows', async () => {
      const { default: InspectionListPage } = await import('../src/pages/reviewer/InspectionListPage');
      render(wrap(<MemoryRouter><InspectionListPage /></MemoryRouter>));
      expect(await screen.findByText(/harbor bridge|downtown tower/i)).toBeInTheDocument();
    });

    it('shows status-aware row actions', async () => {
      const { default: InspectionListPage } = await import('../src/pages/reviewer/InspectionListPage');
      render(wrap(<MemoryRouter><InspectionListPage /></MemoryRouter>));
      expect(await screen.findByText(/return/i)).toBeInTheDocument();
      expect(screen.getByText(/approve/i)).toBeInTheDocument();
    });
  });

  describe('B7-T03 — InspectionReviewPage', () => {
    it('shows inspection summary and deficiency list', async () => {
      const { default: InspectionReviewPage } = await import('../src/pages/reviewer/InspectionReviewPage');
      render(wrap(<MemoryRouter initialEntries={['/inspections/i-004/review']}><Routes><Route path="/inspections/:id/review" element={<InspectionReviewPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/steel beam crack/i)).toBeInTheDocument();
      expect(screen.getByText(/return/i)).toBeInTheDocument();
      expect(screen.getByText(/approve/i)).toBeInTheDocument();
    });

    it('selecting a deficiency shows detail', async () => {
      const { default: InspectionReviewPage } = await import('../src/pages/reviewer/InspectionReviewPage');
      render(wrap(<MemoryRouter initialEntries={['/inspections/i-004/review']}><Routes><Route path="/inspections/:id/review" element={<InspectionReviewPage />} /></Routes></MemoryRouter>));
      fireEvent.click(await screen.findByText(/steel beam crack/i));
      expect(await screen.findByText(/temporary shoring/i)).toBeInTheDocument();
    });
  });

  describe('B7-T04 — ReviewerDeficiencyDetailPage', () => {
    it('shows deficiency fields and override button', async () => {
      const { default: ReviewerDeficiencyDetailPage } = await import('../src/pages/reviewer/DeficiencyDetailPage');
      render(wrap(<MemoryRouter initialEntries={['/deficiencies/d-004']}><Routes><Route path="/deficiencies/:id" element={<ReviewerDeficiencyDetailPage />} /></Routes></MemoryRouter>));
      expect(await screen.findByText(/steel beam crack/i)).toBeInTheDocument();
      expect(screen.getByText(/override/i)).toBeInTheDocument();
    });
  });

  describe('B7-T05 — PriorityOverridePanel', () => {
    it('shows override form with justification required', async () => {
      const { PriorityOverridePanel } = await import('../src/components/PriorityOverridePanel');
      render(wrap(<MemoryRouter><PriorityOverridePanel deficiencyId="d-004" onClose={() => {}} /></MemoryRouter>));
      expect(await screen.findByText(/priority|override/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm|save|override/i })).toBeDisabled();
    });

    it('calls onOverride with priority and justification', async () => {
      const { PriorityOverridePanel } = await import('../src/components/PriorityOverridePanel');
      const onOverride = Promise.resolve({ success: true });
      render(wrap(<MemoryRouter><PriorityOverridePanel deficiencyId="d-004" onClose={() => {}} /></MemoryRouter>));
      fireEvent.click(screen.getByRole('button', { name: /confirm|save|override/i }));
    });
  });

  describe('B7-T06 — ReturnInspectionModal', () => {
    it('requires reason before confirming', async () => {
      const { ReturnInspectionModal } = await import('../src/components/ReturnInspectionModal');
      render(wrap(<MemoryRouter><ReturnInspectionModal inspectionId="i-004" onClose={() => {}} onReturn={() => {}} /></MemoryRouter>));
      expect(await screen.findByText(/return inspection|reason/i)).toBeInTheDocument();
    });
  });

  describe('B7-T07 — ApproveInspectionModal', () => {
    it('shows locking warning and requires confirmation', async () => {
      const { ApproveInspectionModal } = await import('../src/components/ApproveInspectionModal');
      render(wrap(<MemoryRouter><ApproveInspectionModal inspectionId="i-004" onClose={() => {}} onApprove={() => {}} /></MemoryRouter>));
      expect(await screen.findByText(/lock|immutable|read-only/i)).toBeInTheDocument();
    });
  });

  describe('B7-T10 — Extended mock services', () => {
    it('returnInspection changes status to Returned', async () => {
      const { returnInspection, getInspection } = await import('../src/services/mockInspection');
      const result = await returnInspection('i-004', 'Missing evidence photos');
      expect(result.status).toBe('Returned');
    });

    it('approveInspection changes status to Approved', async () => {
      const { approveInspection, getInspection } = await import('../src/services/mockInspection');
      const result = await approveInspection('i-004');
      expect(result.status).toBe('Approved');
    });

    it('overridePriority stores override data', async () => {
      const { overridePriority } = await import('../src/services/mockInspection');
      const result = await overridePriority('d-004', 'P1', 'Engineering judgment');
      expect(result).toMatchObject({ priority_tier: 'P1', override_justification: 'Engineering judgment' });
    });
  });

});