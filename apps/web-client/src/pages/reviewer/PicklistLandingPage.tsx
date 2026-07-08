import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { usePicklists } from '../../hooks/usePicklists';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import Skeleton from '../../components/Skeleton';

export default function PicklistLandingPage() {
  const { data: ct = [] } = usePicklists('component-types');
  const { data: wt = [] } = usePicklists('work-types');
  const { data: taxonomyNodes = [] } = useQuery<Array<unknown>>({
    queryKey: ['taxonomy'],
    queryFn: () => apiClient<Array<unknown>>(ENDPOINTS.taxonomy.list),
  });
  const loading = ct.length === 0 && wt.length === 0;

  if (loading) {
    return (
      <div className="p-6 animate-fadeIn space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Register</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/categories/component-types"
          className="block p-6 bg-surface-primary rounded-lg border border-border hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-text-primary">Component Types</h3>
          <p className="text-3xl font-bold text-accent mt-2">{ct.length}</p>
          <p className="text-text-secondary text-sm mt-1">Manage component types</p>
        </Link>
        <Link
          to="/categories/work-types"
          className="block p-6 bg-surface-primary rounded-lg border border-border hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-text-primary">Work Types</h3>
          <p className="text-3xl font-bold text-accent mt-2">{wt.length}</p>
          <p className="text-text-secondary text-sm mt-1">Manage work types</p>
        </Link>
        <Link
          to="/categories/taxonomy"
          className="block p-6 bg-surface-primary rounded-lg border border-border hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-text-primary">Deficiency Taxonomy</h3>
          <p className="text-3xl font-bold text-accent mt-2">{(taxonomyNodes as Array<unknown>).length}</p>
          <p className="text-text-secondary text-sm mt-1">Manage categories, components, sub-components, and detailed descriptions</p>
        </Link>
      </div>
    </div>
  );
}