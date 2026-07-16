import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useTimesheetGroups } from '../../hooks/useTimesheets';
import { useQueryClient } from '@tanstack/react-query';
import { useClientScope } from '../../hooks/useClientScope';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { TimesheetStatus } from '../../types';
import type { TimesheetGridData, TimesheetGridCell } from '../../types/index';

const STATUS_DOT_COLORS: Record<string, string> = {
  [TimesheetStatus.Approved]: 'bg-green-500',
  [TimesheetStatus.Submitted]: 'bg-blue-500',
  [TimesheetStatus.Rejected]: 'bg-red-500',
  Mixed: 'bg-yellow-400',
};

function getCellStatus(cell: TimesheetGridCell): string {
  const statuses = new Set(cell.entries.map(e => e.status));
  if (statuses.has(TimesheetStatus.Rejected)) return TimesheetStatus.Rejected;
  if (statuses.size === 1) return cell.entries[0]?.status ?? TimesheetStatus.Draft;
  return 'Mixed';
}

export default function TimesheetReviewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: gridData, isLoading, isError, error } = useTimesheetGroups();
  const [search, setSearch] = useState('');

  useClientScope(() => queryClient.invalidateQueries({ queryKey: ['timesheets'] }));

  const statusFilter = searchParams.get('status') || 'All';
  const FILTERS = ['All', TimesheetStatus.Submitted, TimesheetStatus.Approved, TimesheetStatus.Rejected, 'Mixed'];

  const filtered = useMemo<TimesheetGridData>(() => {
    if (!gridData) return { inspections: [], contractors: [], cells: [] };

    const searchLower = search.toLowerCase();
    const filteredContractors = gridData.contractors.filter(c =>
      c.user_name.toLowerCase().includes(searchLower)
    );
    const filteredInspections = gridData.inspections.filter(i =>
      i.inspection_name.toLowerCase().includes(searchLower) ||
      (i.project_name?.toLowerCase().includes(searchLower)) ||
      (i.structure_name?.toLowerCase().includes(searchLower))
    );

    const contractorIds = new Set(filteredContractors.map(c => c.user_id));
    const inspectionIds = new Set(filteredInspections.map(i => i.inspection_id));

    const filteredCells = gridData.cells.filter(cell => {
      if (!contractorIds.has(cell.user_id)) return false;
      if (!inspectionIds.has(cell.inspection_id)) return false;
      if (statusFilter === 'All') return true;
      return getCellStatus(cell) === statusFilter;
    });

    const usedInspIds = new Set(filteredCells.map(c => c.inspection_id));
    const usedConIds = new Set(filteredCells.map(c => c.user_id));
    const visibleInspections = gridData.inspections.filter(i => usedInspIds.has(i.inspection_id));
    const visibleContractors = gridData.contractors.filter(c => usedConIds.has(c.user_id));

    return {
      inspections: visibleInspections,
      contractors: visibleContractors,
      cells: filteredCells,
    };
  }, [gridData, search, statusFilter]);

  const cellMap = useMemo(() => {
    const map = new Map<string, TimesheetGridCell>();
    for (const cell of (filtered?.cells ?? [])) {
      map.set(`${cell.user_id}|${cell.inspection_id}`, cell);
    }
    return map;
  }, [filtered?.cells]);

  const handleCellClick = (cell: TimesheetGridCell) => {
    navigate('/timesheets/review/detail', {
      state: {
        user_id: cell.user_id,
        inspection_id: cell.inspection_id,
        entries: cell.entries,
        total_hours: cell.total_hours,
        status: cell.status,
      },
    });
  };

  if (isLoading) return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <Skeleton className="h-8 w-56 mb-6" />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
  if (isError) return <div className="p-6 text-red-600 text-center">{(error as Error)?.message || 'Failed to load timesheets.'}</div>;

  const noData = !gridData || gridData.cells.length === 0;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <button onClick={() => navigate(-1)} className="text-sm text-accent mb-4">&larr; Back</button>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Timesheet Review</h1>

      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setSearchParams({ status: f === 'All' ? '' : f })}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === f
                ? 'bg-accent text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {f}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by worker, inspection, project, or structure..."
          className="ml-auto px-3 py-1 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent w-56"
          aria-label="Search timesheet grid"
        />
      </div>

      {noData ? (
        <div className="bg-surface-elevated rounded-lg border border-border/50 p-8 shadow-sm">
          <EmptyState icon="inbox" title="No timesheets pending review" description="All submitted timesheets have been reviewed." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/20">
                <th className="px-4 py-3 text-left text-text-secondary font-semibold sticky left-0 bg-surface-secondary/20 z-10 min-w-[160px]">Inspection</th>
                <th className="px-4 py-3 text-left text-text-secondary font-semibold min-w-[140px]">Project</th>
                <th className="px-4 py-3 text-left text-text-secondary font-semibold min-w-[140px]">Structure</th>
                {filtered.contractors.map(c => (
                  <th key={c.user_id} className="px-4 py-3 text-center text-text-secondary font-semibold min-w-[130px]">{c.user_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.inspections.map(inspection => (
                <tr key={inspection.inspection_id} className="border-b border-border/50 hover:bg-surface-hover/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-text-primary sticky left-0 bg-surface z-10">{inspection.inspection_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{inspection.project_name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{inspection.structure_name || '—'}</td>
                  {filtered.contractors.map(contractor => {
                    const cell = cellMap.get(`${contractor.user_id}|${inspection.inspection_id}`);
                    if (!cell) return (
                      <td key={contractor.user_id} className="px-4 py-3 text-center text-text-disabled">—</td>
                    );
                    const cellStatus = getCellStatus(cell);
                    return (
                      <td
                        key={contractor.user_id}
                        onClick={() => handleCellClick(cell)}
                        className="px-4 py-3 text-center cursor-pointer hover:bg-surface-hover transition-colors rounded"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[cellStatus] ?? 'bg-gray-300'}`} />
                          <span className="font-medium text-text-primary">{cell.total_hours}h</span>
                          <span className="text-text-muted text-xs">({cell.entries.length})</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}