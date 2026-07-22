import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { buildTree, filterTree, getPathToNode, findNodeById, type TaxonomyNode, type TreeNode } from '../../lib/buildTree';
import { TaxonomyTreeView } from '../../components/TaxonomyTreeView';
import { PropertiesPanel } from '../../components/PropertiesPanel';
import Skeleton from '../../components/Skeleton';

export default function TaxonomyManagerPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const { data: allNodes = [], isLoading } = useQuery<TaxonomyNode[]>({
    queryKey: ['taxonomy'],
    queryFn: () => apiClient(ENDPOINTS.taxonomy.list),
  });

  const tree = useMemo(() => {
    let nodes = allNodes;
    if (filterLevel !== 'all') {
      nodes = allNodes.filter(n => n.level === filterLevel);
    }
    const built = buildTree(nodes);
    return searchQuery ? filterTree(built, searchQuery) : built;
  }, [allNodes, searchQuery, filterLevel]);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    const fullTree = buildTree(allNodes);
    return findNodeById(fullTree, selectedId);
  }, [allNodes, selectedId]);

  const selectedPath = useMemo(() => {
    if (!selectedId) return [];
    const fullTree = buildTree(allNodes);
    return getPathToNode(fullTree, selectedId);
  }, [allNodes, selectedId]);

  const addMutation = useMutation({
    mutationFn: ({ parentId, label }: { parentId: string; label: string }) => {
      const parent = allNodes.find(n => n.node_id === parentId);
      if (!parent) throw new Error('Parent node not found');
      const childLevel = parent.level === 'category' ? 'equipment_type'
        : parent.level === 'equipment_type' ? 'component'
        : parent.level === 'component' ? 'sub_component'
        : 'focus_area';
      return apiClient(ENDPOINTS.taxonomy.create, {
        method: 'POST',
        body: JSON.stringify({
          parent_id: parentId,
          level: childLevel,
          category: parent.category,
          label,
          display_order: 0,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ nodeId, label }: { nodeId: string; label: string }) =>
      apiClient(ENDPOINTS.taxonomy.update(nodeId), {
        method: 'PATCH',
        body: JSON.stringify({ label }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ nodeId, category }: { nodeId: string; category: string }) =>
      apiClient(ENDPOINTS.taxonomy.update(nodeId), {
        method: 'PATCH',
        body: JSON.stringify({ category }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] });
    },
  });

  const updateDisplayOrderMutation = useMutation({
    mutationFn: ({ nodeId, displayOrder }: { nodeId: string; displayOrder: number }) =>
      apiClient(ENDPOINTS.taxonomy.update(nodeId), {
        method: 'PATCH',
        body: JSON.stringify({ display_order: displayOrder }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ nodeId, isActive }: { nodeId: string; isActive: boolean }) =>
      apiClient(ENDPOINTS.taxonomy.update(nodeId), {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] });
    },
  });

  const handleSelect = useCallback((node: TreeNode) => {
    setSelectedId(node.node_id);
    setExpandedIds(prev => {
      const next = new Set(prev);
      const path = getPathToNode(buildTree(allNodes), node.node_id);
      for (const ancestor of path) next.add(ancestor.node_id);
      return next;
    });
  }, [allNodes]);

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleAddChild = useCallback((parentId: string, label: string) => {
    addMutation.mutate({ parentId, label });
  }, [addMutation]);

  const handleRename = useCallback((nodeId: string, label: string) => {
    renameMutation.mutate({ nodeId, label });
  }, [renameMutation]);

  const handleUpdateCategory = useCallback((nodeId: string, category: string) => {
    updateCategoryMutation.mutate({ nodeId, category });
  }, [updateCategoryMutation]);

  const handleUpdateDisplayOrder = useCallback((nodeId: string, displayOrder: number) => {
    updateDisplayOrderMutation.mutate({ nodeId, displayOrder });
  }, [updateDisplayOrderMutation]);

  const handleDeactivate = useCallback((nodeId: string) => {
    toggleActiveMutation.mutate({ nodeId, isActive: true });
  }, [toggleActiveMutation]);

  const handleReactivate = useCallback((nodeId: string) => {
    toggleActiveMutation.mutate({ nodeId, isActive: false });
  }, [toggleActiveMutation]);

  const LEVELS = ['all', 'category', 'equipment_type', 'component', 'sub_component', 'focus_area'];
  const LEVEL_LABELS: Record<string, string> = {
    all: 'All Levels',
    category: 'Category',
    equipment_type: 'Equipment Type',
    component: 'Component',
    sub_component: 'Sub-Component',
    focus_area: 'Focus Area',
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-fadeIn space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-96 w-96 rounded-lg" />
          <Skeleton className="h-96 flex-1 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn h-full flex flex-col">
      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-4 shrink-0">
        <Link to="/categories" className="hover:text-accent transition-colors">Categories</Link>
        <span>/</span>
        <span className="text-text-primary font-medium">Taxonomy Manager</span>
      </nav>

      <div className="flex gap-3 mb-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search taxonomy..."
            className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex gap-1.5">
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterLevel === level
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface-tertiary text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-96 bg-surface-elevated rounded-lg border border-border/50 shadow-card overflow-y-auto shrink-0">
          <div className="p-3">
            <TaxonomyTreeView
              tree={tree}
              selectedId={selectedId}
              onSelect={handleSelect}
              expandedIds={expandedIds}
              onToggle={handleToggle}
            />
            {tree.length === 0 && (
              <p className="text-sm text-text-muted text-center py-8">No taxonomy nodes found</p>
            )}
          </div>
        </div>
        <div className="flex-1 bg-surface-elevated rounded-lg border border-border/50 shadow-card p-6 overflow-y-auto">
          <PropertiesPanel
            node={selectedNode}
            path={selectedPath}
            onRename={handleRename}
            onUpdateCategory={handleUpdateCategory}
            onUpdateDisplayOrder={handleUpdateDisplayOrder}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onAddChild={handleAddChild}
          />
        </div>
      </div>
    </div>
  );
}