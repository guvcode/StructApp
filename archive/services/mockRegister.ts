import type { Project, Site, StructureAsset } from '../types/index';
import { mockProjects, getProjectById, getProjectsByClientId } from '../data/mock/projects';
import { mockSites, getSiteById, getSitesByProjectId } from '../data/mock/sites';
import { mockStructures, getStructureById, getStructuresBySiteId } from '../data/mock/structures';

function delay(ms = 60): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 60));
}

export async function getProjects(clientId?: string): Promise<Project[]> {
  await delay();
  if (clientId) return getProjectsByClientId(clientId);
  return mockProjects;
}

export async function getProject(id: string): Promise<Project | null> {
  await delay(40);
  return getProjectById(id) ?? null;
}

export async function createProject(input: {
  client_id: string;
  name: string;
  code: string;
  status?: string;
  region?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Project> {
  await delay();
  const project: Project = {
    id: `p-${Date.now()}`,
    client_id: input.client_id,
    name: input.name,
    code: input.code,
    status: input.status || 'active',
    ...(input.region ? { region: input.region } : {}),
    ...(input.start_date ? { start_date: input.start_date } : {}),
    ...(input.end_date ? { end_date: input.end_date } : {}),
    created_at: new Date().toISOString(),
  };
  mockProjects.push(project);
  return project;
}

export async function updateProject(id: string, input: Partial<{
  name: string;
  code: string;
  status: string;
  region: string;
  start_date: string;
  end_date: string;
}>): Promise<Project> {
  await delay();
  const idx = mockProjects.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  const existing = mockProjects[idx]!;
  mockProjects[idx] = {
    ...existing,
    name: input.name ?? existing.name,
    code: input.code ?? existing.code,
    status: input.status ?? existing.status,
    ...(input.region !== undefined || existing.region !== undefined ? { region: input.region ?? existing.region } : {}),
    ...(input.start_date !== undefined || existing.start_date !== undefined ? { start_date: input.start_date ?? existing.start_date } : {}),
    ...(input.end_date !== undefined || existing.end_date !== undefined ? { end_date: input.end_date ?? existing.end_date } : {}),
  } as Project;
  return mockProjects[idx]!;
}

export async function getSites(projectId?: string): Promise<Site[]> {
  await delay();
  if (projectId) return getSitesByProjectId(projectId);
  return mockSites;
}

export async function getSite(id: string): Promise<Site | null> {
  await delay(40);
  return getSiteById(id) ?? null;
}

export async function createSite(input: {
  project_id: string;
  name: string;
  address: string;
  status?: string;
}): Promise<Site> {
  await delay();
  const site: Site = {
    id: `s-${Date.now()}`,
    project_id: input.project_id,
    name: input.name,
    address: input.address,
    status: input.status || 'active',
    created_at: new Date().toISOString(),
  };
  mockSites.push(site);
  return site;
}

export async function updateSite(id: string, input: Partial<{
  name: string;
  address: string;
  status: string;
}>): Promise<Site> {
  await delay();
  const idx = mockSites.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Site not found');
  const existing = mockSites[idx]!;
  mockSites[idx] = {
    ...existing,
    name: input.name ?? existing.name,
    address: input.address ?? existing.address,
    status: input.status ?? existing.status,
  } as Site;
  return mockSites[idx]!;
}

export async function getStructures(siteId?: string): Promise<StructureAsset[]> {
  await delay();
  if (siteId) return getStructuresBySiteId(siteId);
  return mockStructures;
}

export async function getStructure(id: string): Promise<StructureAsset | null> {
  await delay(40);
  return getStructureById(id) ?? null;
}

export async function createStructure(input: {
  site_id: string;
  name: string;
  type: string;
  identifier: string;
}): Promise<StructureAsset> {
  await delay();
  const structure: StructureAsset = {
    id: `str-${Date.now()}`,
    site_id: input.site_id,
    name: input.name,
    type: input.type,
    identifier: input.identifier,
    created_at: new Date().toISOString(),
  };
  mockStructures.push(structure);
  return structure;
}

export async function updateStructure(id: string, input: Partial<{
  name: string;
  type: string;
  identifier: string;
}>): Promise<StructureAsset> {
  await delay();
  const idx = mockStructures.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Structure not found');
  const existing = mockStructures[idx]!;
  mockStructures[idx] = {
    ...existing,
    name: input.name ?? existing.name,
    type: input.type ?? existing.type,
    identifier: input.identifier ?? existing.identifier,
  } as StructureAsset;
  return mockStructures[idx]!;
}

export async function searchStructures(query: string): Promise<StructureAsset[]> {
  await delay(30);
  const q = query.toLowerCase();
  return mockStructures.filter(
    s => s.name.toLowerCase().includes(q) || s.identifier.toLowerCase().includes(q),
  );
}