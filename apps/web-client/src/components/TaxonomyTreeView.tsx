import { type TreeNode } from '../lib/buildTree';

const LEVEL_ICONS: Record<string, string> = {
  category: '📁',
  equipment_type: '⚙️',
  component: '🔧',
  sub_component: '🔩',
  focus_area: '🎯',
};

const LEVEL_COLORS: Record<string, string> = {
  category: 'text-accent',
  equipment_type: 'text-blue-600',
  component: 'text-emerald-600',
  sub_component: 'text-purple-600',
  focus_area: 'text-amber-600',
};

interface TreeViewProps {
  tree: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  expandedIds: Set<string>;
  onToggle: (nodeId: string) => void;
}

interface TreeViewItemProps {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  expandedIds: Set<string>;
  onToggle: (nodeId: string) => void;
  searchQuery: string;
}

function TreeViewItem({
  node,
  selectedId,
  onSelect,
  expandedIds,
  onToggle,
  searchQuery,
}: TreeViewItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.node_id);
  const isSelected = selectedId === node.node_id;

  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 rounded px-0.5">{text.slice(idx, idx + searchQuery.length)}</mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  return (
    <li>
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
          isSelected
            ? 'bg-accent-light text-accent-dark'
            : 'hover:bg-surface-tertiary text-text-primary'
        }`}
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); onToggle(node.node_id); }}
            className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className={`text-xs shrink-0 ${LEVEL_COLORS[node.level] ?? ''}`}>
          {LEVEL_ICONS[node.level] ?? '•'}
        </span>
        <span className="truncate flex-1">{highlightMatch(node.label)}</span>
        <span className="text-xs text-text-muted capitalize shrink-0">{node.level.replace('_', ' ')}</span>
      </div>
      {hasChildren && isExpanded && (
        <ul>
          {node.children.map(child => (
            <TreeViewItem
              key={child.node_id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
              searchQuery={searchQuery}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TaxonomyTreeView({ tree, selectedId, onSelect, expandedIds, onToggle }: TreeViewProps) {
  return (
    <ul className="space-y-0.5">
      {tree.map(node => (
        <TreeViewItem
          key={node.node_id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          expandedIds={expandedIds}
          onToggle={onToggle}
          searchQuery=""
        />
      ))}
    </ul>
  );
}