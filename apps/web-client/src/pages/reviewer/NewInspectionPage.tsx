import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useProjects, useSites, useStructures } from '../../hooks/useRegister';
import { useCreateInspections } from '../../hooks/useInspections';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { getActiveClientId } from '../../lib/authStore';
import RegisterBreadcrumbs from '../../components/RegisterBreadcrumbs';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';

export default function NewInspectionPage() {
  const navigate = useNavigate();
  const clientId = getActiveClientId();
  const { data: projects = [], isLoading: projectsLoading } = useProjects(clientId);
  const [selectedProject, setSelectedProject] = useState('');
  const { data: sites = [] } = useSites(selectedProject || undefined, clientId);
  const [selectedSite, setSelectedSite] = useState('');
  const { data: structures = [] } = useStructures(selectedSite || undefined, clientId);
  const [selectedStructures, setSelectedStructures] = useState<Set<string>>(new Set());
  const [inspectAll, setInspectAll] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState('');
  const createInspections = useCreateInspections();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data: inspectors = [] } = useQuery({
    queryKey: ['inspectors'],
    queryFn: () => apiClient<Array<{ id: string; email: string; display_name: string | null; role: string; is_active: boolean }>>(ENDPOINTS.users.list),
    select: (data) => data.filter(u => u.is_active && (u.role === 'Contractor' || u.role === 'Inspector')),
  });

  const toggleStructure = (id: string) => {
    setSelectedStructures(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!selectedSite || selectedStructures.size === 0 || !selectedInspector) return;
    setError('');
    try {
      await createInspections.mutateAsync({
        structure_ids: Array.from(selectedStructures),
        site_id: selectedSite,
        inspector_id: selectedInspector,
      });
      setSuccess(true);
    } catch {
      setError('Failed to create inspections.');
    }
  };

  if (projectsLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
        <RegisterBreadcrumbs crumbs={[{ label: 'New Inspection' }]} />
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-8 max-w-2xl mx-auto animate-fadeIn">
        <RegisterBreadcrumbs crumbs={[{ label: 'New Inspection' }]} />
        <Card padding="lg" className="shadow-card text-center">
          <div className="text-green-600 text-5xl mb-4">&#10003;</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Inspections Created</h2>
          <p className="text-text-secondary mb-6">
            {selectedStructures.size} inspection{selectedStructures.size !== 1 ? 's' : ''} assigned successfully.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/register/inspections/new')}
              className="px-4 py-2.5 bg-accent text-white font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              Create Another
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2.5 border border-border text-text-primary font-semibold rounded-lg hover:bg-surface-secondary transition-colors"
            >
              Back to Register
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <RegisterBreadcrumbs crumbs={[{ label: 'New Inspection' }]} />
      <h2 className="text-3xl font-bold text-text-primary mb-8">New Inspection</h2>

      <Card padding="lg" className="shadow-card mb-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" id="project-label">
              Project
            </label>
            <select
              aria-label="Project"
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setSelectedSite(''); setSelectedStructures(new Set()); setInspectAll(false); }}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2" id="site-label">
                Site
              </label>
              <select
                aria-label="Site"
                value={selectedSite}
                onChange={e => { setSelectedSite(e.target.value); setSelectedStructures(new Set()); setInspectAll(false); }}
                className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              >
                <option value="">Select site...</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {selectedSite && (
        <Card padding="lg" className="shadow-card mb-6">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Structures</h3>

          <label className="flex items-center gap-3 mb-4 p-3 bg-surface-secondary rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={inspectAll}
              onChange={e => {
                setInspectAll(e.target.checked);
                if (e.target.checked) setSelectedStructures(new Set(structures.map(s => s.id)));
                else setSelectedStructures(new Set());
              }}
              className="w-5 h-5 rounded border-border accent-accent"
            />
            <span className="text-text-primary font-medium">Inspect entire site ({structures.length} structures)</span>
          </label>

          {structures.length === 0 ? (
            <p className="text-text-secondary">No structures found for this site.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
              {structures.map(s => {
                const checked = selectedStructures.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      checked ? 'bg-accent/10 border border-accent/30' : 'hover:bg-surface-hover border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStructure(s.id)}
                      className="w-5 h-5 rounded border-border accent-accent"
                    />
                    <div className="flex-1">
                      <span className="text-text-primary font-medium">{s.name}</span>
                      <span className="text-text-secondary text-sm ml-2">({s.type})</span>
                    </div>
                    <span className="text-text-secondary text-xs">{s.identifier}</span>
                  </label>
                );
              })}
            </div>
          )}

          {selectedStructures.size > 0 && (
            <p className="text-sm text-text-secondary mt-3">
              {selectedStructures.size} structure{selectedStructures.size !== 1 ? 's' : ''} selected
            </p>
          )}
        </Card>
      )}

      {selectedSite && structures.length > 0 && (
        <Card padding="lg" className="shadow-card mb-6">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2" id="inspector-label">
              Assign To (Inspector)
            </label>
            <select
              aria-label="Inspector"
              value={selectedInspector}
              onChange={e => setSelectedInspector(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            >
              <option value="">Select inspector...</option>
              {inspectors.map(u => (
                <option key={u.id} value={u.id}>{u.display_name || u.email} ({u.role})</option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleCreate}
          disabled={createInspections.isPending || selectedStructures.size === 0 || !selectedInspector}
          className="px-4 py-2.5 bg-accent text-white font-semibold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {createInspections.isPending ? 'Creating...' : `Create ${selectedStructures.size > 0 ? `${selectedStructures.size} Inspection${selectedStructures.size !== 1 ? 's' : ''}` : 'Inspections'}`}
        </button>
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-2.5 border border-border text-text-primary font-semibold rounded-lg hover:bg-surface-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}