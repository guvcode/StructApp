import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BulkReassignDialog, InspectionForBulkReassign } from './BulkReassignDialog';

export interface InspectionForCalendar {
  inspection_id: string;
  structure_id: string;
  inspector_id: string;
  scheduled_date: string | null;
  status: string;
  asset_tag: string;
  structure_description: string;
}

interface CalendarViewProps {
  inspections: InspectionForCalendar[];
  onReschedule: (inspectionId: string, date: string) => Promise<void>;
  onReassign: (inspectionId: string, inspectorId: string, reason: string) => Promise<void>;
  onBulkReassign?: (sourceInspectorId: string, targetInspectorId: string, inspectionIds: string[], reason?: string) => Promise<{ reassignedCount: number }>;
}

type ViewMode = 'month' | 'week' | 'day';

export function InspectionCalendarView({
  inspections,
  onReschedule,
  onReassign,
  onBulkReassign,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null);
  const [bulkReassignSource, setBulkReassignSource] = useState<string | null>(null);

  const daysInMonth = useMemo(() => {
    if (viewMode !== 'month') return [];
    
    const days: Date[] = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  }, [viewMode]);

  const inspectionsByDate = useMemo(() => {
    return inspections.reduce((acc, insp) => {
      if (insp.scheduled_date) {
        const date = insp.scheduled_date.split('T')[0]!;
        if (!acc[date]) acc[date] = [];
        acc[date].push(insp);
      }
      return acc;
    }, {} as Record<string, InspectionForCalendar[]>);
  }, [inspections]);

  const inspectionsByInspector = useMemo(() => {
    return inspections.reduce((acc, insp) => {
      if (!acc[insp.inspector_id]) acc[insp.inspector_id] = [];
      acc[insp.inspector_id]!.push(insp);
      return acc;
    }, {} as Record<string, InspectionForCalendar[]>);
  }, [inspections]);

  const handleDateClick = (date: string, inspectionId: string) => {
    setSelectedInspection(inspectionId);
  };

  const handleBulkReassignClick = (inspectorId: string) => {
    setBulkReassignSource(inspectorId);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-primary font-semibold text-lg">Inspection Calendar</h2>
        <div className="flex space-x-2">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === mode
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface-secondary text-text-primary'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-text-secondary font-medium text-sm">
              {day}
            </div>
          ))}
          {daysInMonth.map((day, index) => {
            const dateStr = day.toISOString().split('T')[0]!;
            const dayInspections = inspectionsByDate[dateStr] || [];
            
            return (
              <div
                key={index}
                className="border border-border rounded-lg p-2 min-h-[80px] bg-surface"
              >
                <span className="text-sm text-text-muted">{day.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {dayInspections.map((insp: InspectionForCalendar) => (
                    <button
                      key={insp.inspection_id}
                      type="button"
                      onClick={() => handleDateClick(dateStr, insp.inspection_id)}
                      className="w-full text-left text-xs bg-accent/10 rounded px-1 py-0.5 truncate"
                      title={`${insp.asset_tag}: ${insp.status}`}
                    >
                      {insp.asset_tag}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {onBulkReassign && (
        <div className="mt-6">
          <h3 className="text-text-primary font-semibold mb-3">Inspectors</h3>
          <div className="space-y-2">
            {Object.entries(inspectionsByInspector).map(([inspectorId, inspList]) => {
              const openCount = inspList.filter((i) => i.status !== 'Approved').length;
              return (
                <div
                  key={inspectorId}
                  className="flex items-center justify-between bg-surface border border-border rounded-lg p-3"
                >
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      Inspector {inspectorId.slice(0, 8)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {inspList.length} inspection{inspList.length !== 1 ? 's' : ''} ({openCount} open)
                    </div>
                  </div>
                  {openCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBulkReassignClick(inspectorId)}
                      className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
                    >
                      Move all open work…
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedInspection && (
        <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-text-primary font-semibold mb-4">Inspection Actions</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const date = prompt('New date (YYYY-MM-DD)');
                  if (date) onReschedule(selectedInspection, date);
                  setSelectedInspection(null);
                }}
                className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => {
                  const inspector = prompt('New inspector ID');
                  const reason = prompt('Reason');
                  if (inspector && reason) onReassign(selectedInspection, inspector, reason);
                  setSelectedInspection(null);
                }}
                className="w-full rounded-md bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary border border-border"
              >
                Reassign
              </button>
              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="w-full rounded-md bg-surface-tertiary px-4 py-2 text-sm font-medium text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkReassignSource && onBulkReassign && (
        <BulkReassignDialog
          sourceInspectorId={bulkReassignSource}
          inspections={inspectionsByInspector[bulkReassignSource] || []}
          onClose={() => setBulkReassignSource(null)}
          onSuccess={() => setBulkReassignSource(null)}
        />
      )}
    </div>
  );
}