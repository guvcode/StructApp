import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

export default function RegisterBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-text-secondary mb-4">
      <Link to="/register" className="hover:text-accent transition-colors">Register</Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-text-tertiary">/</span>
          {crumb.to ? (
            <Link to={crumb.to} className="hover:text-accent transition-colors">{crumb.label}</Link>
          ) : (
            <span className="text-text-primary">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}