# UI Rules

Concise rules for building StructApp UI. The tokens in `ui-tokens.md` are the source of truth for visual decisions; this file covers the *patterns* and *constraints* that apply to the single web app across all device classes (phone, tablet, laptop/desktop). The same components render at different layout densities; the same routing tree serves all roles. These rules keep the UI consistent without over-specifying every detail.

---

## Font

- Always import Inter via `next/font/google` in the root layout of the web app
- The PWA install (when the user adds the app to their home screen) self-hosts the same Inter family (no Google Fonts request from a Service Worker)
- Apply the `--font-sans` variable class to the `<html>` tag in root layout
- Use `--font-mono` (JetBrains Mono) for IDs, audit log rows, and code / JSON previews
- Never use system fonts as the primary font

---

## Layout

### Desktop portal

- Page max-width: 1440px, centered
- Main content area padding: 32px on all sides
- Gap between page sections: 24px
- Header height: 64px, full width, white background, padding 0 24px
- All pages use top navbar only — no sidebar, no drawer

### Phone layout (≤ 768px)

- Single-column layout, full viewport width
- Top app bar: 56px, brand left, sync indicator right
- Bottom safe-area padding on all screens (`env(safe-area-inset-bottom)`)
- Touch targets ≥ 44×44px — never smaller
- No hover-only affordances — every action is reachable via tap

### Tablet layout (769–1023px)

- Two-column where it helps (deficiency list + detail side-by-side)
- Top navbar instead of bottom app bar (enough real estate)
- Touch targets ≥ 44×44px — same as phone, no smaller

### Laptop / desktop layout (≥ 1024px)

- Full multi-column layout: top navbar, multi-pane Splice Dashboard, two-column photo galleries
- See "Navbar (desktop)" below

---

## Navbar (desktop)

- Five items: Dashboard, Inspections, Calendar (Admin/Reviewer only), Deliverables, Profile
- Active item: `text-accent`, font-weight 500, 14px
- Inactive item: `text-text-dark`, font-weight 500, 14px
- No underline — active state is color change only
- Navbar always white background, full viewport width
- The "Audit Log" link is **Admin-only** and is never rendered to a Reviewer build (see FR-9.3 / Section 1.4 #4) — the server enforces 403, the client simply doesn't render the link

---

## App Bar (PWA)

- Title left, sync indicator right
- Sync indicator states: idle (muted), syncing (spinner, accent), error (red dot with retry CTA), offline (gray cloud icon)
- Tapping the indicator opens the Sync Hub bottom sheet

---

## Cards

Every content section lives in a card. See `ui-tokens.md` → "Component Tokens → Cards" for the full token stack.

- Never use colored card backgrounds — always white (`bg-surface`)
- Color goes inside cards via badges, bars, and text — never on the card surface itself
- Status / severity color always appears on a pill or bar, never as a card tint
- Card padding: 24px on desktop, 16px on PWA

---

## Typography Hierarchy

Three levels used consistently:

**Section headings** — card titles, page section titles

```
font-size: 16px (desktop) / 18px (PWA)
font-weight: 600
color: text-text-primary
line-height: 24px / 28px
```

**Body / primary content text**

```
font-size: 14px (desktop) / 16px (PWA)
font-weight: 500
color: text-text-primary
line-height: 20px / 24px
```

**Secondary / muted text** — labels, timestamps, subtitles

```
font-size: 12px
font-weight: 400
color: text-text-muted
line-height: 16px
```

Stat numbers on the dashboard use 30px / weight 600 / `text-text-primary`.

---

## Badges

- All badges use `border-radius: 9999px` (pill) unless specified otherwise
- Status / severity / state badges: see `ui-tokens.md` → "Skills / State Badges" and "Inspection Status"
- Trend badges on stat cards: `border-radius: 4px` (not pill) with `--color-success-lightest` background and `--color-success-darker` text

---

## Buttons

- Primary: `bg-accent` / `text-accent-foreground` / 8px radius / `px-4 py-2` / weight 500
- Secondary: `bg-surface` / 1px `border-border` / `text-text-primary`
- Danger: `bg-error` / `text-error-foreground` — Admin-only (Reopen, Delete); never rendered to a Contractor build
- Ghost: transparent, `hover:bg-surface-secondary`
- Disabled state: 50% opacity, `cursor-not-allowed`, never a different color

**The "Reopen Inspection" button (FR-9)** is rendered only when `req.user.role === 'Admin'` AND the inspection status is `Approved`. The button itself does not re-check permissions; the API returns 403 if the role is wrong. The UI just hides the button.

---

## Form Inputs

```
background: bg-surface
border: 1px solid var(--border)
border-radius: 8px
padding: 8px 12px
font-size: 14px
color: text-text-primary
placeholder color: text-text-muted
focus: ring-1 ring-accent border-accent
```

- PWA form fields: full width on mobile, min 16px font to prevent iOS zoom
- Disabled inputs: `bg-surface-secondary`, `text-text-muted`, no focus ring
- Required-field indicator: red asterisk in `text-error` next to the label

---

## Tables

- No alternating row colors — white rows only, separated by border
- Row border: `1px solid var(--border)` between rows
- Column headers: uppercase, 12px, font-weight 500, color `text-text-secondary`
- Row text: 14px, color `text-text-primary`
- Hover state: `bg-surface-secondary`
- Sticky header on long lists (Inspections, Audit Log) — never scroll out of view

---

## Picklists (Component Type / Work Type)

- The dropdown is the entry point for any field formerly free-text (FR-11)
- Inactive entries (`is_active = false`) never appear in the dropdown but are selectable on historical records read-only — labeled "(inactive)"
- The `<PicklistManager>` screen is Admin/Reviewer only — server-gated via role middleware. A Contractor reaching `/picklists` gets a `403`, regardless of device.
- "Add new…" appears at the bottom of the dropdown; clicking it opens an inline form (no modal)

---

## Inspection Capture Mode (FR-16)

- The mode picker appears at the top of the Structural Evaluation Form, before any deficiency is logged
- Two segmented buttons: **On-site** (default) | **Post-inspection**
- On-site selected: GPS fields on every deficiency card show a "📍 Capturing…" indicator and the auto-populated values (which the inspector can edit or clear)
- Post-inspection selected: GPS fields show a muted "GPS not auto-captured (post-inspection mode)" hint, the Geolocation API is not invoked, fields default to null but the inspector can enter coordinates by hand
- Once a deficiency is logged on the inspection, the mode picker is disabled and shows a lock icon with tooltip "Mode is locked once the first deficiency is logged"
- Changing mode after the first deficiency is blocked at both API and UI; an Admin can fix a misclick via `PATCH /inspections/:id/inspection-mode` from the desktop Splice Dashboard

## Deficiency Cards

- Card title = `component_type` label; subtitle = `description` (truncated to 2 lines)
- Severity pill top-right, color from the severity scale (P1–P5)
- GPS pin icon (if coords present) at the bottom-left
- Photo count badge at the bottom-right
- Tapping the card opens the deficiency detail view (Reviewer/Admin) or the read-only view (Contractor)
- `remediation_status` shown as a small pill below the description — see `ui-tokens.md` → "Remediation Status"

## Timesheet Entries (FR-17)

- Timesheet list and Splice Dashboard's timesheet panel render each entry as a row
- Any entry with `pre_inspection = true` is rendered with a **yellow left border** (4px, `--color-warning`) and an inline tag "Logged before inspection date" next to the work-type label
- The flag is informational only — it does not block submission, does not change the hours calculation, and does not require additional fields
- Reviewer/Admin sees the flag on the Splice Dashboard and can either approve normally or use the existing reject button (`POST /timesheets/:id/reject`) to bounce the entry back
- The flag is computed automatically on save by the server; the inspector never sets it manually

## Photos on a Deficiency (PWA + desktop)

## Login Screen (PWA)

- Single field on the default view: email, password, "Sign in" button
- Below the password field: "Forgot password?" link (routes to `/forgot-password`)
- After **3 consecutive failed sign-in attempts** (15-minute sliding window): a tertiary "Use access PIN" link appears below "Forgot password?"
- Tapping "Use access PIN" transitions to a PIN entry view: 6 single-digit input boxes, auto-advance on digit entry, paste support (auto-distribute 6 digits)
- PIN entry view: back link to password, "Sign in with PIN" button, lockout countdown if `pin_lockout_until` is set
- During PIN-fallback mode (post-login), a persistent amber banner in the app bar: "Offline access only — new entries will sync after password reset" — never dismissible
- Failed attempts are surfaced inline ("Invalid PIN — 3 attempts remaining") — never logged in plaintext

## Photos on a Deficiency (PWA + desktop)

- A deficiency can hold up to `MAX_PHOTOS_PER_DEFICIENCY = 20` photos (API-layer cap; see `04-engineering-standards.md` §4.12). The DB no longer enforces a cap.
- **Soft UI warning at 6 photos:** the 6th photo onward renders a yellow inline note on the capture screen — "This deficiency already has 6 photos. Adding more is allowed (up to 20) but slows the reviewer's two-pane Splice view. Consider whether a new deficiency record would be clearer." The warning is informational only; capture is never blocked by the UI.
- **Hard API cap at 20:** the upload endpoint returns `422 PHOTO_LIMIT_EXCEEDED` on the 21st photo. The error message names the cap and links to docs.
- The thumbnail strip on the deficiency detail view shows up to 6 thumbnails inline and a "+N more" link beyond that.
- Tapping any thumbnail opens the full photo lightbox (EXIF metadata on the right panel; "tag as remediation_evidence" toggle for Reviewer/Admin).

---

## Calendar (Admin/Reviewer only)

- Month and week toggle in the toolbar
- Generated-but-unconfirmed scheduled occurrences (FR-10.1) render with a **dashed** border; confirmed `Assigned` inspections render with a solid border
- Drag-and-drop on a tile triggers `PATCH /inspections/:id/schedule` — optimistic update with rollback on error
- Inspector filter dropdown in the top-right; selecting an inspector filters the visible tiles
- "Today" button always visible in the top-left, returns the view to the current date

---

## Inspection Status

- Status is shown as a single pill on the inspection header and on calendar tiles
- Colors come from `ui-tokens.md` → "Inspection Status" — never hardcoded
- The status pill is read-only for the Contractor role (any device); the Reviewer/Admin can change it only through the explicit `Submit` / `Return` / `Approve` / `Reopen` actions

---

## Audit Log (Admin only)

- Read-only, paginated table
- Columns: timestamp, actor (`user_id` + role), `table_name.record_id`, action, JSON diff (collapsed by default)
- Filter bar at the top: table name, record id, date range
- Never link to internal record URLs from this screen — show IDs only
- Contractor builds do not import this component, do not import its route, and do not register a link to it. Admin and Reviewer builds do (post-amendment: original v3 said Admin only).

---

## Empty States

Every section that can be empty must have an empty state. Keep it minimal:

- Short descriptive text in `text-text-muted`
- Optional icon above text
- CTA button if there's a logical next action

Examples:

- "No deficiencies logged yet. Submit your first inspection to start tracking."
- "No schedules yet. Add a recurrence to a structure to begin."
- "Audit log is empty for this filter."

---

## Loading & Error States

- Skeleton loaders (matching card geometry) for list views — never a full-page spinner
- Inline spinner inside buttons during async actions
- Inline error banner at the top of the affected section on partial failure
- Full-page error state (with retry CTA) only when the entire route fails to load

---

## Offline / Sync (PWA)

- Sync indicator in the app bar reflects connection state at all times
- Records created offline are queued in the outbox; their cards render with a "pending sync" badge
- A record that fails sync three times surfaces an inline error and a "Retry sync" action
- Tapping a queued record shows its full payload and last sync attempt error
- No record is ever silently dropped — every outbox entry is either successfully synced or explicitly errored to the user

---

## Tailwind v4 Note

This project uses Tailwind v4. Tokens are defined with `@theme` in `globals.css` — no `tailwind.config.ts` is needed for colors or spacing. Never define colors in a config file. Always use `@theme` for new tokens.

---

## Accessibility

- All interactive elements reachable via keyboard (tab order matches visual order)
- Focus ring uses `ring-accent` at 1px — never remove focus styles
- Color is never the only signal — severity pills also carry text, status pills also carry a small icon
- `aria-label` on icon-only buttons (the Reopen button, the sync indicator)
- All form fields have a visible `<label>` — placeholder is not a label
- PWA supports iOS VoiceOver and Android TalkBack — every card and action has an accessible name

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-purple-500`, `text-gray-600`) — use project tokens only
- Never define colors in `tailwind.config.ts` — use `@theme` in `globals.css`
- Never add gradients to card backgrounds
- Never use more than one font weight in a single UI element
- Never show raw error messages to users — always show human readable text
- Never stack more than 2 levels of border radius inside each other
- Never use `position: fixed` for UI elements — use normal flow layout
- Never render the Reopen button, the Danger variant, or any Audit Log link to a non-Admin build
- Never use `as any` or `as unknown as T` in component code — type the prop properly
- Never render the danger button variant to a Contractor build (any device)
- Never use free-text inputs where a picklist exists (FR-11.1) — always `<PicklistSelect>` with the appropriate `entityLabel`
