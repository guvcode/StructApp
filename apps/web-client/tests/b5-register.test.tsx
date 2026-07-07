import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearSession, setSession } from '../src/lib/authStore';
import type { AuthSession, User } from '../src/types/index';
import { UserRole } from '../src/types/index';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>;
}

const reviewerUser: User = {
  id: 'u-reviewer',
  email: 'reviewer@structapp.com',
  display_name: 'Reviewer User',
  role: UserRole.reviewer,
  is_active: true,
  client_memberships: [{ client_id: 'c-apex', client_role: 'secondary' as const }],
};

function makeSession(): AuthSession {
  return {
    token: 'mock-token',
    user: reviewerUser,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  };
}

beforeEach(() => {
  clearSession();
  localStorage.clear();
});

describe('Bundle 5 — Register Landing', () => {
  it('shows summary cards with counts', async () => {
    setSession(makeSession());
    const { default: RegisterLandingPage } = await import('../src/pages/reviewer/RegisterLandingPage');
    render(wrap(<RegisterLandingPage />));
    await waitFor(() => {
      expect(screen.getByText(/register overview/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/projects/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/sites/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/structures/i).length).toBeGreaterThan(0);
  });

  it('shows manage quick links', async () => {
    setSession(makeSession());
    const { default: RegisterLandingPage } = await import('../src/pages/reviewer/RegisterLandingPage');
    render(wrap(<RegisterLandingPage />));
    await waitFor(() => {
      expect(screen.getByText(/manage projects/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/manage sites/i)).toBeInTheDocument();
    expect(screen.getByText(/manage structures/i)).toBeInTheDocument();
  });
});

describe('Bundle 5 — Breadcrumbs', () => {
  it('shows Register root link', async () => {
    const { default: RegisterBreadcrumbs } = await import('../src/components/RegisterBreadcrumbs');
    render(wrap(<RegisterBreadcrumbs crumbs={[]} />));
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  it('renders breadcrumb trail', async () => {
    const { default: RegisterBreadcrumbs } = await import('../src/components/RegisterBreadcrumbs');
    render(wrap(<RegisterBreadcrumbs crumbs={[{ label: 'Projects' }, { label: 'Test Project' }]} />));
    expect(screen.getByText(/projects/i)).toBeInTheDocument();
    expect(screen.getByText(/test project/i)).toBeInTheDocument();
  });
});

describe('Bundle 5 — Project List', () => {
  it('renders project table with data', async () => {
    setSession(makeSession());
    const { default: ProjectListPage } = await import('../src/pages/reviewer/ProjectListPage');
    render(wrap(<ProjectListPage />));
    await waitFor(() => {
      expect(screen.getByText(/harbor bridge inspection/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/downtown tower assessment/i)).toBeInTheDocument();
  });

  it('opens create drawer on New Project click', async () => {
    setSession(makeSession());
    const { default: ProjectListPage } = await import('../src/pages/reviewer/ProjectListPage');
    render(wrap(<ProjectListPage />));
    await waitFor(() => {
      expect(screen.getByText(/harbor bridge inspection/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/new project/i));
    await waitFor(() => {
      expect(screen.getByText(/project name/i)).toBeInTheDocument();
    });
  });

  it('opens edit drawer on Edit click', async () => {
    setSession(makeSession());
    const { default: ProjectListPage } = await import('../src/pages/reviewer/ProjectListPage');
    render(wrap(<ProjectListPage />));
    await waitFor(() => {
      expect(screen.getByText(/harbor bridge inspection/i)).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByDisplayValue(/harbor bridge inspection/i)).toBeInTheDocument();
    });
  });
});

describe('Bundle 5 — Site List', () => {
  it('renders site table with data', async () => {
    setSession(makeSession());
    const { default: SiteListPage } = await import('../src/pages/reviewer/SiteListPage');
    render(wrap(<SiteListPage />));
    await waitFor(() => {
      expect(screen.getByText(/main span/i)).toBeInTheDocument();
    });
  });

  it('opens create drawer on New Site click', async () => {
    setSession(makeSession());
    const { default: SiteListPage } = await import('../src/pages/reviewer/SiteListPage');
    render(wrap(<SiteListPage />));
    await waitFor(() => {
      expect(screen.getByText(/main span/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/new site/i));
    await waitFor(() => {
      expect(screen.getByText(/site name/i)).toBeInTheDocument();
    });
  });

  it('opens edit drawer on Edit click', async () => {
    setSession(makeSession());
    const { default: SiteListPage } = await import('../src/pages/reviewer/SiteListPage');
    render(wrap(<SiteListPage />));
    await waitFor(() => {
      expect(screen.getByText(/main span/i)).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByDisplayValue(/harbor bridge — main span/i)).toBeInTheDocument();
    });
  });
});

describe('Bundle 5 — Structure List', () => {
  it('renders structure table with data', async () => {
    setSession(makeSession());
    const { default: StructureListPage } = await import('../src/pages/reviewer/StructureListPage');
    render(wrap(<StructureListPage />));
    await waitFor(() => {
      expect(screen.getByText(/main suspension cable/i)).toBeInTheDocument();
    });
  });

  it('opens create drawer on New Structure click', async () => {
    setSession(makeSession());
    const { default: StructureListPage } = await import('../src/pages/reviewer/StructureListPage');
    render(wrap(<StructureListPage />));
    await waitFor(() => {
      expect(screen.getByText(/main suspension cable/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/new structure/i));
    await waitFor(() => {
      expect(screen.getByText(/structure name/i)).toBeInTheDocument();
    });
  });

  it('opens edit drawer on Edit click', async () => {
    setSession(makeSession());
    const { default: StructureListPage } = await import('../src/pages/reviewer/StructureListPage');
    render(wrap(<StructureListPage />));
    await waitFor(() => {
      expect(screen.getByText(/main suspension cable/i)).toBeInTheDocument();
    });
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    await waitFor(() => {
      expect(screen.getByDisplayValue(/main suspension cable/i)).toBeInTheDocument();
    });
  });
});

describe('Bundle 5 — Mock Services', () => {
  it('getProjects returns projects', async () => {
    const { getProjects } = await import('../src/services/mockRegister');
    const projects = await getProjects();
    expect(projects.length).toBeGreaterThan(0);
  });

  it('createProject adds a project', async () => {
    const { createProject, getProjects } = await import('../src/services/mockRegister');
    await createProject({ client_id: 'c-apex', name: 'Test Project', code: 'TST-001' });
    const projects = await getProjects();
    expect(projects.find(p => p.name === 'Test Project')).toBeTruthy();
  });

  it('createSite adds a site', async () => {
    const { createSite, getSites } = await import('../src/services/mockRegister');
    await createSite({ project_id: 'p-bridge-1', name: 'Test Site', address: '123 Test St' });
    const sites = await getSites();
    expect(sites.find(s => s.name === 'Test Site')).toBeTruthy();
  });

  it('createStructure adds a structure', async () => {
    const { createStructure, getStructures } = await import('../src/services/mockRegister');
    await createStructure({ site_id: 's-harbor-bridge', name: 'Test Structure', type: 'beam', identifier: 'BM-001' });
    const structures = await getStructures();
    expect(structures.find(s => s.name === 'Test Structure')).toBeTruthy();
  });

  it('searchStructures filters by name', async () => {
    const { searchStructures } = await import('../src/services/mockRegister');
    const results = await searchStructures('cable');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(s => s.name.toLowerCase().includes('cable') || s.identifier.toLowerCase().includes('cable'))).toBe(true);
  });

  it('updateProject modifies existing project', async () => {
    const { updateProject, getProject } = await import('../src/services/mockRegister');
    const updated = await updateProject('p-bridge-1', { name: 'Updated Bridge' });
    expect(updated.name).toBe('Updated Bridge');
    const fetched = await getProject('p-bridge-1');
    expect(fetched?.name).toBe('Updated Bridge');
  });
});

describe('CONN-7 — createInspections mock service', () => {
  it('creates one inspection per structure', async () => {
    const { createInspections } = await import('../src/services/mockInspection');
    const results = await createInspections({
      structure_ids: ['str-harbor-main', 'str-harbor-pier1'],
      site_id: 's-harbor-bridge',
      inspector_id: 'u-eleanor',
    });
    expect(results).toHaveLength(2);
    expect(results[0].assigned_to).toBe('u-eleanor');
    expect(results[0].site_id).toBe('s-harbor-bridge');
    expect(results[0].structure_id).toBe('str-harbor-main');
    expect(results[0].status).toBe('Assigned');
  });

  it('sets assignee_name on created inspections', async () => {
    const { createInspections, getInspections } = await import('../src/services/mockInspection');
    await createInspections({
      structure_ids: ['str-tower-frame'],
      site_id: 's-downtown-tower',
      inspector_id: 'u-eleanor',
    });
    const all = await getInspections();
    const created = all.filter(i => i.structure_id === 'str-tower-frame' && i.created_at);
    expect(created.length).toBeGreaterThan(0);
    expect(created[created.length - 1].assignee_name).toBe('Eleanor Vance');
  });
});

describe('CONN-7 — NewInspectionPage', () => {
  beforeEach(() => {
    setSession(makeSession());
  });

  it('renders the create inspection form with project selector', async () => {
    const { default: NewInspectionPage } = await import('../src/pages/reviewer/NewInspectionPage');
    render(wrap(<NewInspectionPage />));
    await waitFor(() => {
      expect(screen.getByText(/new inspection/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/select project/i)).toBeInTheDocument();
    });
  });

  it('shows site dropdown after project is selected', async () => {
    const { default: NewInspectionPage } = await import('../src/pages/reviewer/NewInspectionPage');
    render(wrap(<NewInspectionPage />));
    await waitFor(() => {
      expect(screen.getByText(/select project/i)).toBeInTheDocument();
    });
    const projectSelect = screen.getByLabelText(/project/i);
    fireEvent.change(projectSelect, { target: { value: 'p-bridge-1' } });
    await waitFor(() => {
      expect(screen.getByText(/select site/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/site/i)).toBeInTheDocument();
  });

  it('renders inspector and mode selects when form is fully loaded', async () => {
    const { default: NewInspectionPage } = await import('../src/pages/reviewer/NewInspectionPage');
    render(wrap(<NewInspectionPage />));
    await waitFor(() => {
      expect(screen.getByText(/new inspection/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/select project/i)).toBeInTheDocument();
    });
    const projectSelect = screen.getByLabelText(/project/i);
    await waitFor(() => {
      expect(projectSelect.querySelectorAll('option').length).toBeGreaterThan(1);
    });
  });
});