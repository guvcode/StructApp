import { useState } from 'react';
import { useProjects, useCreateProject, useUpdateProject } from '../../hooks/useRegister';
import { getActiveClientId } from '../../lib/authStore';
import type { Project } from '../../types';
import RegisterBreadcrumbs from '../../components/RegisterBreadcrumbs';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import EditDrawer from '../../components/EditDrawer';
import StatusBadge from '../../components/StatusBadge';
import { PROJECT_STATUS_STYLES } from '../../utils/statusMaps';

function ProjectEditDrawer({
  project,
  onClose,
  onSaved,
}: {
  project?: Project;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(project?.name || '');
  const [code, setCode] = useState(project?.code || '');
  const [status, setStatus] = useState(project?.status || 'active');
  const [region, setRegion] = useState(project?.region || '');
  const [startDate, setStartDate] = useState(project?.start_date || '');
  const [endDate, setEndDate] = useState(project?.end_date || '');
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const saving = createProject.isPending || updateProject.isPending;

  const handleSave = async () => {
    if (project) {
      await updateProject.mutateAsync({ id: project.id, input: { name, code, status, ...(region ? { region } : {}), ...(startDate ? { start_date: startDate } : {}), ...(endDate ? { end_date: endDate } : {}) } });
    } else {
      const clientId = getActiveClientId() || 'c-apex';
      await createProject.mutateAsync({ client_id: clientId, name, code, status, ...(region ? { region } : {}), ...(startDate ? { start_date: startDate } : {}), ...(endDate ? { end_date: endDate } : {}) });
    }
    onSaved();
    onClose();
  };

  return (
    <EditDrawer title={project ? 'Edit Project' : 'New Project'} saving={saving} valid={!!name.trim() && !!code.trim()} onClose={onClose} onSave={handleSave}>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Project Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Code</label>
        <input value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all">
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Region</label>
        <input value={region} onChange={e => setRegion(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">Start Date</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">End Date</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
      </div>
    </EditDrawer>
  );
}

export default function ProjectListPage() {
  const { data: projects = [], isLoading, refetch } = useProjects();
  const [search, setSearch] = useState('');
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
        <RegisterBreadcrumbs crumbs={[{ label: 'Projects' }]} />
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <RegisterBreadcrumbs crumbs={[{ label: 'Projects' }]} />
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Projects</h2>
        <button onClick={() => { setEditingProject(undefined); setShowCreate(true); }} className="px-4 py-2.5 bg-accent text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-all animate-buttonLift hover:animate-buttonLift-hover">
          New Project
        </button>
      </div>
      <Card className="mb-6 shadow-card">
        <input
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
        />
      </Card>
      {filtered.length === 0 ? (
        <Card padding="lg" className="shadow-card">
          <EmptyState icon={search ? 'search' : 'inbox'} title={search ? 'No projects match your search' : 'No projects yet'} description={search ? 'Try a different search term.' : 'Create your first project to get started.'} />
        </Card>
      ) : (
        <Card padding="none" className="shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-text-secondary font-semibold">Name</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Code</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Status</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Region</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Start Date</th>
                  <th className="px-6 py-3 text-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 text-text-primary font-medium">{p.name}</td>
                    <td className="py-4 text-text-secondary">{p.code}</td>
                    <td className="py-4">
                      <StatusBadge label={p.status} map={PROJECT_STATUS_STYLES} />
                        </td>
                    <td className="py-4 text-text-secondary">{p.region || '—'}</td>
                    <td className="py-4 text-text-secondary">{p.start_date || '—'}</td>
                    <td className="py-4">
                      <button onClick={() => { setEditingProject(p); setShowCreate(true); }} className="px-3 py-1.5 text-sm font-medium text-accent border border-accent-200 rounded-md hover:bg-accent/10 shadow-sm transition-colors">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {showCreate && (
        <ProjectEditDrawer
          {...(editingProject ? { project: editingProject } : {})}
          onClose={() => { setEditingProject(undefined); setShowCreate(false); }}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}