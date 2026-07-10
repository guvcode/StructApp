import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Inspection } from '../../types/index';
import { useCalendarInspections, useRescheduleInspection, useReassignInspection } from '../../hooks/useCalendar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const INSPECTORS = [
  { id: '', name: 'All Inspectors' },
  { id: 'inspector-1', name: 'Eleanor Vance' },
  { id: 'inspector-2', name: 'Marcus Chen' },
  { id: 'inspector-3', name: 'Sarah Park' },
];

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [inspectorFilter, setInspectorFilter] = useState('');

  const { data: inspections = [], isLoading, isError, error, refetch } = useCalendarInspections(year, month, inspectorFilter || undefined);
  const rescheduleMutation = useRescheduleInspection();
  const reassignMutation = useReassignInspection();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedInspections, setSelectedInspections] = useState<Inspection[]>([]);
  const [actionInspection, setActionInspection] = useState<Inspection | null>(null);
  const [actionType, setActionType] = useState<'reschedule' | 'reassign' | null>(null);
  const [actionValue, setActionValue] = useState('');
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  const inspectionsByDay = useMemo(() => {
    const map: Record<number, Inspection[]> = {};
    for (const ins of inspections) {
      if (!ins.scheduled_date) continue;
      const parts = ins.scheduled_date.split('-').map(Number);
      const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
      const day = d.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(ins);
    }
    return map;
  }, [inspections]);

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setSelectedInspections(inspectionsByDay[day] || []);
    setActionInspection(null);
    setActionType(null);
    setActionValue('');
    setConfirmMessage(null);
    setActionError(null);
  };

  const handleAction = (ins: Inspection, type: 'reschedule' | 'reassign') => {
    setActionInspection(ins);
    setActionType(type);
    setActionValue('');
    setConfirmMessage(null);
    setActionError(null);
  };

  const handleConfirm = async () => {
    if (!actionInspection || !actionType) return;
    try {
      if (actionType === 'reschedule') {
        if (!actionValue) { setActionError('Please select a date'); return; }
        await rescheduleMutation.mutateAsync({ id: actionInspection.id, newDate: actionValue });
        setConfirmMessage(`Rescheduled to ${actionValue}`);
      } else {
        if (!actionValue) { setActionError('Please select an inspector'); return; }
        const name = INSPECTORS.find(i => i.id === actionValue)?.name ?? actionValue;
        await reassignMutation.mutateAsync({ id: actionInspection.id, newInspectorId: actionValue });
        setConfirmMessage(`Reassigned to ${name}`);
      }
      setActionType(null);
      setActionValue('');
      setActionInspection(null);
      refetch();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const closeDayModal = () => {
    setSelectedDay(null);
    setSelectedInspections([]);
    setActionInspection(null);
    setActionType(null);
    setConfirmMessage(null);
    setActionError(null);
  };

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="p-8 max-w-7xl animate-fadeIn">
      <button onClick={() => navigate('/reviewer/dashboard')} className="text-sm text-accent mb-4">&larr; Dashboard</button>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Schedule Board</h2>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={prevMonth} className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-secondary">&larr; Prev</button>
          <span className="text-lg font-semibold text-text-primary min-w-[180px] text-center">{monthName}</span>
          <button type="button" onClick={nextMonth} className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-secondary">Next &rarr;</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Inspector:</label>
          <select
            value={inspectorFilter}
            onChange={e => setInspectorFilter(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
          >
            {INSPECTORS.map(ins => (
              <option key={ins.id} value={ins.id}>{ins.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-secondary rounded animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-md border border-error/30 bg-error/5 p-4 text-error">{(error as Error)?.message || 'Failed to load calendar'}</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-text-secondary py-2">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 bg-surface-secondary/30 rounded" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayInspections = inspectionsByDay[day] || [];
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayClick(day)}
                className="h-24 bg-surface rounded border border-border hover:border-accent/50 hover:bg-surface-secondary/50 transition-all text-left p-1.5 overflow-hidden"
              >
                <span className="text-xs font-medium text-text-primary">{day}</span>
                <div className="mt-0.5 space-y-0.5">
                  {dayInspections.slice(0, 3).map(ins => (
                    <div key={ins.id} className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${ins.generated ? 'bg-accent/10 text-accent' : 'bg-surface-secondary text-text-primary'}`}>
                      {ins.assignee_name?.split(' ')[0] || 'N/A'}
                    </div>
                  ))}
                  {dayInspections.length > 3 && (
                    <div className="text-[10px] text-text-secondary pl-1">+{dayInspections.length - 3} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={closeDayModal}>
          <div className="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-surface border-b border-border px-5 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                {new Date(year, month, selectedDay).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button type="button" onClick={closeDayModal} className="text-text-secondary hover:text-text-primary text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {selectedInspections.length === 0 ? (
                <p className="text-sm text-text-secondary">No inspections scheduled for this day.</p>
              ) : (
                selectedInspections.map(ins => (
                  <div key={ins.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">{ins.assignee_name ? `${ins.assignee_name}${ins.assignee_email ? ` (${ins.assignee_email})` : ''}` : ins.assigned_to}</span>
                      {ins.generated && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">Generated</span>}
                    </div>
                    <p className="text-xs text-text-secondary mb-2">Structure: {ins.structure_id || 'N/A'}</p>
                    {actionInspection?.id === ins.id && actionType ? (
                      <div className="space-y-2">
                        {confirmMessage ? (
                          <div className="text-sm text-success bg-success/5 p-2 rounded">{confirmMessage}</div>
                        ) : (
                          <>
                            {actionError && <div className="text-xs text-error">{actionError}</div>}
                            {actionType === 'reschedule' ? (
                              <input type="date" value={actionValue} onChange={e => setActionValue(e.target.value)} className="w-full rounded border border-border bg-surface px-2 py-1 text-sm" />
                            ) : (
                              <select value={actionValue} onChange={e => setActionValue(e.target.value)} className="w-full rounded border border-border bg-surface px-2 py-1 text-sm">
                                <option value="">Select inspector...</option>
                                {INSPECTORS.filter(i => i.id).map(ins => (
                                  <option key={ins.id} value={ins.id}>{ins.name}</option>
                                ))}
                              </select>
                            )}
                            <div className="flex gap-2">
                              <button type="button" onClick={handleConfirm} className="rounded bg-accent px-3 py-1 text-xs text-white hover:bg-accent/90">Confirm</button>
                              <button type="button" onClick={() => { setActionInspection(null); setActionType(null); setActionError(null); }} className="rounded border border-border px-3 py-1 text-xs text-text-secondary hover:bg-surface-secondary">Cancel</button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      !confirmMessage && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleAction(ins, 'reschedule')} className="rounded border border-border px-2.5 py-1 text-[11px] text-text-secondary hover:bg-surface-secondary">Reschedule</button>
                          <button type="button" onClick={() => handleAction(ins, 'reassign')} className="rounded border border-border px-2.5 py-1 text-[11px] text-text-secondary hover:bg-surface-secondary">Reassign</button>
                        </div>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}