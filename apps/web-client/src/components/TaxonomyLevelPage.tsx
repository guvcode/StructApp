import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import { PicklistManager } from './PicklistManager';
import type { PicklistEntry } from '../types';
import Skeleton from './Skeleton';

const LEVEL_ORDER = ['category', 'equipment_type', 'component', 'sub_component', 'focus_area'];
const LEVEL_LABELS: Record<string, string> = {
  category: 'Category',
  equipment_type: 'Equipment Type',
  component: 'Component',
  sub_component: 'Sub-Component',
  focus_area: 'Focus Area',
};

interface TaxonomyNode {
  node_id: string;
  parent_id: string | null;
  level: string;
  category: string;
  label: string;
  display_order: number;
  is_active: boolean;
  deficiency_codes?: string[] | null;
  deficiency_mechanisms?: string[] | null;
}

interface TaxonomyLevelPageProps {
  level: string;
}

function toPicklistEntry(node: TaxonomyNode): PicklistEntry {
  return { id: node.node_id, type: 'component_type', name: node.label, isActive: node.is_active };
}

export function TaxonomyLevelPage({ level }: TaxonomyLevelPageProps) {
  const queryClient = useQueryClient();
  const [selectedAncestors, setSelectedAncestors] = useState<Record<string, string>>({});

  const levelIdx = LEVEL_ORDER.indexOf(level);
  const ancestorLevels = LEVEL_ORDER.slice(0, levelIdx);
  const immediateParentLevel = levelIdx > 0 ? LEVEL_ORDER[levelIdx - 1] : null;
  const label = LEVEL_LABELS[level] ?? level;

  const { data: allNodes = [], isLoading } = useQuery<TaxonomyNode[]>({
    queryKey: ['taxonomy'],
    queryFn: () => apiClient(ENDPOINTS.taxonomy.list),
  });

  const immediateParentId = immediateParentLevel ? (selectedAncestors[immediateParentLevel] ?? null) : null;

  const ancestorOptions = useMemo(() => {
    return ancestorLevels.map(ancLevel => {
      const parentAncLevelIdx = LEVEL_ORDER.indexOf(ancLevel) - 1;
      const parentAncLevel = parentAncLevelIdx >= 0 ? LEVEL_ORDER[parentAncLevelIdx] : null;
      const parentId = parentAncLevel ? (selectedAncestors[parentAncLevel] ?? null) : null;
      let options = allNodes.filter(n => n.level === ancLevel && n.is_active);
      if (parentId) options = options.filter(n => n.parent_id === parentId);
      return { level: ancLevel, options };
    });
  }, [allNodes, ancestorLevels, selectedAncestors]);

  const handleAncestorChange = useCallback((ancLevel: string, value: string) => {
    setSelectedAncestors(prev => {
      const next = { ...prev };
      const ancIdx = LEVEL_ORDER.indexOf(ancLevel);
      LEVEL_ORDER.slice(ancIdx + 1).forEach(l => delete next[l]);
      if (value) next[ancLevel] = value;
      else delete next[ancLevel];
      return next;
    });
  }, []);

  const entries = useMemo(() => {
    const levelNodes = allNodes.filter(n => n.level === level);
    if (immediateParentLevel && immediateParentId) {
      return levelNodes.filter(n => n.parent_id === immediateParentId).map(toPicklistEntry);
    }
    if (!immediateParentLevel) return levelNodes.map(toPicklistEntry);
    return [];
  }, [allNodes, level, immediateParentLevel, immediateParentId]);

  const selectedParentLabel = useMemo(() => {
    if (!immediateParentId) return '';
    const node = allNodes.find(n => n.node_id === immediateParentId);
    return node?.label ?? '';
  }, [immediateParentId, allNodes]);

  const addMutation = useMutation({
    mutationFn: (label_: string) =>
      apiClient(ENDPOINTS.taxonomy.create, {
        method: 'POST',
        body: JSON.stringify({
          parent_id: immediateParentId || null,
          level,
          category: selectedParentLabel,
          label: label_,
          display_order: 0,
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy'] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ nodeId, label_ }: { nodeId: string; label_: string }) =>
      apiClient(ENDPOINTS.taxonomy.update(nodeId), {
        method: 'PATCH',
        body: JSON.stringify({ label: label_ }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy'] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ nodeId, isActive }: { nodeId: string; isActive: boolean }) =>
      apiClient(ENDPOINTS.taxonomy.update(nodeId), {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !isActive }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy'] }),
  });

  const handleAdd = (name: string) => {
    if (immediateParentLevel && !immediateParentId) return;
    addMutation.mutate(name);
  };

  const handleRename = (id: string, name: string) => {
    renameMutation.mutate({ nodeId: id, label_: name });
  };

  const handleDeactivate = (id: string) => {
    const node = allNodes.find(n => n.node_id === id);
    if (node) toggleActiveMutation.mutate({ nodeId: id, isActive: node.is_active });
  };

  const handleReactivate = (id: string) => {
    const node = allNodes.find(n => n.node_id === id);
    if (node) toggleActiveMutation.mutate({ nodeId: id, isActive: node.is_active });
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-6 w-48 mb-4" /><Skeleton className="h-10 w-full rounded-lg mb-4" /><Skeleton className="h-64 w-full rounded-lg" /></div>;

  return (
    <div className="p-6 animate-fadeIn max-w-2xl">
      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link to="/categories" className="hover:text-accent transition-colors">Categories</Link>
        <span>/</span>
        <Link to="/categories/taxonomy" className="hover:text-accent transition-colors">Taxonomy</Link>
        <span>/</span>
        <span className="text-text-primary font-medium">{label}</span>
      </nav>
      {ancestorOptions.map(({ level: ancLevel, options }) => (
        <div key={ancLevel} className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-1">{LEVEL_LABELS[ancLevel] ?? ancLevel}</label>
          <select
            value={selectedAncestors[ancLevel] ?? ''}
            onChange={e => handleAncestorChange(ancLevel, e.target.value)}
            disabled={ancLevel !== LEVEL_ORDER[0] && !selectedAncestors[LEVEL_ORDER[LEVEL_ORDER.indexOf(ancLevel) - 1]!]}
            className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={LEVEL_LABELS[ancLevel] ?? ancLevel}
          >
            <option value="">Select {LEVEL_LABELS[ancLevel]?.toLowerCase() ?? ancLevel}...</option>
            {options.map(p => (
              <option key={p.node_id} value={p.node_id}>{p.label}</option>
            ))}
          </select>
        </div>
      ))}

      {immediateParentLevel && !immediateParentId ? (
        <p className="text-text-secondary text-sm">Select a {LEVEL_LABELS[immediateParentLevel]?.toLowerCase() ?? immediateParentLevel} to view and manage {label.toLowerCase()}s.</p>
      ) : (
        <PicklistManager
          entityLabel={label as 'Component Type'}
          entries={entries}
          onAdd={handleAdd}
          onRename={handleRename}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
        />
      )}
    </div>
  );
}