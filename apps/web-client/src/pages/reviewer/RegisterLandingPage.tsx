import { useRegisterLandingStats } from '../../hooks/useDashboard';
import { getActiveClientId } from '../../lib/authStore';
import { Link, useNavigate } from 'react-router-dom';
import Skeleton from '../../components/Skeleton';

export default function RegisterLandingPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useRegisterLandingStats(getActiveClientId());

  if (isLoading) {
    return <div className="p-6 text-text-secondary"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32 w-full rounded-lg" /></div>;
  }

  const projectCount = data?.projects.length ?? 0;
  const siteCount = data?.sites.length ?? 0;
  const structureCount = data?.structures.length ?? 0;

  return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="text-sm text-accent mb-4">&larr; Back</button>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Register Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/register/projects" className="block p-6 bg-surface-primary rounded-lg border border-border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-text-primary">Projects</h3>
          <p className="text-3xl font-bold text-accent mt-2">{projectCount}</p>
          <p className="text-text-secondary text-sm mt-1">View all projects</p>
        </Link>
        <Link to="/register/sites" className="block p-6 bg-surface-primary rounded-lg border border-border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-text-primary">Sites</h3>
          <p className="text-3xl font-bold text-accent mt-2">{siteCount}</p>
          <p className="text-text-secondary text-sm mt-1">View all sites</p>
        </Link>
        <Link to="/register/structures" className="block p-6 bg-surface-primary rounded-lg border border-border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-text-primary">Structures</h3>
          <p className="text-3xl font-bold text-accent mt-2">{structureCount}</p>
          <p className="text-text-secondary text-sm mt-1">View all structures</p>
        </Link>
      </div>

      <div className="flex gap-4">
        <Link to="/register/projects" className="py-2 px-4 bg-accent text-white font-medium rounded-md hover:opacity-90 transition-opacity">
          Manage Projects
        </Link>
        <Link to="/register/sites" className="py-2 px-4 border border-border text-text-primary font-medium rounded-md hover:bg-surface-secondary transition-colors">
          Manage Sites
        </Link>
        <Link to="/register/structures" className="py-2 px-4 border border-border text-text-primary font-medium rounded-md hover:bg-surface-secondary transition-colors">
          Manage Structures
        </Link>
        <Link to="/register/inspections/new" className="py-2 px-4 border border-border text-text-primary font-medium rounded-md hover:bg-surface-secondary transition-colors">
          New Inspection
        </Link>
      </div>
    </div>
  );
}