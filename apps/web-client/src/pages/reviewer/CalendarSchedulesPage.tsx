import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules, useCreateSchedule, useUpdateSchedule, useToggleSchedulePause } from '../../hooks/useCalendar';
import type { InspectionSchedule } from '../../types/index';
import Card from '../../components/Card';

export default function CalendarSchedulesPage() {
  const navigate = useNavigate();
  const { data: schedules = [], isLoading, error, refetch } = useSchedules();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const togglePause = useToggleSchedulePause();
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<InspectionSchedule | null>(null);
  const [formData, setFormData] = useState({ structure_id: '', inspector_id: 'inspector-1', interval_days: 90, next_due_date: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingSchedule(null);
    setFormData({ structure_id: '', inspector_id: 'inspector-1', interval_days: 90, next_due_date: '' });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (sched: InspectionSchedule) => {
    setEditingSchedule(sched);
    setFormData({ structure_id: sched.structure_id, inspector_id: sched.inspector_id, interval_days: sched.interval_days, next_due_date: sched.next_due_date });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.structure_id || !formData.next_due_date) {
      setFormError('Structure ID and due date are required');
      return;
    }
    try {
      if (editingSchedule) {
        await updateSchedule.mutateAsync({ id: editingSchedule.id, input: { inspector_id: formData.inspector_id, interval_days: formData.interval_days, next_due_date: formData.next_due_date } });
      } else {
        await createSchedule.mutateAsync({ structure_id: formData.structure_id, inspector_id: formData.inspector_id, interval_days: formData.interval_days, next_due_date: formData.next_due_date });
      }
      setShowModal(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const handlePauseToggle = async (id: string) => {
    try {
      await togglePause.mutateAsync(id);
    } catch {
      // error handled by query client
    }
  };

  return (
    <div className="p-8 max-w-7xl animate-fadeIn">
      <button onClick={() => navigate('/calendar')} className="text-sm text-accent mb-4">&larr; Back to Calendar</button>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Recurring Schedules</h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          Create Schedule
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-error/30 bg-error/5 p-4 text-error text-sm">{(error as Error)?.message}</div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-secondary rounded animate-pulse" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <Card padding="lg" className="shadow-card">
          <p className="text-sm text-text-secondary">No recurring schedules yet. Create one to begin.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map(sched => (
            <Card key={sched.id} padding="lg" className="shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-text-primary">{sched.structure_name || sched.structure_id}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      sched.is_active ? 'bg-success/10 text-success' : 'bg-surface-secondary text-text-secondary'
                    }`}>
                      {sched.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Inspector:</span>
                      <span className="ml-1 text-text-primary">{sched.inspector_name || sched.inspector_id}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Interval:</span>
                      <span className="ml-1 text-text-primary">Every {sched.interval_days} days</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Next due:</span>
                      <span className="ml-1 text-text-primary">{new Date(sched.next_due_date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Created:</span>
                      <span className="ml-1 text-text-primary">{new Date(sched.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => openEdit(sched)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-secondary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePauseToggle(sched.id)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                      sched.is_active ? 'border-warning/50 text-warning hover:bg-warning/5' : 'border-success/50 text-success hover:bg-success/5'
                    }`}
                  >
                    {sched.is_active ? 'Pause' : 'Activate'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowModal(false)}>
          <div className="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
            </h3>

            {formError && <div className="mb-4 text-sm text-error bg-error/5 p-2 rounded">{formError}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Structure ID</label>
                <input
                  type="text"
                  value={formData.structure_id}
                  onChange={e => setFormData(p => ({ ...p, structure_id: e.target.value }))}
                  disabled={!!editingSchedule}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Inspector</label>
                <select
                  value={formData.inspector_id}
                  onChange={e => setFormData(p => ({ ...p, inspector_id: e.target.value }))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                >
                  <option value="inspector-1">Eleanor Vance</option>
                  <option value="inspector-2">Marcus Chen</option>
                  <option value="inspector-3">Sarah Park</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Interval (days)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.interval_days}
                  onChange={e => setFormData(p => ({ ...p, interval_days: parseInt(e.target.value, 10) || 1 }))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={formData.next_due_date}
                  onChange={e => setFormData(p => ({ ...p, next_due_date: e.target.value }))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
              >
                {editingSchedule ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}