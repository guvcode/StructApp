# UI Tokens

Design tokens for StructApp. All colors, typography, spacing, and component values are defined here and consumed via Tailwind utility classes. Never hardcode hex values or use raw Tailwind color classes in components.

---

## How to Use

Tokens are defined using the `@theme` directive in the portal's `globals.css`. Tailwind generates utility classes from every `--color-*`, `--spacing-*`, `--radius-*`, and `--font-*` token.

```tsx
// Correct — uses generated utility classes
className="bg-surface text-text-primary border-border"

// Also correct — references CSS variable directly
style={{ color: 'var(--color-text-primary)' }}

// Never — hardcoded hex values
className="bg-[#F6F7FB] text-[#101828]"

// Never — raw Tailwind color classes
className="bg-purple-500 text-gray-600"
```

**Rules:**

- Never add a color to `tailwind.config.ts` — use `@theme` in `globals.css`
- Never use Tailwind's built-in color scales (`purple-500`, `gray-600`, etc.) — they are not in this project's palette
- The PWA shell reuses the same token set — `globals.css` is the single source of truth for both targets

---

## globals.css — Token Definition

```css
@import "tailwindcss";

@theme {
  /* Font */
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Page and surface backgrounds */
  --color-background: #f6f7fb;
  --color-surface: #ffffff;
  --color-surface-secondary: #f9fafb;
  --color-surface-tertiary: #f2f5f7;
  --color-surface-muted: #f4f5fb;

  /* Borders */
  --color-border: #e7eaf3;
  --color-border-light: #e5e7eb;
  --color-border-muted: #dfe1e7;

  /* Text */
  --color-text-primary: #101828;
  --color-text-secondary: #6a7282;
  --color-text-muted: #99a1af;
  --color-text-dark: #364153;
  --color-text-darker: #36394a;
  --color-text-darkest: #111827;
  --color-text-black: #131316;
  --color-text-slate: #272835;
  --color-text-slate-medium: #666d80;

  /* Primary accent — purple (engineering / inspection brand) */
  --color-accent: #7c5cfc;
  --color-accent-dark: #5e4cff;
  --color-accent-light: #f3e8ff;
  --color-accent-muted: #faf5ff;
  --color-accent-foreground: #ffffff;

  /* Severity scale (deficiency risk matrix) */
  --color-severity-1: #10b981;  /* P5 — cosmetic / informational */
  --color-severity-2: #61a8ff;  /* P4 — minor */
  --color-severity-3: #ff8904;  /* P3 — moderate */
  --color-severity-4: #ef4444;  /* P2 — major */
  --color-severity-5: #991b1b;  /* P1 — critical / safety */

  /* Success — green */
  --color-success: #10b981;
  --color-success-alt: #00bc7d;
  --color-success-dark: #007a55;
  --color-success-darker: #009966;
  --color-success-light: #d0fae5;
  --color-success-lightest: #ecfdf5;
  --color-success-foreground: #007a55;

  /* Info — blue */
  --color-info: #61a8ff;
  --color-info-dark: #155dfc;
  --color-info-medium: #2b7fff;
  --color-info-light: #dbeafe;
  --color-info-lightest: #eff6ff;
  --color-info-foreground: #155dfc;
  --color-info-muted: #94a2c5;

  /* Warning — orange */
  --color-warning: #ff8904;
  --color-warning-foreground: #ffffff;

  /* Error — red */
  --color-error: #ef4444;
  --color-error-foreground: #ffffff;

  /* Inspection status colors */
  --color-status-assigned: #6a7282;
  --color-status-in-progress: #2b7fff;
  --color-status-submitted: #ff8904;
  --color-status-returned: #ef4444;
  --color-status-approved: #10b981;

  /* Remediation status colors */
  --color-remediation-open: #ef4444;
  --color-remediation-scheduled: #ff8904;
  --color-remediation-pending: #2b7fff;
  --color-remediation-verified: #10b981;

  /* Dark overlays */
  --color-overlay: #111827;
  --color-overlay-dark: #131316;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows (card / popover / modal) */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1);
  --shadow-popover: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-modal: 0 12px 32px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.08);
}
```

---

## Color Usage Guide

### Page Layout

| Element | Token |
|---|---|
| Page background | `bg-background` |
| Card / surface | `bg-surface` |
| Secondary surface | `bg-surface-secondary` |
| Default border | `border-border` |
| Light border | `border-border-light` |

### Typography

| Element | Token |
|---|---|
| Headings, primary text | `text-text-primary` |
| Secondary text, labels | `text-text-secondary` |
| Placeholder, muted | `text-text-muted` |
| Dark labels | `text-text-dark` |

### Accent (Primary Purple)

Used for: primary buttons, active nav items, focus rings, the "Reopen" CTA.

| Element | Token |
|---|---|
| Button background | `bg-accent` |
| Button text | `text-accent-foreground` |
| Light badge background | `bg-accent-light` |
| Subtle background | `bg-accent-muted` |

### Severity (P1–P5)

Mapped from the deficiency `severity` field (1–5):

| Severity | P-level | Token | Use |
|---|---|---|---|
| 5 | P1 | `text-severity-5` / `bg-severity-5` | Critical / safety |
| 4 | P2 | `text-severity-4` / `bg-severity-4` | Major |
| 3 | P3 | `text-severity-3` / `bg-severity-3` | Moderate |
| 2 | P4 | `text-severity-2` / `bg-severity-2` | Minor |
| 1 | P5 | `text-severity-1` / `bg-severity-1` | Cosmetic / informational |

The P1 alert notification (FR-4.2) uses `bg-severity-5`; the P1 badge on a deficiency card uses the same.

### Inspection Status

| Status | Token | Notes |
|---|---|---|
| `Assigned` | `text-status-assigned` | Neutral |
| `In Progress` | `text-status-in-progress` | Blue |
| `Submitted` | `text-status-submitted` | Orange — awaiting review |
| `Returned` | `text-status-returned` | Red — sent back to contractor |
| `Approved` | `text-status-approved` | Green — terminal until reopened |

### Remediation Status

| Status | Token |
|---|---|
| `Open` | `text-remediation-open` |
| `Remediation_Scheduled` | `text-remediation-scheduled` |
| `Remediated_Pending_Verification` | `text-remediation-pending` |
| `Verified_Closed` | `text-remediation-verified` |

### Match Score / Risk Bars (Inspector-side)

If a numeric risk score is shown next to a deficiency (e.g. on a heatmap), use the same severity color stops as above. Risk = severity × probability × consequences, mapped to the same five-stop scale.

### Skills / State Badges

| Type | Background | Text |
|---|---|---|
| Matched requirement | `bg-success-lightest` | `text-success-foreground` |
| Missing requirement | `bg-accent-muted` | `text-accent` |
| Inactive picklist entry | `bg-surface-secondary` | `text-text-muted` |
| Active schedule | `bg-success-lightest` | `text-success-foreground` |
| Paused schedule | `bg-surface-secondary` | `text-text-secondary` |

---

## Typography

| Element | Size | Weight | Line height | Color token |
|---|---|---|---|---|
| Page title (H1) | 24px | 600 | 32px | `text-text-primary` |
| Section heading (H2) | 18px | 600 | 28px | `text-text-primary` |
| Card heading (H3) | 16px | 600 | 24px | `text-text-primary` |
| Body / primary text | 14px | 500 | 20px | `text-text-primary` |
| Secondary / label | 12px | 500 | 16px | `text-text-secondary` |
| Muted / timestamp | 12px | 400 | 16px | `text-text-muted` |
| Stat number | 30px | 600 | 36px | `text-text-primary` |
| Code / monospace | 13px | 400 | 20px | `text-text-primary` |

Font family: **Inter** for the UI; **JetBrains Mono** for code blocks, IDs, and JSON previews.

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| `gap-1` | 4px | Tight inline gaps |
| `gap-2` | 8px | Badge and tag gaps |
| `gap-3` | 12px | Form field gaps |
| `gap-4` | 16px | Section internal gaps |
| `gap-6` | 24px | Between sections |
| `gap-8` | 32px | Page section gaps |
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Large card padding |
| `px-4 py-2` | 16px / 8px | Button padding |
| `px-3 py-1` | 12px / 4px | Badge padding |

---

## Component Tokens

### Cards

```
background: bg-surface
border: 1px solid var(--border)
border-radius: 16px (rounded-2xl)
padding: 24px (p-6)
box-shadow: var(--shadow-card)
```

### Buttons

**Primary:**

```
background: bg-accent
text: text-accent-foreground
border-radius: rounded-md
padding: px-4 py-2
font-weight: font-medium
```

**Secondary:**

```
background: bg-surface
border: border border-border
text: text-text-primary
border-radius: rounded-md
padding: px-4 py-2
```

**Danger (Reopen, Delete):**

```
background: bg-error
text: text-error-foreground
```

**Ghost:**

```
background: transparent
text: text-text-secondary
hover: hover:bg-surface-secondary
```

### Input Fields

```
background: bg-surface
border: border border-border
border-radius: rounded-md
padding: px-3 py-2
text: text-text-primary
placeholder: text-text-muted
focus: ring-1 ring-accent border-accent
```

### Badges

```
border-radius: rounded-full
padding: px-2 py-0.5
font-size: text-xs
font-weight: font-medium
```

### Inspection / Remediation Status Pills

```
border-radius: rounded-full
padding: px-2 py-0.5
font-size: 12px
font-weight: 500
background: surface-secondary
text: text in the appropriate status token
```

### Risk / Severity Bar (deficiency card)

```
height: 4px
border-radius: rounded-full
background track: bg-border-light
fill: severity color stop
```

### Schedule Calendar Tile

**Assigned (confirmed):**

```
border: 1px solid var(--border)
background: bg-surface
border-radius: rounded-md
```

**Generated but unconfirmed (FR-10.1 surfaces these ahead of due date):**

```
border: 1px dashed var(--border)
background: bg-surface-secondary
border-radius: rounded-md
```

### Audit Log Row

```
font-family: font-mono (for table_name.record_id and JSON snippets)
text: text-text-primary
timestamp column: text-text-muted
```

---

## Invariants

- Never use hex values directly in components — always use CSS variables via Tailwind tokens
- Font is Inter — import via `next/font/google` (desktop) or self-host (PWA shell). Never fall back to system fonts
- Never use raw Tailwind color classes like `bg-purple-500` or `text-gray-600`
- `--accent` (#7C5CFC) is the only purple — never use Tailwind's built-in purple scale
- The five severity tokens (`--color-severity-1` through `--color-severity-5`) are the only colors mapped to P1–P5; never invent a sixth stop or shift the hue
- All borders default to `--border` (#E7EAF3)
- Status colors are role-bound: only an Admin/Reviewer UI renders the Reopen button in `--color-error`; the Contractor role (any device) never sees the danger button variant
