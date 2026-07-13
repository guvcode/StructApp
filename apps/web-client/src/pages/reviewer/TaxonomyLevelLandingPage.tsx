import { Link } from 'react-router-dom';

const LEVELS = [
  { path: 'categories', label: 'Categories', desc: 'Top-level deficiency categories' },
  { path: 'equipment-types', label: 'Equipment Types', desc: 'Equipment types within a category' },
  { path: 'components', label: 'Components', desc: 'Components within an equipment type' },
  { path: 'sub-components', label: 'Sub-Components', desc: 'Sub-components within a component' },
  { path: 'focus-areas', label: 'Focus Areas', desc: 'Focus areas within a sub-component' },
];

export default function TaxonomyLevelLandingPage() {
  return (
    <div className="p-6 animate-fadeIn">
      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link to="/categories" className="hover:text-accent transition-colors">Categories</Link>
        <span>/</span>
        <span className="text-text-primary font-medium">Taxonomy</span>
      </nav>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Other Taxonomies</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEVELS.map(level => (
          <Link
            key={level.path}
            to={`/categories/taxonomy/${level.path}`}
            className="block p-6 bg-surface-primary rounded-lg border border-border hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-text-primary">{level.label}</h3>
            <p className="text-text-secondary text-sm mt-1">{level.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}