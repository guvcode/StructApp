import { Link } from 'react-router-dom';

const LEVELS = [
  { path: 'categories', label: 'Categories', desc: 'Top-level deficiency categories' },
  { path: 'components', label: 'Components', desc: 'Components within a category' },
  { path: 'sub-components', label: 'Sub-Components', desc: 'Sub-components within a component' },
  { path: 'focus-areas', label: 'Focus Areas', desc: 'Focus areas within a sub-component' },
  { path: 'deficiency-categories', label: 'Deficiency Categories', desc: 'Categories within a focus area' },
  { path: 'detailed-descriptions', label: 'Detailed Descriptions', desc: 'Detailed descriptions within a deficiency category' },
];

export default function TaxonomyLevelLandingPage() {
  return (
    <div className="p-6 animate-fadeIn">
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