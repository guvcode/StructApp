import { useState } from 'react';
import { useSites, useProjects, useCreateSite, useUpdateSite } from '../../hooks/useRegister';
import type { Site } from '../../types';
import RegisterBreadcrumbs from '../../components/RegisterBreadcrumbs';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import EditDrawer from '../../components/EditDrawer';
import StatusBadge from '../../components/StatusBadge';
import { PROJECT_STATUS_STYLES } from '../../utils/statusMaps';

function SiteEditDrawer({
  site,
  projectId,
  projects,
  onClose,
  onSaved,
}: {
  site?: Site;
  projectId?: string;
  projects: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(site?.name || '');
  const [address, setAddress] = useState(site?.address || '');
  const [status, setStatus] = useState(site?.status || 'active');
  const [selectedProjectId, setSelectedProjectId] = useState(site?.project_id || projectId || '');
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const saving = createSite.isPending || updateSite.isPending;

  const handleSave = async () => {
    if (site) {
      await updateSite.mutateAsync({ id: site.id, input: { name, address, status } });
    } else {
      await createSite.mutateAsync({ project_id: selectedProjectId, name, address, status });
    }
    onSaved();
    onClose();
  };

  return (
    <EditDrawer title={site ? 'Edit Site' : 'New Site'} saving={saving} valid={!!name.trim() && !!address.trim() && (!!site || !!selectedProjectId)} onClose={onClose} onSave={handleSave}>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Site Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Address</label>
        <input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all">
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>
      {!site && (
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Project</label>
          <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all">
            <option value="">Select a project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
    </EditDrawer>
  );
}

export default function SiteListPage() {
  const [projectFilter, setProjectFilter] = useState('');
  const { data: sites = [], isLoading, refetch } = useSites(projectFilter || undefined);
  const { data: projects = [] } = useProjects();
  const [search, setSearch] = useState('');
  const [editingSite, setEditingSite] = useState<Site | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = sites.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
        <RegisterBreadcrumbs crumbs={[{ label: 'Sites' }]} />
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <RegisterBreadcrumbs crumbs={[{ label: 'Sites' }]} />
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Sites</h2>
        <button onClick={() => { setEditingSite(undefined); setShowCreate(true); }} className="px-4 py-2.5 bg-accent text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all animate-buttonLift hover:animate-buttonLift-hover">
          New Site
        </button>
      </div>
      <Card className="mb-6 shadow-card">
        <div className="flex gap-4">
          <input
            placeholder="Search sites..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          />
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </Card>
      {filtered.length === 0 ? (
        <Card padding="lg" className="shadow-card">
          <EmptyState icon={search ? 'search' : 'inbox'} title={search ? 'No sites match your search' : 'No sites yet'} description={search ? 'Try a different search term.' : 'Create your first site to get started.'} />
        </Card>
      ) : (
        <Card padding="none" className="shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-text-secondary font-semibold">Name</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Address</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Status</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 text-text-primary font-medium">{s.name}</td>
                    <td className="py-4 text-text-secondary">{s.address}</td>
                    <td className="py-4">
                      <StatusBadge label={s.status} map={PROJECT_STATUS_STYLES} />
                        </td>
                    <td className="py-4">
                      <button onClick={() => { setEditingSite(s); setShowCreate(true); }} className="px-3 py-1.5 text-sm font-medium text-accent border border-accent-200 rounded-md hover:bg-accent/10 shadow-sm transition-colors">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {showCreate && (
        <SiteEditDrawer
          {...(editingSite ? { site: editingSite } : {})}
          {...(projectFilter ? { projectId: projectFilter } : {})}
          projects={projects}
          onClose={() => { setEditingSite(undefined); setShowCreate(false); }}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}