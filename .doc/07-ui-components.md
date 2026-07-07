# 7. UI Rules, Token Architectures & Component Registry

> Full v2 §7 first. The full design-token table and UI rules are in `ui-tokens.md` and `ui-rules.md`; this file is the component-registry index that points to all of them.

## 7.1 Contextual Padding & Responsive Spacing Scales (v2)

```css
.density-field-form {
  @apply p-5 gap-4 mb-4; /* Mobile: touch-safe one-handed layout */
}
@media (min-width: 768px) {
  .density-field-form {
    @apply p-1.5 gap-2 mb-1; /* Desktop: dense spreadsheet padding */
  }
}
```

## 7.2 Shared Global Design Tokens (v2 baseline)

```css
@theme {
  --font-sans: "Inter", sans-serif;
  --color-primary-slate: #0f172a;
  --color-accent-blue: #2563eb;
  --color-success-green: #16a34a;
  --color-warning-amber: #d97706;
  --color-alert-red: #dc2626;
  --color-surface-light: #f8fafc;
  --color-surface-dark: #0f172a;
  --color-border-light: #e2e8f0;
  --color-border-dark: #1e293b;
}
```

> **Note:** these v2 tokens are the baseline. The current, expanded token set — including StructApp-specific tokens like the severity scale (P1–P5), inspection status colors, remediation status colors, and the audit log row typography — lives in `ui-tokens.md`. New components should use the `ui-tokens.md` definitions.

## 7.3 Global Styling & Accessibility Guardrails

- Touch targets ≥ 48×48px on mobile viewports.
- Loading skeletons (`animate-pulse bg-slate-200 dark:bg-slate-800`) for async tabular feeds.
- All form fields have a visible `<label>` — placeholder is not a label
- Color is never the only signal — severity pills also carry text, status pills also carry a small icon
- `aria-label` on icon-only buttons
- All interactive elements reachable via keyboard

## 7.4 Component Registry (v2)

### `<RiskMatrixBadge>`

```typescript
export interface RiskMatrixBadgeProps {
  severity: 1 | 2 | 3 | 4 | 5;
  probability: 1 | 2 | 3 | 4 | 5;
  consequences: 1 | 2 | 3 | 4 | 5;
  isOverridden?: boolean;          // renders an "Overridden" pill
  onOverride?: (justification: string, adjustedPriority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5') => void;
  isEditable: boolean;
}
```

### `<StructureAccordionRow>`

```typescript
export interface StructureAccordionRowProps {
  structureId: string;
  assetTag: string;
  description: string;
  historicalDeficienciesCount: number;
  isOpen: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}
```

### `<QrScanButton>`

```typescript
export interface QrScanButtonProps {
  onScanResult: (qrValue: string) => void;
  onScanError?: (reason: 'permission_denied' | 'no_match' | 'camera_unavailable') => void;
}
```

* Opens the device camera, decodes a QR/barcode value client-side, and calls `GET /structures?qr=<value>`. On no match, surfaces a clear "not found — search manually" fallback rather than a silent dead end.

### `<ConnectivityBanner>`

```typescript
export interface ConnectivityBannerProps {
  forcedStateOverride?: 'online' | 'offline';
}
```

* Online: `bg-emerald-600`. Offline: `bg-amber-600`, label "Offline Mode — Changes Safely Saving to Local Device Cache."

## 7.5 Component Registry (v3 Additions)

### `<InspectionCalendarView>`

```typescript
export interface InspectionCalendarViewProps {
  range: { from: string; to: string };
  inspectorFilter?: string;
  onReschedule: (inspectionId: string, newDate: string, newInspectorId?: string) => void;
}
```

* Month/week toggle. Generated-but-unconfirmed scheduled occurrences render visually distinct (e.g., dashed border) from confirmed `Assigned` inspections, since FR-10.1 surfaces them ahead of actual generation-due-date for planning purposes.

### `<PicklistManager>` (generic — reused for both component types and work types)

```typescript
export interface PicklistManagerProps {
  entityLabel: 'Component Type' | 'Work Type';
  entries: Array<{ id: string; name: string; isActive: boolean }>;
  onAdd: (name: string) => void;
  onDeactivate: (id: string) => void; // never a hard delete (FR-11.2)
}
```

### `<RemediationStatusTracker>`

```typescript
export interface RemediationStatusTrackerProps {
  status: 'Open' | 'Remediation_Scheduled' | 'Remediated_Pending_Verification' | 'Verified_Closed';
  canVerifyClose: boolean; // true only for Reviewer/Admin (FR-8.2)
  hasRemediationEvidence: boolean;
  onAdvance: (next: 'Remediation_Scheduled' | 'Remediated_Pending_Verification') => void;
  onVerifyClose: () => void;
}
```

* `onVerifyClose` is disabled (not just hidden) with an inline reason when `hasRemediationEvidence` is false, so the FR-8.2 evidence requirement is visible at the point of action, not just enforced as a server-side surprise.

### `<ReopenInspectionButton>` (Admin-only render)

```typescript
export interface ReopenInspectionButtonProps {
  inspectionId: string;
  currentStatus: 'Approved';
  onReopen: (targetStatus: 'Submitted' | 'Returned', reason: string) => void;
}
```

* Rendered conditionally by the caller based on role — this component itself doesn't re-check permissions, since the API's `403` (FR-9.3) is the actual enforcement boundary; the UI check is purely to avoid showing a button that will fail.

## 7.6 See Also

- `ui-tokens.md` — full token table (color, typography, spacing, component stacks, severity/status scales)
- `ui-rules.md` — font, layout, navbar, cards, typography, badges, buttons, form inputs, tables, picklists, calendar, status, audit log, empty states, loading/error states, offline/sync, Tailwind v4, accessibility, do-nots
