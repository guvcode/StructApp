import type { ImportBatch, ImportRow, ImportBatchStatus } from '../types/index';
import { mockProjects } from '../data/mock/projects';
import { mockSites } from '../data/mock/sites';
import { mockStructures } from '../data/mock/structures';

function delay(ms = 40): Promise<number> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 30));
}

let nextBatchNumber = 1;

export const mockBatches: ImportBatch[] = [];

function makeRow(overrides?: Partial<ImportRow>, idx?: number): ImportRow {
  const projectNames = ['North Canal Bridge', 'South Overpass', 'East River Crossing', 'West Highway Interchange'];
  const siteNames = ['Main St Approach', 'Industrial Rd', 'Riverbank Access', 'Highway 101'];
  const prefixes = ['G-', 'B-', 'P-', 'A-'];
  const descriptions = ['Steel girder span', 'Concrete pier', 'Bearing assembly', 'Deck section'];

  const i = idx ?? Math.floor(Math.random() * 100);
  return {
    id: `row-${i}`,
    project_title: projectNames[i % projectNames.length]!,
    site_name: siteNames[i % siteNames.length]!,
    asset_tag: `${prefixes[i % prefixes.length]!}${1000 + i}`,
    structure_description: descriptions[i % descriptions.length]!,
    status: 'Valid',
    errors: [],
    ...overrides,
  };
}

export function seedBatches(): void {
  mockBatches.length = 0;
  const now = new Date();
  const rows1: ImportRow[] = [
    makeRow({}, 0),
    makeRow({}, 1),
    makeRow({}, 2),
    makeRow({ project_title: '', status: 'Invalid', errors: ['Project title is required'] }, 3),
    makeRow({}, 4),
  ];
  mockBatches.push({
    id: 'batch-1',
    batch_number: nextBatchNumber++,
    status: 'Committed',
    rows: rows1,
    created_at: new Date(now.getTime() - 86400000).toISOString(),
    committed_at: new Date(now.getTime() - 43200000).toISOString(),
    valid_count: 4,
    invalid_count: 1,
  });

  const rows2: ImportRow[] = [
    makeRow({}, 10),
    makeRow({ site_name: '', status: 'Invalid', errors: ['Site name is required'] }, 11),
    makeRow({}, 12),
  ];
  mockBatches.push({
    id: 'batch-2',
    batch_number: nextBatchNumber++,
    status: 'Discarded',
    rows: rows2,
    created_at: new Date(now.getTime() - 172800000).toISOString(),
    discarded_at: new Date(now.getTime() - 86400000).toISOString(),
    valid_count: 2,
    invalid_count: 1,
  });
}

export async function getBatches(): Promise<ImportBatch[]> {
  await delay();
  return [...mockBatches];
}

export async function getBatch(id: string): Promise<ImportBatch | undefined> {
  await delay(20);
  return mockBatches.find(b => b.id === id);
}

export async function simulateUpload(): Promise<ImportBatch> {
  await delay(60);
  const rows: ImportRow[] = [
    makeRow({}, 20),
    makeRow({}, 21),
    makeRow({ asset_tag: '', status: 'Invalid', errors: ['Asset tag is required'] }, 22),
    makeRow({ structure_description: '', status: 'Invalid', errors: ['Structure description is required'] }, 23),
    makeRow({}, 24),
  ];
  const validCount = rows.filter(r => r.status === 'Valid').length;
  const invalidCount = rows.filter(r => r.status === 'Invalid').length;
  const batch: ImportBatch = {
    id: `batch-${Date.now()}`,
    batch_number: nextBatchNumber++,
    status: 'Validated',
    rows,
    created_at: new Date().toISOString(),
    valid_count: validCount,
    invalid_count: invalidCount,
  };
  mockBatches.push(batch);
  return batch;
}

export async function commitBatch(id: string): Promise<ImportBatch> {
  await delay(30);
  const batch = mockBatches.find(b => b.id === id);
  if (!batch) throw new Error('Batch not found');
  if (batch.status !== 'Validated') throw new Error('Batch must be Validated to commit');
  const validRows = batch.rows.filter(r => r.status === 'Valid');
  for (const row of validRows) {
    let project = mockProjects.find(p => p.name === row.project_title);
    if (!project) {
      project = {
        id: `p-import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        client_id: 'c-apex',
        name: row.project_title,
        code: `IMP-${row.project_title.replace(/\s+/g, '-').toUpperCase()}`,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      mockProjects.push(project);
    }
    let site = mockSites.find(s => s.name === row.site_name && s.project_id === project.id);
    if (!site) {
      site = {
        id: `s-import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        project_id: project.id,
        name: row.site_name,
        address: 'Import via CSV',
        status: 'active',
        created_at: new Date().toISOString(),
      };
      mockSites.push(site);
    }
    const exists = mockStructures.find(s => s.identifier === row.asset_tag && s.site_id === site!.id);
    if (!exists) {
      mockStructures.push({
        id: `str-import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        site_id: site.id,
        name: row.structure_description,
        type: 'imported',
        identifier: row.asset_tag,
        created_at: new Date().toISOString(),
      });
    }
  }
  batch.status = 'Committed';
  batch.committed_at = new Date().toISOString();
  return batch;
}

export async function discardBatch(id: string): Promise<ImportBatch> {
  await delay(20);
  const batch = mockBatches.find(b => b.id === id);
  if (!batch) throw new Error('Batch not found');
  batch.status = 'Discarded' as ImportBatchStatus;
  batch.discarded_at = new Date().toISOString();
  return batch;
}

seedBatches();