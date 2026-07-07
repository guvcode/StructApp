# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### `<Card>`

File: `apps/web-client/src/components/Card.tsx`
Last updated: 2026-06-26

Elevated surface component matching dashboard-blueprint.png design system.

**Props:**
- `variant`: `'elevated'` (default, with shadow) | `'flat'` (border only) | `'outlined'` (thicker border)
- `padding`: `'none'` | `'sm'` (16px) | `'md'` (24px, default) | `'lg'` (32px)
- `className`: Additional Tailwind classes
- `children`: ReactNode content

| Property | Class |
|----------|-------|
| Base | `bg-surface-elevated rounded-lg` |
| Elevated variant | `shadow-sm border border-border/50` |
| Flat variant | `border border-border` |
| Outlined variant | `border-2 border-border` |
| Default padding | `p-6` (24px) |

**Pattern notes:**
- Use `<Card>` for all major content surfaces (stat cards, tables, forms)
- Default `elevated` variant provides soft shadow matching blueprint
- Use `padding="none"` for tables/lists that need edge-to-edge content
- `border-border/50` creates subtle border at 50% opacity
- Replaces inline `bg-surface-primary rounded-lg border border-border p-4` patterns

---

### `<QrScanButton>`

File: `apps/web-client/src/components/QrScanButton.tsx`
Last updated: 2026-06-20

| Property     | Class |
|--------------|-------|
| Background   | `bg-accent` |
| Text         | `text-accent-foreground` |
| Border radius| `rounded-md` |
| Padding      | `px-4 py-2` |
| Font weight  | `font-medium` |
| Font size    | `text-sm` |
| Hover state  | `hover:opacity-90` |
| Focus ring   | `focus:ring-2 focus:ring-accent focus:ring-offset-2` |

**Modal / Overlay:**
| Property         | Class |
|-----------------|-------|
| Overlay | `fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4` |
| Modal container | `bg-surface rounded-xl p-6 w-full max-w-sm` |
| Modal title | `text-text-primary font-semibold mb-4` |
| Cancel button bg | `bg-surface-secondary` |
| Cancel button text | `text-text-primary` |
| Cancel button border | `border border-border` |
| Cancel button hover | `hover:bg-surface-tertiary` |

**Pattern notes:**
- Icon uses inline SVG with `aria-hidden="true"`, button and video have `aria-label` for accessibility
- Scanner modal uses fixed overlay pattern for camera full-screen experience
- Cancel button uses secondary ghost button pattern (`bg-surface-secondary`) with `aria-label="Cancel QR scan"`
- Error text uses `text-error` class
- Uses `@zxing/browser` for QR decoding with 500ms scan interval
- `no_match` callback fires after 30s of no QR detection

---

## Hooks

### `useConnectivity`

File: `apps/web-client/src/hooks/useConnectivity.ts`
Last updated: 2026-06-20

Returns: `{ isOnline: boolean, isReconnecting: boolean, pendingSyncCount: number, triggerSync: () => Promise<void> }`

**Pattern notes:**
- Monitors `navigator.onLine` via `online`/`offline` window events
- Counts pending sync items from Dexie `deficiencies` (syncState='Pending_Sync') and `pinOutbox` tables on mount and when tab becomes visible
- Dispatches `structapp:sync-trigger` custom event when `triggerSync()` is called while online
- Used by `<ConnectivityBanner>` component (spec in `07-ui-components.md`)