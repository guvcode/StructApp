import { useState } from 'react';
import { useStructures, useSites, useCreateStructure, useUpdateStructure } from '../../hooks/useRegister';
import { usePicklists } from '../../hooks/usePicklists';
import type { StructureAsset } from '../../types';
import RegisterBreadcrumbs from '../../components/RegisterBreadcrumbs';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import EditDrawer from '../../components/EditDrawer';

function StructureEditDrawer({
  structure,
  siteId,
  sites,
  structureTypes,
  onClose,
  onSaved,
}: {
  structure?: StructureAsset;
  siteId?: string;
  sites: { id: string; name: string }[];
  structureTypes: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(structure?.name || '');
  const [type, setType] = useState(structure?.type || '');
  const [identifier, setIdentifier] = useState(structure?.identifier || '');
  const [selectedSiteId, setSelectedSiteId] = useState(structure?.site_id || siteId || '');
  const createStructure = useCreateStructure();
  const updateStructure = useUpdateStructure();
  const saving = createStructure.isPending || updateStructure.isPending;

  const handleSave = async () => {
    if (structure) {
      await updateStructure.mutateAsync({ id: structure.id, input: { name, type, identifier } });
    } else {
      await createStructure.mutateAsync({ site_id: selectedSiteId, name, type, identifier });
    }
    onSaved();
    onClose();
  };

  return (
    <EditDrawer title={structure ? 'Edit Structure' : 'New Structure'} saving={saving} valid={!!name.trim() && !!type && !!identifier.trim() && (!!structure || !!selectedSiteId)} onClose={onClose} onSave={handleSave}>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Structure Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all">
          <option value="">Select a type...</option>
          {structureTypes.map(st => (
            <option key={st.id} value={st.name}>{st.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Identifier</label>
        <input value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
      {!structure && (
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Site</label>
          <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all">
            <option value="">Select a site...</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
    </EditDrawer>
  );
}

export default function StructureListPage() {
  const [siteFilter, setSiteFilter] = useState('');
  const [search, setSearch] = useState('');
  const { data: structures = [], isLoading, refetch } = useStructures();
  const { data: sites = [] } = useSites();
  const { data: structureTypesData = [] } = usePicklists('structure-types');
  const structureTypes = structureTypesData.filter(st => st.isActive).map(st => ({ id: st.id, name: st.name }));
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const [editingStructure, setEditingStructure] = useState<StructureAsset | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = structures.filter(s =>
    (!siteFilter || s.site_id === siteFilter) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.identifier.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
        <RegisterBreadcrumbs crumbs={[{ label: 'Structures' }]} />
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <RegisterBreadcrumbs crumbs={[{ label: 'Structures' }]} />
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Structures</h2>
        <button onClick={() => { setEditingStructure(undefined); setShowCreate(true); }} className="px-4 py-2.5 bg-accent text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all animate-buttonLift hover:animate-buttonLift-hover">
          New Structure
        </button>
      </div>
      <Card className="mb-6 shadow-card">
        <div className="flex gap-4">
          <input
            placeholder="Search by name or identifier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          />
          <select
            value={siteFilter}
            onChange={e => { setSiteFilter(e.target.value); setPage(0); }}
            className="px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          >
            <option value="">All Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </Card>
      {paged.length === 0 ? (
        <Card padding="lg" className="shadow-card">
          <EmptyState icon={search || siteFilter ? 'search' : 'inbox'} title={search || siteFilter ? 'No structures match your search' : 'No structures yet'} description={search || siteFilter ? 'Try different search or filter criteria.' : 'Create your first structure to get started.'} />
        </Card>
      ) : (
        <>
          <Card padding="none" className="shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-3 text-text-secondary font-semibold">Name</th>
                    <th className="px-6 py-3 text-text-secondary font-semibold">Type</th>
                    <th className="px-6 py-3 text-text-secondary font-semibold">Identifier</th>
                    <th className="px-6 py-3 text-text-secondary font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(st => (
                    <tr key={st.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 text-text-primary font-medium">{st.name}</td>
                      <td className="py-4 text-text-secondary capitalize">{st.type}</td>
                      <td className="py-4 text-text-secondary">{st.identifier}</td>
                      <td className="py-4">
                        <button onClick={() => { setEditingStructure(st); setShowCreate(true); }} className="px-3 py-1.5 text-sm font-medium text-accent border border-accent-200 rounded-md hover:bg-accent/10 shadow-sm transition-colors">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="mt-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">{filtered.length} total</p>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm font-medium border border-border-200 rounded-md text-text-primary hover:bg-surface-secondary shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md shadow-sm transition-colors ${i === page ? 'bg-accent text-white' : 'border border-border-200 text-text-primary hover:bg-surface-secondary'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm font-medium border border-border-200 rounded-md text-text-primary hover:bg-surface-secondary shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </Card>
        </>
      )}
      {showCreate && (
        <StructureEditDrawer
          {...(editingStructure ? { structure: editingStructure } : {})}
          {...(siteFilter ? { siteId: siteFilter } : {})}
          sites={sites}
          structureTypes={structureTypes}
          onClose={() => { setEditingStructure(undefined); setShowCreate(false); }}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}