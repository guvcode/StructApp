import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import type { Project, Site, StructureAsset } from '../../types';

export async function getProjects(clientId?: string): Promise<Project[]> {
  const url = clientId ? `${ENDPOINTS.projects.list}?client_id=${clientId}` : ENDPOINTS.projects.list;
  return apiClient(url);
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    return await apiClient(ENDPOINTS.projects.byId(id));
  } catch {
    return null;
  }
}

export async function createProject(input: {
  client_id: string; name: string; code: string;
  status?: string; region?: string; start_date?: string; end_date?: string;
}): Promise<Project> {
  return apiClient(ENDPOINTS.projects.create, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProject(id: string, input: Partial<{
  name: string; code: string; status: string; region: string; start_date: string; end_date: string;
}>): Promise<Project> {
  return apiClient(ENDPOINTS.projects.update(id), {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function getSites(projectId?: string): Promise<Site[]> {
  const url = projectId ? `${ENDPOINTS.sites.list}?project_id=${projectId}` : ENDPOINTS.sites.list;
  return apiClient(url);
}

export async function getSite(id: string): Promise<Site | null> {
  try {
    return await apiClient(ENDPOINTS.sites.byId(id));
  } catch {
    return null;
  }
}

export async function createSite(input: {
  project_id: string; name: string; address: string; status?: string;
}): Promise<Site> {
  return apiClient(ENDPOINTS.sites.create, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateSite(id: string, input: Partial<{
  name: string; address: string; status: string;
}>): Promise<Site> {
  return apiClient(ENDPOINTS.sites.update(id), {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function getStructures(siteId?: string): Promise<StructureAsset[]> {
  const url = siteId ? `${ENDPOINTS.structures.list}?site_id=${siteId}` : ENDPOINTS.structures.list;
  return apiClient(url);
}

export async function getStructure(id: string): Promise<StructureAsset | null> {
  try {
    return await apiClient(ENDPOINTS.structures.byId(id));
  } catch {
    return null;
  }
}

export async function createStructure(input: {
  site_id: string; name: string; type: string; identifier: string;
}): Promise<StructureAsset> {
  return apiClient(ENDPOINTS.structures.create, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateStructure(id: string, input: Partial<{
  name: string; type: string; identifier: string;
}>): Promise<StructureAsset> {
  return apiClient(ENDPOINTS.structures.update(id), {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function searchStructures(query: string): Promise<StructureAsset[]> {
  return apiClient(ENDPOINTS.structures.search(query));
}