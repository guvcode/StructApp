import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function UnsyncedWarningDialog({ open, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsynced-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-surface-primary rounded-lg shadow-xl p-6 max-w-sm mx-4"
      >
        <h2 id="unsynced-title" className="text-lg font-bold text-text-primary mb-2">
          Unsynced work detected
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          You have unsaved inspection data that has not been synced. Logging out will discard this
          data. Do you want to continue?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-secondary rounded-md hover:bg-border"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Log out anyway
          </button>
        </div>
      </div>
    </div>
  );
}