// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { buildTree, filterTree, getPathToNode, findNodeById, flattenTree } from '../src/lib/buildTree';
import type { TaxonomyNode } from '../src/lib/buildTree';

interface TreeNode extends TaxonomyNode {
  children: TreeNode[];
  depth: number;
}

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>;
}

afterEach(() => {
  cleanup();
});

const taxonomyNodes: TaxonomyNode[] = [
  { node_id: 'cat-1', parent_id: null, level: 'category', category: 'Steel', label: 'Steel', display_order: 1, is_active: true },
  { node_id: 'cat-2', parent_id: null, level: 'category', category: 'Concrete', label: 'Concrete', display_order: 2, is_active: true },
  { node_id: 'et-1', parent_id: 'cat-1', level: 'equipment_type', category: 'Steel', label: 'Girder', display_order: 1, is_active: true },
  { node_id: 'et-2', parent_id: 'cat-1', level: 'equipment_type', category: 'Steel', label: 'Column', display_order: 2, is_active: true },
  { node_id: 'et-3', parent_id: 'cat-2', level: 'equipment_type', category: 'Concrete', label: 'Beam', display_order: 1, is_active: true },
  { node_id: 'comp-1', parent_id: 'et-1', level: 'component', category: 'Steel', label: 'Flange', display_order: 1, is_active: true },
  { node_id: 'comp-2', parent_id: 'et-1', level: 'component', category: 'Steel', label: 'Web', display_order: 2, is_active: true },
  { node_id: 'comp-3', parent_id: 'et-2', level: 'component', category: 'Steel', label: 'Base Plate', display_order: 1, is_active: true },
  { node_id: 'sub-1', parent_id: 'comp-1', level: 'sub_component', category: 'Steel', label: 'Top Flange', display_order: 1, is_active: true },
  { node_id: 'sub-2', parent_id: 'comp-1', level: 'sub_component', category: 'Steel', label: 'Bottom Flange', display_order: 2, is_active: true },
  { node_id: 'sub-3', parent_id: 'comp-3', level: 'sub_component', category: 'Steel', label: 'Anchor Bolt', display_order: 1, is_active: true },
];

function nodeCount(tree: TreeNode[]): number {
  let count = 0;
  for (const n of tree) {
    count += 1 + nodeCount(n.children);
  }
  return count;
}

describe('buildTree — hierarchy engine', () => {
  it('builds a tree from flat nodes', () => {
    const tree = buildTree(taxonomyNodes);
    expect(tree).toHaveLength(2);
    const steel = tree.find(n => n.label === 'Steel');
    expect(steel).toBeDefined();
    expect(steel!.children).toHaveLength(2);
    const girder = steel!.children.find(n => n.label === 'Girder');
    expect(girder).toBeDefined();
    expect(girder!.children).toHaveLength(2);
  });

  it('assigns correct depth to each node', () => {
    const tree = buildTree(taxonomyNodes);
    const flanges = findNodeById(tree, 'sub-1');
    expect(flanges).toBeDefined();
    expect(flanges!.depth).toBe(3);
  });

  it('sorts nodes by display_order within each level', () => {
    const tree = buildTree(taxonomyNodes);
    const steel = tree.find(n => n.label === 'Steel')!;
    expect(steel.children[0].label).toBe('Girder');
    expect(steel.children[1].label).toBe('Column');
  });

  it('only includes root-level nodes in the top-level array', () => {
    const tree = buildTree(taxonomyNodes);
    const rootLevels = tree.map(n => n.level);
    expect(rootLevels).toEqual(['category', 'category']);
  });
});

describe('findNodeById', () => {
  it('finds a node by its ID', () => {
    const tree = buildTree(taxonomyNodes);
    const found = findNodeById(tree, 'comp-1');
    expect(found).toBeDefined();
    expect(found!.label).toBe('Flange');
  });

  it('returns null for non-existent ID', () => {
    const tree = buildTree(taxonomyNodes);
    const found = findNodeById(tree, 'non-existent');
    expect(found).toBeNull();
  });
});

describe('getPathToNode', () => {
  it('returns the full path from root to a node', () => {
    const tree = buildTree(taxonomyNodes);
    const path = getPathToNode(tree, 'sub-1');
    expect(path.map(n => n.label)).toEqual(['Steel', 'Girder', 'Flange', 'Top Flange']);
  });
});

describe('filterTree', () => {
  it('returns original tree for empty query', () => {
    const tree = buildTree(taxonomyNodes);
    const filtered = filterTree(tree, '');
    expect(filtered.length).toBe(tree.length);
  });

  it('filters by label, keeping ancestor context', () => {
    const tree = buildTree(taxonomyNodes);
    const filtered = filterTree(tree, 'Flange');
    const flat = flattenTree(filtered);
    expect(flat.some(n => n.label === 'Flange')).toBe(true);
    expect(flat.some(n => n.label === 'Steel')).toBe(true);
    expect(flat.some(n => n.label === 'Anchor Bolt')).toBe(false);
  });

  it('filters by level name', () => {
    const tree = buildTree(taxonomyNodes);
    const filtered = filterTree(tree, 'sub_component');
    const flat = flattenTree(filtered);
    const found = flat.filter(n => n.level === 'sub_component');
    expect(found.length).toBeGreaterThan(0);
  });
});

describe('TaxonomyManagerPage — integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mock('../src/services/api/apiClient', () => ({
      apiClient: () => Promise.resolve(taxonomyNodes),
    }));
  });

  it('renders the taxonomy tree with all root categories', async () => {
    const { default: TaxonomyManagerPage } = await import('../src/pages/reviewer/TaxonomyManagerPage');
    render(wrap(<MemoryRouter><TaxonomyManagerPage /></MemoryRouter>));
    await waitFor(() => {
      expect(screen.getByText('Steel')).toBeInTheDocument();
      expect(screen.getByText('Concrete')).toBeInTheDocument();
    });
  });

  it('shows properties panel when a node is selected', async () => {
    const { default: TaxonomyManagerPage } = await import('../src/pages/reviewer/TaxonomyManagerPage');
    render(wrap(<MemoryRouter><TaxonomyManagerPage /></MemoryRouter>));
    await waitFor(() => {
      expect(screen.getByText('Steel')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Steel'));
    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Add Child')).toBeInTheDocument();
    });
  });

  it('has level filter buttons that are clickable', async () => {
    const { default: TaxonomyManagerPage } = await import('../src/pages/reviewer/TaxonomyManagerPage');
    render(wrap(<MemoryRouter><TaxonomyManagerPage /></MemoryRouter>));
    await waitFor(() => {
      expect(screen.getByText('All Levels')).toBeInTheDocument();
    });
    const eqBtn = screen.getByText('Equipment Type');
    expect(eqBtn).toBeInTheDocument();
    fireEvent.click(eqBtn);
  });
});