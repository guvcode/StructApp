import { useCallback } from 'react';

export type InspectionMode = 'onsite' | 'post_inspection';

export interface InspectionModePickerProps {
  value: InspectionMode;
  onChange: (mode: InspectionMode) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function InspectionModePicker({
  value,
  onChange,
  disabled = false,
  disabledReason = 'Mode is locked once the first deficiency is logged',
}: InspectionModePickerProps) {
  const handleSelect = useCallback(
    (mode: InspectionMode) => {
      if (!disabled) {
        onChange(mode);
      }
    },
    [disabled, onChange]
  );

  const buttonClass = (mode: InspectionMode) => {
    const base = 'flex-1 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2';
    const isSelected = value === mode;
    if (disabled) {
      return `${base} ${isSelected ? 'bg-surface-tertiary text-text-primary' : 'bg-surface-secondary text-text-muted'} cursor-not-allowed`;
    }
    return `${base} ${isSelected ? 'bg-accent text-accent-foreground' : 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary'}`;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-text-primary">Capture mode</span>
        {disabled && (
          <span
            className="inline-flex items-center text-text-muted"
            title={disabledReason}
            aria-label={disabledReason}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z"
              />
            </svg>
          </span>
        )}
      </div>
      <div className="inline-flex rounded-md border border-border overflow-hidden" role="radiogroup" aria-label="Inspection capture mode">
        <button
          type="button"
          role="radio"
          aria-checked={value === 'onsite'}
          aria-label="On-site capture mode"
          disabled={disabled}
          onClick={() => handleSelect('onsite')}
          className={`${buttonClass('onsite')} rounded-l-md`}
        >
          <span className="mr-1" aria-hidden="true">📍</span>
          On-site
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === 'post_inspection'}
          aria-label="Post-inspection capture mode"
          disabled={disabled}
          onClick={() => handleSelect('post_inspection')}
          className={`${buttonClass('post_inspection')} rounded-r-md border-l border-border`}
        >
          <span className="mr-1" aria-hidden="true">📋</span>
          Post-inspection
        </button>
      </div>
    </div>
  );
}