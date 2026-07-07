# 4. Software Engineering & Code Standards

> **Supersedes** v2 Section 4 and the previously separate `code-standards.md`. Library-specific usage (Zod, Express, Dexie, Resend, MessageBird, PDFKit, etc.) lives in `library-docs.md`. The v2 file is the historical source for the v2 baseline; this file is the current source of truth.

---

## 4.1 Engineering Mindset

The AI agent on this project operates as a senior engineer. This means:

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — `plan.md`, the relevant section file (01–11), and `library-docs.md` for any third-party API — never assume, always verify
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
- **One thing at a time** — complete one feature fully before touching the next
- **Failures are expected** — wrap agent operations, sync handlers, and background jobs in try/catch, log failures, never let one failure crash everything

## 4.2 Type Safety

### Compiler

- `tsconfig.json`: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- `noUncheckedIndexedAccess: true` — array/object index access returns `T | undefined`
- `exactOptionalPropertyTypes: true`
- `target`: ES2022
- `module`: ESNext, `moduleResolution`: bundler

### Conventions

- `any` is banned; use `unknown` + type guards
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions; `interface` only for extendable public component props
- All async functions either return a typed `Result` or throw — never both. Background jobs always return `Result`; route handlers throw and let the error middleware format the response
- `const` by default; `let` only on reassignment; never `var`

## 4.3 Folder Layout & Imports

### Path aliases

No relative paths deeper than one folder step. Use path aliases:

```typescript
import { useSyncOutbox } from '@/hooks/useSyncOutbox';
import { RiskMatrixBadge } from '@/components/ui';
import { calculatePriorityTier } from '@shared/utils/riskCalculator';
import { reopenInspection } from '@/services/inspections';
```

### Folder & file naming

- Folders: `kebab-case` — `inspection-schedules`, `remediation-tracker`
- Component files: `PascalCase` — `InspectionCalendarView.tsx`
- Utility / lib files: `camelCase` — `tenantContext.ts`, `jwt.ts`
- API route files: `route.ts` (Next-style) or `<resource>.routes.ts` (Express)
- Migration files: `<timestamp>_<snake_case_description>.ts` (see 4.10)
- One component per file — never export multiple components from one file
- Index/barrel files only in `components/ui/` — never barrel-export from other folders

## 4.4 Error Handling Patterns

- `async/await` with try/catch only. No chained promises, no RxJS.
- API route handlers: every async handler `await`s and wraps in `try/catch` that calls `next(err)` — never swallow.
- Background jobs: log at `error` level with `{ err, context }` and continue to the next item — never abort the whole run.
- Never use empty catch blocks — always log or handle.
- Logger calls always include a context prefix: `[component/function name]`.
- User-facing errors must be human readable — never expose raw error messages.
- API route errors return a typed envelope (`error_code` + `message`) — never expose stack traces.
- Audit-relevant failures (reopen, verify-closure, admin override) write to `system_audit_logs` *and* log.

```typescript
export async function dispatchDeviceOutbox(payload: MultipartSyncPayload): Promise<SyncResponse> {
  try {
    const response = await apiConnectionPool.post('/sync/push-outbox', payload);
    return { success: true, serverRef: response.data.sync_summary };
  } catch (error) {
    logger.error('Failed to process synchronization outbox payload', { error });
    return { success: false, validationErrors: error.response?.data?.invalid_records || [] };
  }
}
```

## 4.5 API Route Handlers (Express)

```typescript
// apps/api-server/src/routes/inspections.ts
import { Router, Request, Response, NextFunction } from "express";

export const inspectionsRouter = Router();

inspectionsRouter.post(
  "/:id/reopen",
  requireAuth,           // populates req.user
  requireRole("Admin"),  // 403 on mismatch
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = inspectionReopenSchema.parse(req.body);
      const result = await reopenInspection(req.user!.user_id, req.params.id, input);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err); // error middleware formats the response
    }
  },
);
```

- Middleware order is always: `requireAuth` → `requireRole(...)` → handler. No exceptions
- `req.user` is always non-null inside any handler that follows `requireAuth`; use `!` to assert it
- Every route handler validates the request body via Zod `parse` *before* any business logic
- Errors are logged with the route path as prefix: `[inspections/reopen]`
- All success responses: `{ success: true, data: T }` (or `{ success: true }` for void)
- All error responses: `{ success: false, error_code: string, message: string, details?: unknown }`
- Never call `res.json` after `next` — that path is over
- One global error middleware registered last maps known error codes to HTTP status (422 validation, 403 forbidden, 404 not found, 409 conflict, 500 internal) and returns `error_code: 'INTERNAL_ERROR'` for anything unrecognized

## 4.6 Service / Agent Code

```typescript
// apps/api-server/src/services/inspections.ts
export async function reopenInspection(
  actorId: string,
  inspectionId: string,
  input: InspectionReopenInput,
): Promise<{ inspection_id: string; status: InspectionStatus; reopened_at: string }> {
  // ...
}
```

- Pure async functions; no Express types (`Request`/`Response`) inside services
- Services never import from `routes/` or `components/`
- Services take an already-validated input (Zod-inferred type) and a tenant context — they do not parse or re-validate
- All database access goes through `asTenant(clientId, ...)` — services never touch the raw pool
- Background-job services (schedule generator, notification dispatcher, report worker) take a `Pool` directly and pass `bypass = true` to `asTenant` only at the outermost call

## 4.7 Component Structure (React — single web app, responsive UI)

Every component follows this exact order:

```typescript
"use client"; // only if the component needs browser APIs

// 1. External imports
import { useState } from "react";

// 2. Internal imports
import { Button } from "@/components/ui/button";

// 3. Type definitions
type Props = {
  inspectionId: string;
  onSubmit: (input: SubmitInput) => void;
};

// 4. Component
export function ComponentName({ inspectionId, onSubmit }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports
- Props type defined directly above the component — not in a separate types file unless shared by more than one component
- No inline styles — all styling via Tailwind classes using CSS variables from `ui-tokens.md`

## 4.7a Data Fetching in Client Components (TanStack Query only)

### CI enforcement

The `useEffect` ban for data fetching is enforced via a code-search check in CI. See `.github/workflows/ci.yml` → `lint` job → `check-no-effect-fetch.js` script. The script fails the build if it detects `fetch(` or `fetchQuery(` inside a `useEffect` callback.

- **All data fetching in Client Components goes through TanStack Query** (`@tanstack/react-query`). `useEffect` is **forbidden for data fetching** in any Client Component — it must never call `fetch` to load data, never maintain a `useState` + `loading` boolean pair for a server call, and never use `useEffect` to trigger a load on mount or on a dependency change.
- **Server Components are unaffected** — they fetch on the server using their own async/await + `createInsforgeServer()`. The TanStack rule applies only to Client Components.
- **Local store reads are not 'fetching'** — Dexie reads (offline-first reference data, the `authState` table, the `pin_outbox` table, the regular outbox) and any browser-API read (IndexedDB, Geolocation, the Service Worker) are out of scope. The rule is about HTTP calls to the StructApp API.
- **A single shared `queryClient` is configured at the app root** with project defaults:
  - `staleTime: 30_000` (30 seconds) — data is fresh for 30s, no refetch
  - `gcTime: 5 * 60_000` (5 minutes) — inactive queries garbage-collected after 5 minutes
  - `retry: 2` — retry twice with exponential backoff before surfacing the error
  - `refetchOnWindowFocus: true` for inspection and deficiency data, `false` for picklists and reference data
- **Query keys are an array, scoped to the resource and any filter args**, e.g. `['inspections', { clientId, status }]`, `['deficiency', id]`, `['component-types', clientId]`. Never a single string. Never an object that includes the entire filter set as a serialized blob.
- **Mutations** (`useMutation`) are used for every `POST`/`PATCH`/`DELETE` call. On success, the mutation calls `queryClient.invalidateQueries({ queryKey: [...] })` for the affected query keys — never a manual refetch.
- **`useEffect` is allowed for non-fetching side effects only** — e.g. attaching/detaching a global event listener, updating a `ref`, or syncing a third-party widget. It is never the mechanism for "load data when this component mounts."
- **Forbidden patterns** (these fail code review):
  - `useEffect(() => { fetch('/api/...').then(r => setData(r.json())) }, [])`
  - `useEffect(() => { loadSomething() }, [dep])` where `loadSomething` calls the API
  - `const [data, setData] = useState(null); const [loading, setLoading] = useState(true);` paired with an effect
  - Direct `fetch('/api/...')` inside an event handler when a mutation would be the right primitive (e.g. "click to load more" should be `useInfiniteQuery`, not a manual `fetch` + `setState`)
  - Using `useEffect` to call `queryClient.fetchQuery` — that's already the wrong shape; use `useQuery` with the same key

**Why this rule exists:** `useEffect` for data fetching is the single most common source of race conditions, double-fetches, stale-data bugs, and missing error states in React apps. TanStack Query makes caching, deduplication, retries, invalidation, and refetch-on-focus correct by default. The spec's "Server Components do their own fetching, Client Components use TanStack" is a clean, enforceable split — there is no "in between" pattern.

## 4.8 Logging

- Single `logger` from `pino` — never `console.log`
- Log shape: `{ level, time, msg, ...context }`
- Request-scoped context (`userId`, `path`) attached via `pino-http` middleware
- Never log: request bodies, JWTs, photo blobs, full stack traces from third-party SDKs at `info` level (use `error` with `{ err }`)

## 4.9 Environment Variables

All environment variables defined in `.env.local` for development. Never hardcode any key, URL, or secret anywhere in the codebase.

```bash
# apps/api-server/.env.example
DATABASE_URL=postgres://user:pass@localhost:5432/structapp
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
RESEND_API_KEY=
RESEND_FROM_ADDRESS=
MESSAGEBIRD_ACCESS_KEY=
MESSAGEBIRD_ORIGINATOR=
NODE_ENV=
LEAD_TIME_DAYS=
```

> The notification provider env vars reflect the post-v2 ADR-008 amendment (Resend, MessageBird).

| Variable | Used In |
|---|---|
| `DATABASE_URL` | `lib/db.ts` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `auth/jwt.ts` |
| `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | `services/media/cloudinary.ts` |
| `RESEND_API_KEY` / `RESEND_FROM_ADDRESS` | `services/notifications/email.ts` |
| `MESSAGEBIRD_ACCESS_KEY` / `MESSAGEBIRD_ORIGINATOR` | `services/notifications/sms.ts` |
| `LEAD_TIME_DAYS` | `config/jobs.ts` |
| `NODE_ENV` | everywhere |

**Rules:**

- Never log a secret value, not even at `debug`
- Server-only vars have no prefix; the PWA exposes only the public config it needs via a `/api/v1/config/public` endpoint
- New env vars must be added to this table in the same commit that introduces them

## 4.10 Pinned Toolchain Versions

To prevent independent build sessions from resolving different major versions:

| Package | Pinned Version |
|---|---|
| Node.js | 20 LTS |
| TypeScript | 5.4.x |
| React | 18.3.x |
| Vite | 5.2.x |
| Express | 4.19.x |
| Zod | 3.23.x |
| Dexie | 4.0.x |
| PostgreSQL | 15.x |
| node-pg-migrate | 6.2.x |
| `pg` | 8.x |
| PDFKit | 0.15.x |
| `docx` | 8.5.x |
| `exceljs` | 4.4.x |
| `resend` | latest 3.x |
| `messagebird` | latest 4.x |
| `pino` | 8.x |
| `jsonwebtoken` | 9.x |

> The PDF/Email/SMS pins reflect the post-v2 ADR-007 and ADR-008 amendments.

## 4.11 Migration Convention

- One change per migration file. Never edit a merged migration — add a new one.
- Naming: `apps/api-server/migrations/<unix_timestamp>_<snake_case_description>.ts`.
- Each file exports `up(pgm)` and `down(pgm)` — `down` must reverse `up` exactly.
- New tables: `pgm.createTable(..., { ifNotExists: true })` only when re-running the same migration is plausible.
- RLS policies and triggers always via `pgm.sql` blocks — the JS API does not model them.
- `pgm.createIndex` always specifies the index name explicitly (`idx_<table>_<col>`) — never rely on auto-naming.
- Backfill-then-enforce-NOT-NULL pattern for replacing free-text with picklist FKs.
- CI runs `node-pg-migrate up` against a throwaway test database before tests execute (Section 11.3).

## 4.12 Constants

Domain constants that appear in multiple places are defined once and imported.

```typescript
// apps/api-server/src/config/constants.ts
export const SYNC_BATCH_SIZE = 100;
export const DELIVERABLE_LINK_TTL_DAYS = 7;
export const SCHEDULE_LEAD_TIME_DAYS = 14;     // overridable via env
export const MAX_PHOTOS_PER_DEFICIENCY = 20;
```

- Never hardcode a domain constant at a use site — import it
- Constants that vary by environment live in `config/jobs.ts` (or similar) and are read from env

## 4.13 Comments

- No comments explaining what the code does — code must be self-explanatory
- Comments only for *why* — explaining a non-obvious decision
- Agent / job functions may have a brief comment explaining the schedule / generation strategy
- Never leave TODO comments in committed code — open an issue instead

## 4.14 Dependencies

Never install a new package without a clear reason. Before installing anything check:

1. Is it already in `package.json`?
2. Does the existing toolset already provide this functionality?
3. Is there a simpler native solution?

The approved dependency list lives in `library-docs.md` → "Approved Dependencies". Do not install any other package without updating that list and the relevant ADR.

## 4.15 Git / Commit Hygiene

- One logical change per commit
- Commit message format: `<scope>: <imperative summary>` (e.g. `inspections: add reopen endpoint`)
- Never commit secrets, generated PDFs, or `node_modules`
- Never force-push to a shared branch
- Squash fix-up commits before opening a PR

## 4.16 Testing

- Every public function in `services/` has at least one unit test
- Every API route has at least one happy-path integration test
- Every multi-tenant query has a test that asserts cross-tenant access is blocked
- The schedule generator has an idempotency test (running it twice produces zero duplicates)
- The reopen endpoint has a role-boundary test (Reviewer receives 403, Admin receives 200)
- The verify-closure endpoint has a missing-evidence test (no `remediation_evidence` photo → 422)
- The `POST /auth/refresh` flow has a test that asserts a 30-day-old refresh token is rejected
- The atomic sync transaction has a test that asserts a validation failure mid-batch rolls back all writes
- `POST /auth/switch-client` has a test that asserts: Admin/Reviewer can switch to any client; Contractor can switch to a client in their `client_memberships`; Contractor receives `403 NOT_A_MEMBER` when targeting a client outside their memberships; the audit log row is written for the failed attempt
- `POST /auth/pin-fallback` has tests that assert: 3 failed `POST /auth/login` attempts surface the PIN UI; the correct PIN returns a token with `mode: "pin_fallback"`; the wrong PIN increments the counter and audit-logs; 5 wrong PINs in an hour locks the account for 1 hour; a `pin_fallback` token receives `423 LOCKED_PIN_FALLBACK_ACTIVE` on `POST /sync/push-outbox`, `POST /auth/refresh`, and any other write; a subsequent real-password login marks the `pin_fallback` token consumed and unblocks writes
- The PIN-fallback Argon2id hash uses parameters that take ≥ 250ms to verify on the target deployment hardware — the test suite asserts the verification time is in this range, to catch a future parameter change that would weaken the hash
- `PATCH /users/:id` has tests that assert: a critical field change writes an audit-log row with old+new values; a cosmetic field change does not; role/email changes are validated server-side (no privilege escalation); `add_client_ids` and `remove_client_ids` produce the expected `client_memberships` row set
- `PATCH /inspections/:id/reassign` has a test that asserts: the audit row records old and new `inspector_id`; reassigning a `Submitted` inspection is allowed; reassigning an `Approved` inspection returns `409 INSPECTION_APPROVED_USE_REOPEN` (forcing the reopen flow)
- `PATCH /structures/:id` has a test that asserts: `qr_code_value` collisions return `409 QR_CODE_ALREADY_IN_USE`; editing a structure on an `Approved` inspection is allowed (the immutability is on deficiencies, not structures)
- `POST /inspections` (FR-16) has a test that asserts: a new inspection carries the inspector's chosen `inspection_mode`; the default is `onsite`; the `inspections.inspection_mode` column is NOT NULL
- `POST /sync/push-outbox` (FR-16) has a test that asserts: when the parent inspection is in `post_inspection` mode, the server still accepts the deficiency records but does NOT require or expect GPS coordinates; when the mode is `onsite` and the PWA's client did populate GPS, the server stores the values as supplied
- `PATCH /inspections/:id/inspection-mode` (FR-16) has a test that asserts: the endpoint returns `409 MODE_LOCKED_DEFINCIENCIES_EXIST` when at least one deficiency row exists for the inspection
- `POST /timesheets` (FR-17) has a test that asserts: `entry_date` defaults to today when not supplied; the server sets `pre_inspection = true` when `entry_date < inspections.scheduled_date` (or `< inspections.assigned_at` for one-off inspections); a `pre_inspection = true` row is rendered with the yellow left-border in the API response and the timesheet list endpoint surfaces the flag
- `PATCH /inspections/:id/reassign` (FR-18.2) has a test that asserts: the previous inspector receives a `notifyInspectionReassigned` notification; the notification body does **not** include the new inspector's name; the notification includes the `reason` field if provided; the new inspector's existing `notifyInspectionAssigned` notification still fires (FR-12.1)
- `POST /inspections/bulk-reassign` (FR-18.3) has tests that assert: an empty `inspection_ids` list reassigns all open inspections under the source for the Admin's active client; the cap of 100 is enforced (`413 BULK_REASSIGN_LIMIT_EXCEEDED` on a larger batch); the target must be a current `is_active = true` member of the same client (`422 TARGET_INSPECTOR_INVALID` otherwise); source ≠ target (`422 SOURCE_EQUALS_TARGET`); if any inspection in the batch is `Approved`, the entire transaction rolls back and the response is `409 INSPECTION_APPROVED_USE_REOPEN` with the offending IDs; one `system_audit_logs` row is written per inspection; one summary notification is sent to the source inspector and one to the target; the source's summary does not include the target's name
