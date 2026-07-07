import { useState } from 'react';

export interface TaxonomyNode {
  node_id: string;
  parent_id: string | null;
  level: string;
  category: string;
  label: string;
  display_order: number;
  is_active: boolean;
}

const LEVEL_OPTIONS = ['category', 'component', 'sub_component', 'focus_area', 'deficiency_category', 'detailed_description'] as const;

interface TaxonomyNodeRowProps {
  node: TaxonomyNode;
  allNodes: TaxonomyNode[];
  onEdit: (node: TaxonomyNode) => void;
  onToggleActive: (node: TaxonomyNode) => void;
}

function getChildNodes(parentId: string, nodes: TaxonomyNode[]): TaxonomyNode[] {
  return nodes.filter(n => n.parent_id === parentId).sort((a, b) => a.display_order - b.display_order);
}

function TaxonomyNodeRow({ node, allNodes, onEdit, onToggleActive }: TaxonomyNodeRowProps) {
  const children = getChildNodes(node.node_id, allNodes);
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className="flex items-center justify-between py-2 px-3 hover:bg-surface-secondary rounded">
        <div className="flex items-center gap-2 flex-1">
          {children.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="text-text-secondary text-xs w-4" aria-label={expanded ? 'Collapse' : 'Expand'}>
              {expanded ? '▼' : '▶'}
            </button>
          )}
          {children.length === 0 && <span className="w-4" />}
          <span className={`text-xs font-medium text-text-muted uppercase w-28 shrink-0`}>{node.level}</span>
          <span className={node.is_active ? 'text-text-primary' : 'text-text-muted line-through'}>{node.label}</span>
          {!node.is_active && <span className="text-xs bg-surface-secondary text-text-muted px-2 py-0.5 rounded-full ml-2">Inactive</span>}
          {node.display_order > 0 && <span className="text-xs text-text-muted ml-2">[{node.display_order}]</span>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(node)} className="px-2 py-0.5 text-xs rounded bg-surface-tertiary text-text-secondary hover:bg-surface-secondary">Edit</button>
          <button onClick={() => onToggleActive(node)} className="px-2 py-0.5 text-xs rounded bg-surface-tertiary text-text-secondary hover:bg-surface-secondary">
            {node.is_active ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div className="ml-6 border-l border-border pl-2">
          {children.map(child => (
            <TaxonomyNodeRow key={child.node_id} node={child} allNodes={allNodes} onEdit={onEdit} onToggleActive={onToggleActive} />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaxonomyManagerProps {
  nodes: TaxonomyNode[];
  categories: string[];
  onAdd: (input: { parent_id: string | null; level: string; category: string; label: string; display_order: number }) => void;
  onUpdate: (nodeId: string, updates: { label?: string; display_order?: number; is_active?: boolean }) => void;
}

export function TaxonomyManager({ nodes, categories, onAdd, onUpdate }: TaxonomyManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLevel, setNewLevel] = useState('category');
  const [newCategory, setNewCategory] = useState(categories[0] ?? '');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newOrder, setNewOrder] = useState(0);
  const [editingNode, setEditingNode] = useState<TaxonomyNode | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editOrder, setEditOrder] = useState(0);

  const rootNodes = getChildNodes('root', nodes);

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAdd({ parent_id: newParentId, level: newLevel, category: newCategory, label: newLabel.trim(), display_order: newOrder });
    setNewLabel('');
    setShowForm(false);
  };

  const startEdit = (node: TaxonomyNode) => {
    setEditingNode(node);
    setEditLabel(node.label);
    setEditOrder(node.display_order);
  };

  const saveEdit = () => {
    if (!editingNode || !editLabel.trim()) return;
    onUpdate(editingNode.node_id, { label: editLabel.trim(), display_order: editOrder });
    setEditingNode(null);
  };

  return (
    <div className="p-6 animate-fadeIn max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary">Taxonomy Manager</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90">
          {showForm ? 'Cancel' : 'Add Node'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-secondary rounded-lg p-4 mb-6 space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Level</label>
              <select value={newLevel} onChange={e => setNewLevel(e.target.value)} className="w-full px-2 py-1.5 rounded border border-border bg-surface text-sm text-text-primary">
                {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-2 py-1.5 rounded border border-border bg-surface text-sm text-text-primary">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Parent Node</label>
            <select value={newParentId ?? ''} onChange={e => setNewParentId(e.target.value || null)} className="w-full px-2 py-1.5 rounded border border-border bg-surface text-sm text-text-primary">
              <option value="">(Root — top-level node)</option>
              {nodes.map(n => <option key={n.node_id} value={n.node_id}>{'  '.repeat(LEVEL_OPTIONS.indexOf(n.level as typeof LEVEL_OPTIONS[number]))}{n.label} ({n.level})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Label</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} className="w-full px-2 py-1.5 rounded border border-border bg-surface text-sm text-text-primary" placeholder="Node label..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Display Order</label>
              <input type="number" min={0} value={newOrder} onChange={e => setNewOrder(Number(e.target.value))} className="w-full px-2 py-1.5 rounded border border-border bg-surface text-sm text-text-primary" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={!newLabel.trim()} className="px-4 py-1.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
            Create Node
          </button>
        </div>
      )}

      {editingNode && (
        <div className="bg-surface-secondary rounded-lg p-4 mb-6 space-y-3 border border-border">
          <p className="text-sm font-medium text-text-primary">Editing: {editingNode.label}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Label</label>
              <input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="w-full px-2 py-1.5 rounded border border-border bg-surface text-sm text-text-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Display Order</label>
              <input type="number" min={0} value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} className="w-full px-2 py-1.5 rounded border border-border bg-surface text-sm text-text-primary" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={!editLabel.trim()} className="px-4 py-1.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">Save</button>
            <button onClick={() => setEditingNode(null)} className="px-4 py-1.5 border border-border rounded-lg text-sm text-text-secondary">Cancel</button>
          </div>
        </div>
      )}

      {nodes.length === 0 ? (
        <div className="text-center py-12 text-text-secondary border border-dashed border-border rounded-lg">
          No taxonomy nodes configured. Add a category to get started.
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-surface divide-y divide-border">
          {categories.map(cat => {
            const catNodes = rootNodes.filter(n => n.category === cat);
            if (catNodes.length === 0) return null;
            return (
              <div key={cat}>
                <div className="px-3 py-2 bg-surface-secondary text-sm font-semibold text-text-primary border-b border-border">{cat}</div>
                {catNodes.map(node => (
                  <TaxonomyNodeRow key={node.node_id} node={node} allNodes={nodes} onEdit={startEdit} onToggleActive={n => onUpdate(n.node_id, { is_active: !n.is_active })} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}