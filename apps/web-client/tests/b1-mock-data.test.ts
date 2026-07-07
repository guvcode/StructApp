import { describe, it, expect } from 'vitest';

describe('Bundle 1 — Mock Data', () => {

  it('mock users have correct shape', async () => {
    const mod = await import('../src/data/mock/users');
    expect(Array.isArray(mod.mockUsers)).toBe(true);
    expect(mod.mockUsers.length).toBeGreaterThanOrEqual(5);
    for (const user of mod.mockUsers) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('display_name');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('is_active');
      expect(user).toHaveProperty('client_memberships');
      expect(Array.isArray(user.client_memberships)).toBe(true);
    }
  });

  it('mock clients have correct shape', async () => {
    const mod = await import('../src/data/mock/clients');
    expect(Array.isArray(mod.mockClients)).toBe(true);
    expect(mod.mockClients.length).toBeGreaterThanOrEqual(2);
    for (const client of mod.mockClients) {
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('slug');
      expect(client).toHaveProperty('is_active');
    }
  });

  it('mock projects have correct shape', async () => {
    const mod = await import('../src/data/mock/projects');
    expect(Array.isArray(mod.mockProjects)).toBe(true);
    expect(mod.mockProjects.length).toBeGreaterThanOrEqual(3);
    for (const project of mod.mockProjects) {
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('client_id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('code');
      expect(project).toHaveProperty('status');
    }
  });

  it('mock sites have correct shape', async () => {
    const mod = await import('../src/data/mock/sites');
    expect(Array.isArray(mod.mockSites)).toBe(true);
    expect(mod.mockSites.length).toBeGreaterThanOrEqual(5);
    for (const site of mod.mockSites) {
      expect(site).toHaveProperty('id');
      expect(site).toHaveProperty('project_id');
      expect(site).toHaveProperty('name');
      expect(site).toHaveProperty('address');
      expect(site).toHaveProperty('status');
    }
  });

  it('mock structures have correct shape', async () => {
    const mod = await import('../src/data/mock/structures');
    expect(Array.isArray(mod.mockStructures)).toBe(true);
    expect(mod.mockStructures.length).toBeGreaterThanOrEqual(5);
    for (const struct of mod.mockStructures) {
      expect(struct).toHaveProperty('id');
      expect(struct).toHaveProperty('site_id');
      expect(struct).toHaveProperty('name');
      expect(struct).toHaveProperty('type');
      expect(struct).toHaveProperty('identifier');
    }
  });

  it('mock inspections have correct shape', async () => {
    const mod = await import('../src/data/mock/inspections');
    expect(Array.isArray(mod.mockInspections)).toBe(true);
    expect(mod.mockInspections.length).toBeGreaterThanOrEqual(5);
    for (const insp of mod.mockInspections) {
      expect(insp).toHaveProperty('id');
      expect(insp).toHaveProperty('site_id');
      expect(insp).toHaveProperty('assigned_to');
      expect(insp).toHaveProperty('assigned_by');
      expect(insp).toHaveProperty('status');
      expect(insp).toHaveProperty('created_at');
    }
  });

  it('mock deficiencies have correct shape', async () => {
    const mod = await import('../src/data/mock/deficiencies');
    expect(Array.isArray(mod.mockDeficiencies)).toBe(true);
    expect(mod.mockDeficiencies.length).toBeGreaterThanOrEqual(5);
    for (const def of mod.mockDeficiencies) {
      expect(def).toHaveProperty('id');
      expect(def).toHaveProperty('inspection_id');
      expect(def).toHaveProperty('title');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('severity');
      expect(def).toHaveProperty('status');
      expect(def).toHaveProperty('priority_tier');
    }
  });

  it('mock data exports getById helpers', async () => {
    const users = await import('../src/data/mock/users');
    expect(typeof users.getUserById).toBe('function');
    const clients = await import('../src/data/mock/clients');
    expect(typeof clients.getClientById).toBe('function');
    const projects = await import('../src/data/mock/projects');
    expect(typeof projects.getProjectById).toBe('function');
    const sites = await import('../src/data/mock/sites');
    expect(typeof sites.getSiteById).toBe('function');
  });

  it('getById returns matching item', async () => {
    const users = await import('../src/data/mock/users');
    const first = users.mockUsers[0];
    const found = users.getUserById(first.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(first.id);
  });

  it('getById returns undefined for unknown id', async () => {
    const users = await import('../src/data/mock/users');
    expect(users.getUserById('nonexistent')).toBeUndefined();
  });
});