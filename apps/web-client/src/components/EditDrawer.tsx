import type { ReactNode } from 'react';

interface EditDrawerProps {
  title: string;
  saving?: boolean;
  valid?: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}

export default function EditDrawer({ title, saving, valid, onClose, onSave, children }: EditDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/5" />
      <div
        className="relative w-full max-w-md bg-surface-elevated shadow-2xl border-l border-border overflow-y-auto flex flex-col animate-slideInRight"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-elevated border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-secondary rounded-lg transition-colors" aria-label="Close drawer">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          {children}
        </div>
        <div className="sticky bottom-0 bg-surface-elevated border-t border-border px-6 py-4 flex gap-3">
          <button
            onClick={onSave}
            disabled={saving || valid === false}
            className="flex-1 py-3 px-4 bg-accent text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="py-3 px-6 bg-surface-secondary text-text-primary font-semibold rounded-lg hover:opacity-80 transition-opacity"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}