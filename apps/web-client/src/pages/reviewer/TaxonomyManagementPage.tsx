import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaxonomyManager } from '../../components/TaxonomyManager';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Skeleton from '../../components/Skeleton';

type TaxonomyNode = {
  node_id: string;
  parent_id: string | null;
  level: string;
  category: string;
  label: string;
  display_order: number;
  is_active: boolean;
};

type AddInput = { parent_id: string | null; level: string; category: string; label: string; display_order: number };
type UpdateInput = { nodeId: string; updates: { label?: string; display_order?: number; is_active?: boolean } };

export default function TaxonomyManagementPage() {
  const queryClient = useQueryClient();

  const { data: nodes = [], isLoading } = useQuery<TaxonomyNode[]>({
    queryKey: ['taxonomy'],
    queryFn: () => apiClient(ENDPOINTS.taxonomy.list),
  });

  const addMutation = useMutation({
    mutationFn: (input: AddInput) => apiClient(ENDPOINTS.taxonomy.create, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ nodeId, updates }: UpdateInput) => apiClient(ENDPOINTS.taxonomy.update(nodeId), { method: 'PATCH', body: JSON.stringify(updates) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy'] }),
  });

  const categories = [...new Set(nodes.map(n => n.category).filter(Boolean))];

  if (isLoading) return <div className="p-6"><Skeleton className="h-6 w-48 mx-auto mb-2" /><Skeleton className="h-64 w-full rounded-lg" /></div>;

  return (
    <TaxonomyManager
      nodes={nodes}
      categories={categories}
      onAdd={(input) => addMutation.mutate(input)}
      onUpdate={(nodeId, updates) => updateMutation.mutate({ nodeId, updates })}
    />
  );
}