export type TaxonomyNode = {
  node_id: string;
  client_id: string;
  parent_id: string | null;
  level: string;
  category: string;
  label: string;
  display_order: number;
  is_active: boolean;
};

const mockTaxonomy: TaxonomyNode[] = [
  { node_id: 't-001', client_id: 'client-1', parent_id: null, level: 'category', category: 'Building Envelope', label: 'Building Envelope', display_order: 1, is_active: true },
  { node_id: 't-002', client_id: 'client-1', parent_id: null, level: 'category', category: 'Structural Support', label: 'Structural Support', display_order: 2, is_active: true },
  { node_id: 't-003', client_id: 'client-1', parent_id: null, level: 'category', category: 'Foundations & Geotechnical', label: 'Foundations & Geotechnical', display_order: 3, is_active: true },
  { node_id: 't-004', client_id: 'client-1', parent_id: null, level: 'category', category: 'Process Equipment', label: 'Process Equipment', display_order: 4, is_active: true },
  { node_id: 't-005', client_id: 'client-1', parent_id: 't-001', level: 'component', category: 'Building Envelope', label: 'Roofing', display_order: 1, is_active: true },
  { node_id: 't-006', client_id: 'client-1', parent_id: 't-001', level: 'component', category: 'Building Envelope', label: 'Cladding', display_order: 2, is_active: true },
  { node_id: 't-007', client_id: 'client-1', parent_id: 't-005', level: 'sub_component', category: 'Building Envelope', label: 'Membrane', display_order: 1, is_active: true },
  { node_id: 't-008', client_id: 'client-1', parent_id: 't-005', level: 'sub_component', category: 'Building Envelope', label: 'Drainage', display_order: 2, is_active: true },
  { node_id: 't-009', client_id: 'client-1', parent_id: 't-007', level: 'focus_area', category: 'Building Envelope', label: 'Waterproofing', display_order: 1, is_active: true },
  { node_id: 't-010', client_id: 'client-1', parent_id: 't-009', level: 'deficiency_category', category: 'Building Envelope', label: 'Blistering', display_order: 1, is_active: true },
];

let nextId = 100;

export async function getTaxonomyNodes(): Promise<TaxonomyNode[]> {
  return mockTaxonomy.filter(n => true);
}

export async function addTaxonomyNode(input: { parent_id: string | null; level: string; category: string; label: string; display_order: number }): Promise<TaxonomyNode> {
  const node: TaxonomyNode = {
    node_id: `t-${nextId++}`,
    client_id: 'client-1',
    parent_id: input.parent_id,
    level: input.level,
    category: input.category,
    label: input.label,
    display_order: input.display_order,
    is_active: true,
  };
  mockTaxonomy.push(node);
  return node;
}

export async function updateTaxonomyNode(nodeId: string, updates: { label?: string; display_order?: number; is_active?: boolean }): Promise<TaxonomyNode> {
  const idx = mockTaxonomy.findIndex(n => n.node_id === nodeId);
  if (idx === -1) throw new Error('NOT_FOUND');
  Object.assign(mockTaxonomy[idx], updates);
  return mockTaxonomy[idx];
}

export function getTaxonomyCategories(): string[] {
  return [...new Set(mockTaxonomy.filter(n => n.level === 'category').map(n => n.category))];
}