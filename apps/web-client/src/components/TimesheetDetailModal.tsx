import type { Timesheet } from '../types/index';
import StatusBadge from './StatusBadge';
import { TIMESHEET_STATUS_STYLES } from '../utils/statusMaps';

interface TimesheetDetailModalProps {
  entry: Timesheet;
  onClose: () => void;
}

export default function TimesheetDetailModal({ entry, onClose }: TimesheetDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface-primary rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Timesheet Entry</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-secondary rounded transition-colors">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</p>
              <p className="text-sm text-text-primary mt-1">{entry.entry_date}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Hours</p>
              <p className="text-sm text-text-primary mt-1 font-semibold">{entry.hours}h</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Work Type</p>
              <p className="text-sm text-text-primary mt-1">{entry.work_type ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</p>
              <div className="mt-1"><StatusBadge label={entry.status} map={TIMESHEET_STATUS_STYLES} /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Description</p>
            <p className="text-sm text-text-primary mt-1 whitespace-pre-wrap">{entry.notes || '—'}</p>
          </div>

          {entry.user_name && (
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Worker</p>
              <p className="text-sm text-text-primary mt-1">{entry.user_name}</p>
            </div>
          )}

          {entry.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Rejection Reason</p>
              <p className="text-sm text-red-600 mt-1">{entry.rejection_reason}</p>
            </div>
          )}

          {entry.approved_by && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Approved By</p>
                <p className="text-sm text-text-primary mt-1">{entry.approved_by}</p>
              </div>
              {entry.approved_at && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Approved At</p>
                  <p className="text-sm text-text-primary mt-1">{new Date(entry.approved_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Created</p>
            <p className="text-sm text-text-muted mt-1">{new Date(entry.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}