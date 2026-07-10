import { usePicklists, useAddPicklistItem, useDeactivatePicklistItem, useReactivatePicklistItem, useRenamePicklistItem } from '../hooks/usePicklists';
import { PicklistManager } from './PicklistManager';
import type { PicklistType } from '../types/index';
import { EntityLabel } from './PicklistManager';
import Card from './Card';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import { useNavigate } from 'react-router-dom';

interface GenericPicklistPageProps {
  picklistKey: PicklistType;
  entityLabel: EntityLabel;
  emptyTitle: string;
  emptyDescription: string;
}

const TYPE_MAP: Record<PicklistType, 'component-types' | 'work-types' | 'structure-types'> = {
  component_type: 'component-types',
  work_type: 'work-types',
  structure_type: 'structure-types',
};

export default function GenericPicklistPage({ picklistKey, entityLabel, emptyTitle, emptyDescription }: GenericPicklistPageProps) {
  const navigate = useNavigate();
  const apiType = TYPE_MAP[picklistKey];
  const { data: entries = [], isLoading } = usePicklists(apiType);
  const addItem = useAddPicklistItem(apiType);
  const deactivateItem = useDeactivatePicklistItem(apiType);
  const reactivateItem = useReactivatePicklistItem(apiType);
  const renameItem = useRenamePicklistItem(apiType);

  const handleAdd = async (name: string) => {
    await addItem.mutateAsync(name);
  };

  const handleRename = async (id: string, name: string) => {
    await renameItem.mutateAsync({ id, name });
  };

  const handleDeactivate = async (id: string) => {
    await deactivateItem.mutateAsync(id);
  };

  const handleReactivate = async (id: string) => {
    await reactivateItem.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-fadeIn space-y-4">
        <button onClick={() => navigate('/categories')} className="text-sm text-accent">&larr; Back to Register</button>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-6 animate-fadeIn">
        <button onClick={() => navigate('/categories')} className="text-sm text-accent mb-4">&larr; Back to Register</button>
        <Card padding="lg" className="shadow-card">
          <EmptyState icon="inbox" title={emptyTitle} description={emptyDescription} />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn max-w-2xl">
      <button onClick={() => navigate('/categories')} className="text-sm text-accent mb-4">&larr; Back to Register</button>
      <PicklistManager
        entityLabel={entityLabel}
        entries={entries}
        onAdd={handleAdd}
        onRename={handleRename}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
      />
    </div>
  );
}