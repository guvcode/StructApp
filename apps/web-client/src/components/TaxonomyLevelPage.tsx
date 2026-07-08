import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';
import { ENDPOINTS } from '../services/api/endpoints';
import { PicklistManager } from './PicklistManager';
import type { PicklistEntry } from '../types';
import Skeleton from './Skeleton';

const LEVEL_ORDER = ['category', 'component', 'sub_component', 'focus_area', 'deficiency_category', 'detailed_description'];
const LEVEL_LABELS: Record<string, string> = {
  category: 'Category',
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
  const [selectedParent, setSelectedParent] = useState<string>('');

  const levelIdx = LEVEL_ORDER.indexOf(level);
  const parentLevel = levelIdx > 0 ? LEVEL_ORDER[levelIdx - 1] : null;
  const label = LEVEL_LABELS[level] ?? level;

  const { data: allNodes = [], isLoading } = useQuery<TaxonomyNode[]>({
    queryKey: ['taxonomy'],
    queryFn: () => apiClient(ENDPOINTS.taxonomy.list),
  });

  const parents = useMemo(() => {
    if (!parentLevel) return [];
    return allNodes.filter(n => n.level === parentLevel && n.is_active);
  }, [allNodes, parentLevel]);

  const entries = useMemo(() => {
    const levelNodes = allNodes.filter(n => n.level === level);
    if (parentLevel && selectedParent) {
      return levelNodes.filter(n => n.parent_id === selectedParent).map(toPicklistEntry);
    }
    if (!parentLevel) return levelNodes.map(toPicklistEntry);
    return [];
  }, [allNodes, level, parentLevel, selectedParent]);

  const selectedParentLabel = useMemo(() => {
    if (!selectedParent) return '';
    return parents.find(p => p.node_id === selectedParent)?.label ?? '';
  }, [selectedParent, parents]);

  const addMutation = useMutation({
    mutationFn: (label_: string) =>
      apiClient(ENDPOINTS.taxonomy.create, {
        method: 'POST',
        body: JSON.stringify({
          parent_id: selectedParent || null,
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
    if (parentLevel && !selectedParent) return;
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
      {parentLevel && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-1">{LEVEL_LABELS[parentLevel] ?? parentLevel}</label>
          <select
            value={selectedParent}
            onChange={e => setSelectedParent(e.target.value)}
            className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary"
          >
            <option value="">Select {LEVEL_LABELS[parentLevel]?.toLowerCase() ?? parentLevel}...</option>
            {parents.map(p => (
              <option key={p.node_id} value={p.node_id}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

      {parentLevel && !selectedParent ? (
        <p className="text-text-secondary text-sm">Select a {LEVEL_LABELS[parentLevel]?.toLowerCase() ?? parentLevel} to view and manage {label.toLowerCase()}s.</p>
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