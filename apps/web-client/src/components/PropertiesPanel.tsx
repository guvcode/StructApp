import { type TreeNode } from '../lib/buildTree';
import { useState } from 'react';

interface PropertiesPanelProps {
  node: TreeNode | null;
  path: TreeNode[];
  onRename: (nodeId: string, label: string) => void;
  onUpdateCategory: (nodeId: string, category: string) => void;
  onUpdateDisplayOrder: (nodeId: string, displayOrder: number) => void;
  onDeactivate: (nodeId: string) => void;
  onReactivate: (nodeId: string) => void;
  onAddChild: (parentId: string, label: string) => void;
}

const LEVEL_LABELS: Record<string, string> = {
  category: 'Category',
  equipment_type: 'Equipment Type',
  component: 'Component',
  sub_component: 'Sub-Component',
  focus_area: 'Focus Area',
};

export function PropertiesPanel({ node, path, onRename, onUpdateCategory, onUpdateDisplayOrder, onDeactivate, onReactivate, onAddChild }: PropertiesPanelProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editDisplayOrder, setEditDisplayOrder] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addValue, setAddValue] = useState('');

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Select a node to view its properties
      </div>
    );
  }

  const startEditing = () => {
    setEditCategory(node.category);
    setEditDisplayOrder(node.display_order);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (editCategory.trim() !== node.category) {
      onUpdateCategory(node.node_id, editCategory.trim());
    }
    if (editDisplayOrder !== node.display_order) {
      onUpdateDisplayOrder(node.node_id, editDisplayOrder);
    }
    setIsEditing(false);
  };

  const handleStartRename = () => {
    setRenameValue(node.label);
    setIsRenaming(true);
  };

  const handleSaveRename = () => {
    if (renameValue.trim() && renameValue !== node.label) {
      onRename(node.node_id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleAddChild = () => {
    if (addValue.trim()) {
      onAddChild(node.node_id, addValue.trim());
      setAddValue('');
      setIsAdding(false);
    }
  };

  const canHaveChildren = node.level !== 'focus_area';
  const parentLevel = path.length > 1 ? path[path.length - 2] : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-text-secondary flex-wrap">
        {path.map((ancestor, i) => (
          <span key={ancestor.node_id} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-text-muted">/</span>}
            <span className={i === path.length - 1 ? 'text-text-primary font-medium' : ''}>
              {ancestor.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
            {LEVEL_LABELS[node.level] ?? node.level}
          </span>
          {!node.is_active && (
            <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full font-medium">Inactive</span>
          )}
        </div>
        {isRenaming ? (
          <div className="flex gap-2">
            <input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setIsRenaming(false); }}
              className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            <button onClick={handleSaveRename} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark transition-colors">Save</button>
            <button onClick={() => setIsRenaming(false)} className="rounded-md bg-surface-tertiary px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">Cancel</button>
          </div>
        ) : (
          <h2 className="text-xl font-semibold text-text-primary">{node.label}</h2>
        )}
      </div>

      {isEditing && (
        <div className="flex gap-2 pt-2">
          <button onClick={saveEditing} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark transition-colors">Save Changes</button>
          <button onClick={cancelEditing} className="rounded-md bg-surface-tertiary px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">Cancel</button>
        </div>
      )}

      {/* Details */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-xs text-text-muted mb-0.5">Category</div>
            {isEditing ? (
              <input
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            ) : (
              <div className="text-sm text-text-primary font-medium">{node.category}</div>
            )}
          </div>
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-xs text-text-muted mb-0.5">Level</div>
            <div className="text-sm text-text-primary font-medium capitalize">{node.level.replace('_', ' ')}</div>
          </div>
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-xs text-text-muted mb-0.5">Display Order</div>
            {isEditing ? (
              <input
                type="number"
                value={editDisplayOrder}
                onChange={e => setEditDisplayOrder(parseInt(e.target.value || '0', 10))}
                className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            ) : (
              <div className="text-sm text-text-primary font-medium">{node.display_order}</div>
            )}
          </div>
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-xs text-text-muted mb-0.5">Children</div>
            <div className="text-sm text-text-primary font-medium">{node.children.length}</div>
          </div>
        </div>

        {parentLevel && (
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-xs text-text-muted mb-0.5">Parent {LEVEL_LABELS[parentLevel.level]}</div>
            <div className="text-sm text-text-primary font-medium">{parentLevel.label}</div>
          </div>
        )}

        {node.deficiency_codes && node.deficiency_codes.length > 0 && (
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-xs text-text-muted mb-1.5">Deficiency Codes</div>
            <div className="flex flex-wrap gap-1.5">
              {node.deficiency_codes.map(code => (
                <span key={code} className="text-xs bg-accent-light text-accent-dark px-2 py-0.5 rounded-full font-medium">{code}</span>
              ))}
            </div>
          </div>
        )}

        {node.deficiency_mechanisms && node.deficiency_mechanisms.length > 0 && (
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-xs text-text-muted mb-1.5">Deficiency Mechanisms</div>
            <div className="flex flex-wrap gap-1.5">
              {node.deficiency_mechanisms.map(m => (
                <span key={m} className="text-xs bg-surface-tertiary text-text-secondary px-2 py-0.5 rounded-full">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {!isEditing && (
          <button
            onClick={startEditing}
            className="rounded-md bg-surface-tertiary px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
          >
            Edit
          </button>
        )}

        <button
          onClick={handleStartRename}
          className="rounded-md bg-surface-tertiary px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
        >
          Rename
        </button>

        {canHaveChildren && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="rounded-md bg-surface-tertiary px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
          >
            Add Child
          </button>
        )}

        {node.is_active ? (
          <button
            onClick={() => onDeactivate(node.node_id)}
            className="rounded-md bg-error/10 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/20 transition-colors"
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={() => onReactivate(node.node_id)}
            className="rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Reactivate
          </button>
        )}
      </div>

      {/* Add Child Form */}
      {isAdding && (
        <div className="flex gap-2 pt-1">
          <input
            value={addValue}
            onChange={e => setAddValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddChild(); if (e.key === 'Escape') setIsAdding(false); }}
            placeholder={`New ${LEVEL_LABELS[node.level === 'category' ? 'equipment_type' : node.level === 'equipment_type' ? 'component' : node.level === 'component' ? 'sub_component' : 'focus_area']?.toLowerCase() ?? 'node'} name...`}
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <button onClick={handleAddChild} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark transition-colors">Add</button>
          <button onClick={() => { setIsAdding(false); setAddValue(''); }} className="rounded-md bg-surface-tertiary px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">Cancel</button>
        </div>
      )}
    </div>
  );
}