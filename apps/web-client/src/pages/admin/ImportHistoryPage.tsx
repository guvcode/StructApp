import { useNavigate } from 'react-router-dom';
import { useBatches } from '../../hooks/useImports';
import Card from '../../components/Card';

export default function ImportHistoryPage() {
  const navigate = useNavigate();
  const { data: allBatches = [], isLoading } = useBatches();

  const batches = [...allBatches].reverse();

  return (
    <div className="p-8 max-w-7xl animate-fadeIn">
      <button onClick={() => navigate('/admin/imports')} className="text-sm text-accent mb-4">&larr; Back to Import Center</button>
      <h2 className="text-3xl font-bold text-text-primary mb-8">Import History</h2>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-secondary rounded animate-pulse" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <Card padding="lg" className="shadow-card">
          <p className="text-sm text-text-secondary">No import batches found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <Card key={batch.id} padding="lg" className="shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-lg font-semibold text-text-primary">Batch #{batch.batch_number}</span>
                  <span className="text-sm text-text-secondary ml-4">
                    {new Date(batch.created_at).toLocaleString()}
                  </span>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  batch.status === 'Committed' ? 'bg-success/10 text-success' :
                  batch.status === 'Discarded' ? 'bg-error/10 text-error' :
                  batch.status === 'Validated' ? 'bg-warning/10 text-warning' :
                  'bg-surface-secondary text-text-secondary'
                }`}>
                  {batch.status}
                </span>
              </div>

              <div className="flex gap-6 mb-4 text-sm text-text-secondary">
                <span>{batch.valid_count} valid rows</span>
                <span>{batch.invalid_count} invalid rows</span>
                {batch.committed_at && <span>Committed: {new Date(batch.committed_at).toLocaleString()}</span>}
                {batch.discarded_at && <span>Discarded: {new Date(batch.discarded_at).toLocaleString()}</span>}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Project</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Site</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Asset Tag</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Structure</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batch.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-secondary">
                      <td className={`px-3 py-2 text-text-primary ${!row.project_title ? 'text-error' : ''}`}>
                        {row.project_title || <span className="italic text-error">Missing</span>}
                      </td>
                      <td className={`px-3 py-2 text-text-primary ${!row.site_name ? 'text-error' : ''}`}>
                        {row.site_name || <span className="italic text-error">Missing</span>}
                      </td>
                      <td className={`px-3 py-2 text-text-primary font-mono text-xs ${!row.asset_tag ? 'text-error' : ''}`}>
                        {row.asset_tag || <span className="italic text-error">Missing</span>}
                      </td>
                      <td className={`px-3 py-2 text-text-primary ${!row.structure_description ? 'text-error' : ''}`}>
                        {row.structure_description || <span className="italic text-error">Missing</span>}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.status === 'Valid' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">
                        {row.errors.length > 0 ? row.errors.join('; ') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}