import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import { PicklistManager } from './PicklistManager';
import type { PicklistEntry } from '../types';
import Skeleton from './Skeleton';

const LEVEL_ORDER = ['category', 'equipment_type', 'component', 'sub_component', 'focus_area', 'deficiency_category', 'detailed_description'];
const LEVEL_LABELS: Record<string, string> = {
  category: 'Category',
  equipment_type: 'Equipment Type',
  component: 'Component',
  sub_component: 'Sub-Component',
  focus_area: 'Focus Area',
  deficiency_category: 'Deficiency Category',
  detailed_description: 'Detailed Description',
};

interface TaxonomyNode {
  node_id: string;
  parent_id: string | null;
  level: string;
  category: string;
  label: string;
  display_order: number;
  is_active: boolean;
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

  const nodesByLevel = useMemo(() => {
    const map: Record<string, TaxonomyNode[]> = {};
    for (const n of allNodes) {
      (map[n.level] ??= []).push(n);
    }
    return map;
  }, [allNodes]);

  const childrenByParent = useMemo(() => {
    const map: Record<string, TaxonomyNode[]> = {};
    for (const n of allNodes) {
      if (n.parent_id) {
        (map[n.parent_id] ??= []).push(n);
      }
    }
    return map;
  }, [allNodes]);

  const handleAncestorChange = useCallback((ancestorLevel: string, nodeId: string) => {
    setSelectedAncestors(prev => {
      const updated = { ...prev, [ancestorLevel]: nodeId };
      const idx = LEVEL_ORDER.indexOf(ancestorLevel);
      for (let i = idx + 1; i < LEVEL_ORDER.length; i++) {
        const level = LEVEL_ORDER[i];
        if (level) delete updated[level];
      }
      return updated;
    });
  }, []);

  const ancestorOptions = useMemo(() => {
    const result: { level: string; options: TaxonomyNode[] }[] = [];
    for (const ancLevel of ancestorLevels) {
      if (ancLevel === LEVEL_ORDER[0]) {
        result.push({
          level: ancLevel,
          options: (nodesByLevel[ancLevel] || []).filter(n => n.is_active),
        });
      } else {
        const parentIdx = LEVEL_ORDER.indexOf(ancLevel) - 1;
        const parentLevel = LEVEL_ORDER[parentIdx]!;
        const parentId = parentLevel ? selectedAncestors[parentLevel] : undefined;
        if (parentId) {
          result.push({
            level: ancLevel,
            options: (childrenByParent[parentId] || []).filter(n => n.is_active),
          });
        } else {
          result.push({ level: ancLevel, options: [] });
        }
      }
    }
    return result;
  }, [ancestorLevels, nodesByLevel, childrenByParent, selectedAncestors]);

  const immediateParentId = immediateParentLevel ? selectedAncestors[immediateParentLevel] : null;

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