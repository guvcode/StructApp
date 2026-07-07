import { useState } from 'react';
import { useBatches, useSimulateUpload, useCommitBatch, useDiscardBatch } from '../../hooks/useImports';
import type { ImportBatch } from '../../types/index';
import Card from '../../components/Card';

export default function ImportCenterPage() {
  const { data: allBatches = [], refetch: refetchBatches } = useBatches();
  const [currentBatch, setCurrentBatch] = useState<ImportBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const simulateUploadMutation = useSimulateUpload();
  const commitBatchMutation = useCommitBatch();
  const discardBatchMutation = useDiscardBatch();

  const recentBatches = allBatches.slice(-5).reverse();

  const handleSimulateUpload = async () => {
    setError(null);
    try {
      const batch = await simulateUploadMutation.mutateAsync();
      setCurrentBatch(batch);
      refetchBatches();
    } catch {
      setError('Upload failed');
    }
  };

  const handleCommit = async () => {
    if (!currentBatch) return;
    setError(null);
    try {
      const updated = await commitBatchMutation.mutateAsync(currentBatch.id);
      setCurrentBatch(updated);
      refetchBatches();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Commit failed');
    }
  };

  const handleDiscard = async () => {
    if (!currentBatch) return;
    setError(null);
    try {
      const updated = await discardBatchMutation.mutateAsync(currentBatch.id);
      setCurrentBatch(updated);
      refetchBatches();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Discard failed');
    }
  };

  return (
    <div className="p-8 max-w-7xl animate-fadeIn">
      <h2 className="text-3xl font-bold text-text-primary mb-8">Import Center</h2>

      {error && (
        <div className="mb-6 rounded-md border border-error/30 bg-error/5 p-4 text-error text-sm">
          {error}
        </div>
      )}

      <Card padding="lg" className="shadow-card mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">CSV Batch Import</h3>
            <p className="text-sm text-text-secondary mt-1">Upload a CSV to stage, validate, and commit register data.</p>
          </div>
          <button
            type="button"
            onClick={handleSimulateUpload}
            disabled={simulateUploadMutation.isPending}
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {simulateUploadMutation.isPending ? 'Simulating...' : 'Simulate Upload'}
          </button>
        </div>

        {currentBatch && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-surface-secondary px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                Batch #{currentBatch.batch_number} — {currentBatch.valid_count} valid, {currentBatch.invalid_count} invalid
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                currentBatch.status === 'Committed' ? 'bg-success/10 text-success' :
                currentBatch.status === 'Discarded' ? 'bg-error/10 text-error' :
                currentBatch.status === 'Validated' ? 'bg-warning/10 text-warning' :
                'bg-surface-secondary text-text-secondary'
              }`}>
                {currentBatch.status}
              </span>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Project</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Site</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Asset Tag</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Structure</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentBatch.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-secondary">
                    <td className={`px-4 py-2.5 text-text-primary ${!row.project_title ? 'text-error' : ''}`}>
                      {row.project_title || <span className="italic text-error">Missing</span>}
                    </td>
                    <td className={`px-4 py-2.5 text-text-primary ${!row.site_name ? 'text-error' : ''}`}>
                      {row.site_name || <span className="italic text-error">Missing</span>}
                    </td>
                    <td className={`px-4 py-2.5 text-text-primary font-mono text-xs ${!row.asset_tag ? 'text-error' : ''}`}>
                      {row.asset_tag || <span className="italic text-error">Missing</span>}
                    </td>
                    <td className={`px-4 py-2.5 text-text-primary ${!row.structure_description ? 'text-error' : ''}`}>
                      {row.structure_description || <span className="italic text-error">Missing</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === 'Valid' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary text-xs">
                      {row.errors.length > 0 ? row.errors.join('; ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {currentBatch.status === 'Validated' && (
              <div className="flex items-center gap-3 px-4 py-3 bg-surface-secondary border-t border-border">
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={commitBatchMutation.isPending || currentBatch.valid_count === 0}
                  className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commitBatchMutation.isPending ? 'Processing...' : 'Commit Batch'}
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={discardBatchMutation.isPending}
                  className="rounded-md border border-error/50 px-4 py-2 text-sm font-medium text-error hover:bg-error/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Discard
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card padding="lg" className="shadow-card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Batches</h3>
        {recentBatches.length === 0 ? (
          <p className="text-sm text-text-secondary">No batches yet.</p>
        ) : (
          <div className="space-y-3">
            {recentBatches.map((batch) => (
              <div key={batch.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-text-primary">Batch #{batch.batch_number}</span>
                  <span className="text-xs text-text-secondary ml-3">
                    {batch.valid_count} valid / {batch.invalid_count} invalid
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    batch.status === 'Committed' ? 'bg-success/10 text-success' :
                    batch.status === 'Discarded' ? 'bg-error/10 text-error' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {batch.status}
                  </span>
                  <span className="text-xs text-text-secondary">{new Date(batch.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}