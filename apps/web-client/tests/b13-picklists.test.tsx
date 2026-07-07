import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const seedTypes = [
  { id: 'ct-1', type: 'component_type' as const, name: 'Girder', isActive: true },
  { id: 'ct-2', type: 'component_type' as const, name: 'Column', isActive: true },
  { id: 'ct-3', type: 'component_type' as const, name: 'Bearing', isActive: false },
];

const seedWork = [
  { id: 'wt-1', type: 'work_type' as const, name: 'Field Inspection', isActive: true },
  { id: 'wt-2', type: 'work_type' as const, name: 'Report Writing', isActive: false },
];

beforeEach(async () => {
  const mod = await import('../src/services/mockPicklists');
  mod.mockPicklistItems.length = 0;
  seedTypes.forEach(i => mod.mockPicklistItems.push({ ...i }));
  seedWork.forEach(i => mod.mockPicklistItems.push({ ...i }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Bundle 13 — Mock Picklists Service', () => {

  it('getPicklistEntries returns all entries for a type', async () => {
    const mod = await import('../src/services/mockPicklists');
    const items = await mod.getPicklistEntries('component_type');
    expect(items.length).toBe(3);
    expect(items[0].name).toBe('Girder');
  });

  it('addPicklistItem creates a new active entry', async () => {
    const mod = await import('../src/services/mockPicklists');
    const created = await mod.addPicklistItem('component_type', 'Deck');
    expect(created.name).toBe('Deck');
    expect(created.isActive).toBe(true);
  });

  it('renamePicklistItem updates the name', async () => {
    const mod = await import('../src/services/mockPicklists');
    await mod.renamePicklistItem('ct-1', 'Super Girder');
    const all = await mod.getPicklistEntries('component_type');
    const found = all.find(i => i.id === 'ct-1');
    expect(found!.name).toBe('Super Girder');
  });

  it('deactivatePicklistItem sets isActive to false', async () => {
    const mod = await import('../src/services/mockPicklists');
    await mod.deactivatePicklistItem('ct-2');
    const all = await mod.getPicklistEntries('component_type');
    const found = all.find(i => i.id === 'ct-2');
    expect(found!.isActive).toBe(false);
  });

  it('reactivatePicklistItem sets isActive to true', async () => {
    const mod = await import('../src/services/mockPicklists');
    await mod.reactivatePicklistItem('ct-3');
    const all = await mod.getPicklistEntries('component_type');
    const found = all.find(i => i.id === 'ct-3');
    expect(found!.isActive).toBe(true);
  });
});

describe('Bundle 13 — Picklist Landing Page', () => {
  it('renders cards with links to manager pages', async () => {
    const PicklistLandingPage = (await import('../src/pages/reviewer/PicklistLandingPage')).default;
    render(<MemoryRouter><PicklistLandingPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/component types/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/work types/i).length).toBeGreaterThan(0);
  });
});

describe('Bundle 13 — Picklist Manager Pages', () => {
  it('Component Types page renders manager', async () => {
    const PicklistComponentTypesPage = (await import('../src/pages/reviewer/PicklistComponentTypesPage')).default;
    render(<MemoryRouter><PicklistComponentTypesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/component type manager/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Girder')).toBeInTheDocument();
  });

  it('Work Types page renders manager', async () => {
    const PicklistWorkTypesPage = (await import('../src/pages/reviewer/PicklistWorkTypesPage')).default;
    render(<MemoryRouter><PicklistWorkTypesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/work type manager/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Field Inspection')).toBeInTheDocument();
  });
});