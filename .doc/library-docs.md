# Library Docs

Project-specific usage patterns for every third-party library in this project. This file only covers how we use each library in this specific codebase — rules, patterns, and constraints specific to StructApp.

Read the relevant section before implementing any feature that touches one of these libraries. When the plan or ADR says a library is "approved," the conventions in this file are the only approved way to use it.

---

## Before Using Any Library

Before implementing a feature that uses a third-party library:

1. **Check the ADR set** (Section 3.2 of the plan) for an Architectural Decision Record that pins the library. The ADR is authoritative for *which* library to use; this file is authoritative for *how*.
2. **Check `code-standards.md`** for naming, error-handling, and import-alias rules that apply across all libraries.
3. **Read the section below** for the specific library — never rely on training-data knowledge for versioned APIs.

Order of authority:

```
ADR (which library + why) → This file (how to use it) → Official docs (reference) → General training knowledge
```

Never assume an API signature from training data — versions change, and this project pins specific major versions in `package.json`.

---

## TypeScript

**Pinned in:** `package.json` `devDependencies` — do not bump major without an ADR.

### Compiler config

- `strict: true` — no exceptions
- `noUncheckedIndexedAccess: true` — array/object index access returns `T | undefined`
- `exactOptionalPropertyTypes: true` — do not pass `undefined` to an optional slot
- `target`: ES2022
- `module`: ESNext, `moduleResolution`: bundler

### Conventions

- `unknown` over `any` — narrow with type guards, never cast through `as`
- Type assertions (`as`) only at the boundaries you cannot control (e.g. JSON.parse of validated Zod output, `event.target` on synthetic DOM events) — and always with an inline comment explaining why
- All function parameters and return types explicit
- Prefer `type` for object shapes and unions; `interface` only for extendable public component props
- All async functions either return a typed `Result` or throw — never both. Background jobs always return `Result`; route handlers throw and let the error middleware format the response
- `const` by default; `let` only on reassignment; never `var`

---

## node-postgres (`pg`)

**Pinned in:** ADR-009 — single client for all Postgres access.

### Pool vs. client

```typescript
import { Pool, PoolClient } from 'pg';

// Singleton pool — most code uses this
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

// Only inside an explicit transaction
export async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

**Rules:**

- One `Pool` per process — never instantiate per request
- `withTx` is the only way to run multi-statement transactions
- Always pass query parameters as the second arg to `pool.query(text, values)` — never string-interpolate user input
- Set statement timeout on long queries: `SET LOCAL statement_timeout = '5s'` inside a transaction
- `pool.end()` in graceful-shutdown handlers only — never inside route handlers

---

## node-pg-migrate

**Pinned in:** ADR-009 — never edit a merged migration, only add new ones.

### Conventions

- One migration file per change set, named `<timestamp>_<snake_case_description>.ts` (e.g. `1718000000000_add_inspection_schedules.ts`)
- Each file exports `up(pgm)` and `down(pgm)` — `down` must reverse `up` exactly
- New tables: `pgm.createTable(..., { ifNotExists: true })` only when re-running the same migration is plausible; otherwise omit
- Column adds: `pgm.addColumns('inspections', { ... })` — never `pgm.sql` `ALTER TABLE` unless the operation is impossible in the JS API (e.g. `ADD CONSTRAINT` with a generated condition)
- RLS policies via `pgm.sql` block — the JS API does not model them
- Triggers and functions always via `pgm.sql` — same reason
- `pgm.createIndex` always specify the index name explicitly (`idx_<table>_<col>`) — never rely on auto-naming

**Rules:**

- Never modify a file once it has been applied to any environment — append a new migration instead
- Migrations are append-only history. The v1/v2/v3 evolution of the schema is *literally* the file history
- Backfill-then-enforce-NOT-NULL pattern: add nullable, run a separate migration that backfills, then `ALTER ... SET NOT NULL`, then `DROP COLUMN` — each in its own file. See Section 5 of the plan for the live example on `deficiency_records.component`

---

## Zod

**Pinned in:** API contract (Section 6).

### Schema definition

- One schema per route body, named `<route><Method>Schema` (e.g. `inspectionReopenSchema`)
- All schemas live in `apps/api-server/src/contracts/` — never co-locate with the route handler
- Export both the schema and the inferred type: `export type InspectionReopenInput = z.infer<typeof inspectionReopenSchema>`
- Use `z.string().uuid()` for UUIDs, `z.string().date()` for ISO date strings, `z.coerce.number()` only at boundaries that genuinely accept strings
- Enum fields use `z.enum([...])` mirroring the database enum values exactly

### Parsing

```typescript
const parsed = inspectionReopenSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(422).json({
    success: false,
    error_code: 'VALIDATION_ERROR',
    details: parsed.error.flatten(),
  });
}
const input: InspectionReopenInput = parsed.data;
```

**Rules:**

- `safeParse` + explicit error response — never `.parse()` (which throws and forces error middleware to guess the response shape)
- Validation errors return HTTP 422 with `error_code: 'VALIDATION_ERROR'`
- The inferred type is the *only* type used downstream — never widen it
- Date/time strings in the wire format stay as `string`; convert to `Date` only at the persistence boundary

---

## Express / route middleware

**Pinned in:** ADR-008 — Express for HTTP.

### Route handler shape

```typescript
import { Router, Request, Response, NextFunction } from 'express';

export const inspectionsRouter = Router();

inspectionsRouter.post(
  '/:id/reopen',
  requireAuth,           // populates req.user
  requireRole('Admin'),  // 403 on mismatch
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

**Rules:**

- Order: `requireAuth` → `requireRole(...)` → handler. No exceptions
- `req.user` is always non-null inside any handler that follows `requireAuth`; use `!` to assert it
- All async handlers `await` and wrap in `try/catch` that calls `next(err)` — never swallow
- All success responses: `{ success: true, data: T }` (or `{ success: true }` for void)
- All error responses: `{ success: false, error_code: string, message: string, details?: unknown }`
- Never call `res.json` after `next` — that path is over

### Error middleware

- One global error middleware registered last
- Maps known error codes to HTTP status (422 validation, 403 forbidden, 404 not found, 409 conflict, 500 internal)
- Logs at `error` level with `{ err, req: { method, path, userId } }` — never logs request bodies
- Returns `error_code: 'INTERNAL_ERROR'` for anything unrecognized — never leaks the original error message

---

## JSON Web Tokens (`jsonwebtoken`)

**Pinned in:** Section 2 / FR on auth — JWT for the field workforce.

### Token shape

```typescript
type StructAppTokenClaims = {
  sub: string;             // user_id
  client_id: string;       // tenant scope (active_client_id)
  role: 'Contractor' | 'Reviewer' | 'Admin';
  inspector_id?: string;   // present for Contractor only
  iat: number;
  exp: number;
  iss: 'structapp-app';
  aud: 'structapp-api';
};
```

### Verification

- Single `verifyFieldToken(token: string): FieldTokenClaims` helper in `apps/api-server/src/auth/jwt.ts`
- Always verify `iss`, `aud`, and `exp` — config-driven secret via `JWT_SECRET`
- Offline workers use **long-lived refresh tokens** (30 days) stored in the PWA's IndexedDB; short-lived access tokens (60 min) are re-minted on sync
- Never embed `client_id` in the URL path — the verified claim is the source of truth

**Rules:**

- Never log a token, even partially
- Token rotation: every successful `POST /auth/refresh` invalidates the prior refresh token
- All tokens share `iss: 'structapp-app'` and `aud: 'structapp-api'` — there is no longer a desktop-vs-mobile split in the JWT (the spec is now one URL, one code base, responsive UI). The role is the only authorization signal in the token.
- (Post-amendment) Reviewer tokens bypass `client_memberships` and are global/cross-tenant. Contractor tokens remain membership-scoped.

### Password reset tokens

Separate from the access/refresh JWT pair. Used by `POST /auth/forgot-password` and `POST /auth/reset-password`.

- Single-use, 1-hour TTL
- Issued via `crypto.randomBytes(32).toString('hex')` (256 bits of entropy), stored hashed in a new `password_reset_tokens` table
- Always return `200` from `POST /auth/forgot-password`, even if the email doesn't exist — no user enumeration
- `POST /auth/reset-password` returns `401 RESET_TOKEN_CONSUMED` on a second use of the same token
- Reset link is sent via the same `NotificationProvider` Resend adapter as invites and P1 alerts — never call Resend directly from the auth route handler
- After a successful reset, the user's `last_login_at` is not updated (the reset is not a login — the user must sign in again with the new password)

### Access PIN (FR-14 — offline fallback)

Per-user 6-digit numeric PIN, set during contractor profile setup. Provides an offline-recovery path for inspectors who have forgotten their password and have no connectivity to receive a password-reset email.

- Hashing: **Argon2id** (not bcrypt — see ADR note below) with parameters `timeCost: 3, memoryCost: 65536, parallelism: 4`. The `argon2` npm package is the standard library. The hash is stored in `users.pin_hash` (VARCHAR(255))
- Verification: `argon2.verify(storedHash, submittedPin)`; the comparison is constant-time and safe against timing attacks
- Failed-attempt counter: `users.failed_pin_attempts` (INT). On each failed `POST /auth/pin-fallback`, increment the counter; if it reaches 5 within the last hour, set `users.pin_lockout_until = NOW() + INTERVAL '1 hour'`. While locked, both `POST /auth/login` and `POST /auth/pin-fallback` for that email return `429 PIN_LOCKED_OUT`
- Successful PIN entry resets the counter to 0
- The PIN is **never logged**, never sent to the server in any log line, never stored on the device in plaintext. The PWA holds a transient form input only; after submit, the field is cleared from memory

**Why Argon2id, not bcrypt or a JWT:** the PIN is 6 digits — only 1M possible values — so the hash function must be slow AND memory-hard. Bcrypt is fast on commodity hardware (low time cost), and a 6-digit space is brute-forceable in minutes. Argon2id's memory-hardness makes a brute force on a 1M-value space expensive enough to be defeated by the 5-attempt/hour rate limit. The PIN must never be a JWT (it would be readable client-side and forgeable).

**Why the PIN is verified server-side, not client-side:** the device cannot authenticate itself in PIN mode — the PIN exists to bootstrap a network connection. The PWA cannot do PIN crypto offline. The PIN is therefore a "get me to the network" credential, not a "work offline indefinitely" credential. See `02-functional-requirements.md` FR-14.1 for the residual limitation.

**Argon2id is a project-approved dependency** (added to `library-docs.md` → "Approved Dependencies" alongside the existing list).

---

## Multi-tenant RLS helper

**Pinned in:** Section 5 — every query runs with `app.current_client_id` set.

```typescript
export async function asTenant<T>(
  clientId: string,
  fn: (client: PoolClient) => Promise<T>,
  bypass = false,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_client_id', $1, true)", [clientId]);
    if (bypass) {
      await client.query("SELECT set_config('app.bypass_tenant_check', 'true', true)");
    }
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

**Rules:**

- Every request handler that touches tenant data runs inside `asTenant(req.user!.client_id, ...)`
- The `bypass` flag exists for **background jobs only** (schedule generator, notification dispatcher) — never pass `true` from a request handler
- Never read `app.current_client_id` from a request — it is server-injected per-transaction

---

## Service Worker / IndexedDB (field PWA)

**Pinned in:** ADR-002 — **Dexie.js** wraps IndexedDB. Offline-first mobile PWA.

### Dexie schema

- One database `StructAppLocalDB` with tables: `deficiencies`, `authState`, `pin_outbox` (post-FR-14)
- The `pin_outbox` table is a separate Dexie store used only when the device is in PIN-fallback mode. Schema: `++localId, structureId, pinMode, createdAt`. Records here are tagged `pinMode: true` and are never drained by the normal sync worker; they are held until the inspector completes a real-password login, at which point the next `/sync/push-outbox` call uploads them and each is audit-tagged in the Splice Dashboard as "captured in PIN-fallback mode — please verify"
- All field writes go to the local table first, then to a sync outbox — sync drains the outbox
- Primary keys are `++localId` (auto-increment) for deficiencies; `authState` uses the literal id `'current'` (singleton table for the active token pair)
- The `syncState` column on `deficiencies` tracks `Draft | Pending_Sync | Synced` and is the index the sync worker iterates
- **Client switch (post-amendment):** when a Contractor switches clients via `POST /auth/switch-client`, the new `{ access_token, refresh_token, active_client_id }` overwrites the row in `authState` in place. The user is **not** logged out and the outbox is **not** drained — outbox records belong to whichever inspection they were logged against, not to the active client. The next `POST /sync/pull-package` refreshes the per-client reference data cache

### Sync flow

1. POST `/sync/push-outbox` with batch of records (atomic transaction server-side; see Section 8.2 of v2)
2. Server returns `localId → serverId` map and per-record validation status
3. Client updates local rows with server ids; clears matching outbox entries
4. Photos upload separately via multipart POST to `/sync/photos/:deficiencyServerId` with retry + resume (Content-Range)

**Rules:**

- Never write to Postgres from the PWA — the PWA only writes to IndexedDB
- All API calls go through a single `apiClient` that attaches the JWT and handles 401 → refresh → retry
- The `authState` table is the only place tokens live on the device — never `localStorage`, never cookies (the device may be fully offline; the token must be readable without a network)
- Conflicts (server `updated_at` newer than local) surface a `conflict` outbox entry — resolve in the Reviewer UI, not on the device
- Service worker caches the app shell with `Cache, falling back to network` for assets, `Network, falling back to cache` for API
- Dexie schema changes go through `db.version(N).stores({...}).upgrade(tx => ...)` — never edit a published schema version; add a new one

---

## PDF generation (Document Publishing Center)

**Pinned in:** ADR-007 (post-v2 amendment) — **PDFKit** for PDF, **`docx`** for Word, **`exceljs`** for Excel.

### PDFKit

- Server-side only — never import in client code
- Always generate via the `reportJobWorker` job — never in a request handler
- Two output modes share the same PDFKit document definition:
  - `draft_pdf` — adds a "DRAFT — NOT FOR DISTRIBUTION" diagonal watermark on every page
  - `final_pdf` — same document, no watermark layer
- The document definition is a single TypeScript module (`apps/api-server/src/deliverables/pdf/inspectionReport.ts`) that takes a typed `ReportData` object. Never construct PDFs from raw HTML or templates — keep the styling in code
- Design tokens from `ui-tokens.md` no longer flow automatically into the PDF (the original Puppeteer+HTML approach reused the web CSS variables). The PDF module defines its own typography scale and color stops that must be kept visually aligned with the web tokens by hand
- Output: a `Buffer` written to object storage; the buffer is never written to local disk

### docx

- Server-side only — never import in client code
- Generate via the same `reportJobWorker` job as PDF
- One `.docx` per project report; structure is programmatic (no template substitution)
- Tables for deficiency lists, headings for sections, page breaks between projects

### exceljs

- Server-side only — never import in client code
- One worksheet per project, plus a summary sheet listing all projects in the deliverable
- Column headers in row 1 are frozen; auto-filter is enabled on the deficiency worksheet
- Numbers (hours, counts) are written as typed Excel numbers, never as strings

### Conventions (all three formats)

- Report generation runs **only** on the server, inside the `reportJobWorker` job
- Never generate reports in the request/response cycle
- Signed download URLs are time-limited (default 7 days) and one-time-redeemable when required by client contract
- Failed generation retries 3× with exponential backoff, then logs to `system_audit_logs` with `error_code: 'DELIVERABLE_GENERATION_FAILED'`
- Never commit rendered PDFs/Word/Excel to the repo
- Template files (PDFKit modules, docx builders, exceljs worksheet definitions) live in `apps/api-server/src/deliverables/` and are reviewed like code

---

## File storage (photos + deliverables)

**Pinned in:** Section 5 — `photos` table; deliverables are object-storage blobs.

- Photos stored on disk under `apps/api-server/storage/photos/<deficiency_id>/<photo_id>.<ext>` for self-hosted deployments
- Or S3-compatible object storage via `@aws-sdk/client-s3` when `S3_BUCKET` is configured — the storage layer abstracts both
- Path is always `<entity>/<parent_id>/<id>.<ext>` — never a flat bucket
- Signed URLs for client-facing photos; direct paths never exposed
- All photo access logged to `system_audit_logs` (`table_name: 'photos'`, `action: 'READ'`)

---

## Notification provider

**Pinned in:** ADR-008 (post-v2 amendment) — single `NotificationProvider` interface implemented by **Resend** (email) and **MessageBird** (SMS).

```typescript
export interface NotificationProvider {
  send(channel: 'email' | 'sms', userId: string, template: NotificationTemplate, payload: Record<string, unknown>): Promise<void>;
}
```

### Resend (email)

- Invoked only from the `NotificationProvider` implementation — never call `resend.emails.send` from a route handler, agent, or job
- Sender domain is configured via `RESEND_FROM_ADDRESS` env var; templates live in `services/notifications/templates/email/`
- Templates use React Email (`.tsx` files that render to an email-safe HTML tree) — never send raw HTML strings
- Attachments (PDF reports) uploaded to object storage first; pass the signed download URL in the template payload, never the file buffer

### MessageBird (SMS)

- Invoked only from the `NotificationProvider` implementation — never call the MessageBird SDK directly from call sites
- Originator configured via `MESSAGEBIRD_ORIGINATOR` env var
- SMS is used **only** for P1 deficiency alerts (FR-4.2) — invite emails, report-ready notifications, and other low-urgency messages are email-only
- Body length capped at 160 characters; longer content is truncated with a link to the full alert in the portal

### Call sites (v3 additions)

- `notifyInspectionAssigned` — fired on `POST /inspections` (FR-12.1)
- `notifyInspectionSubmitted` — fired on `POST /inspections/:id/submit`, fanned out to all Reviewers (global fan-out, post-amendment) and any Admin whose active client matches the inspection
- `notifyInspectionReturned` — fired on `POST /inspections/:id/return`
- `notifyInspectionReassigned` (FR-18.2) — fired on `PATCH /inspections/:id/reassign` and on every row of `POST /inspections/bulk-reassign`. Sent to the **previous** inspector (not the new one). Body excludes the new inspector's name; includes the inspection's structure and scheduled date plus the `reason` field from the request. Routed via the Resend adapter; no new provider integration.
- `notifyBulkReassignSummary` (FR-18.3) — fired once per `POST /inspections/bulk-reassign` call, sent to the **source** inspector ("N inspections you were assigned have been reassigned") and once to the **target** inspector ("You have been assigned N new inspections"). Same routing rules as above.
- P1 deficiency alert — unchanged from v2, still triggers email + SMS in the after-commit hook

**Rules:**

- All notifications route through the `NotificationProvider` — never call Resend or MessageBird directly
- Failed notification delivery logs to `system_audit_logs` but never blocks the originating action
- The interface is the boundary — providers can be swapped again with no change to call sites
- The P1 alert fires only after the sync transaction commits (FR-4.2); never inside the transaction

---

## Background jobs (schedule generator + notification dispatcher)

**Pinned in:** Section 8.1 of v3.

- All jobs live in `apps/api-server/src/jobs/`, each a function that takes a `Pool`
- Scheduled via `node-cron` (in-process) when running single-instance, or via an external scheduler hitting an internal endpoint when multi-instance
- Every job is **idempotent** — re-running produces the same observable state. The schedule generator relies on the `idx_inspections_schedule_occurrence` unique index from Section 5
- Job failures are logged, not thrown — one schedule's failure does not abort the run
- `LEAD_TIME_DAYS` and similar tunables live in `apps/api-server/src/config/jobs.ts` — never hardcoded inside a job

---

## Logging

- Single `logger` from `pino` — never `console.log`
- Log shape: `{ level, time, msg, ...context }`
- Request-scoped context (`req.user.user_id`, `req.path`) is attached via `pino-http` middleware
- Never log: request bodies, tokens, photo blobs, full stack traces from third-party SDKs at `info` level (use `error` with `{ err }`)
- Audit-relevant events (reopen, verify-closure, admin overrides) are written to `system_audit_logs`, not just logged

---

## TanStack Query

**Pinned in:** v3 Section 4.7a — TanStack Query is the only data-fetching primitive in Client Components.

### QueryClient configuration

A single shared `queryClient` is configured at the app root in `apps/web-client/src/lib/queryClient.ts`:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Conventions

- **Query keys** are arrays scoped to the resource and filter args, e.g. `['inspections', { clientId, status }]`, `['deficiency', id]`, `['component-types', clientId]`
- **Per-query override** for `refetchOnWindowFocus`: set to `false` for picklists and reference data; `true` (default) for inspection/deficiency data
- **Mutations** use `useMutation`; on success call `queryClient.invalidateQueries({ queryKey: [...] })` for affected keys
- Queries are wrapped in the global `QueryErrorBoundary` at the app root (see `QueryErrorBoundary.tsx`)

---

## react-error-boundary

**Pinned in:** v3 Section 4.7a — error boundary wrapper for TanStack Query.

### Usage

The global `QueryErrorBoundary` is configured in `apps/web-client/src/lib/errorBoundary/QueryErrorBoundary.tsx` and wraps the app in `main.tsx`.

### ErrorFallback

The `ErrorFallback` component renders:

- A styled error container with the error message
- A "Try again" button that reloads the page on reset

---

## Approved Dependencies

Never install a new package without updating the ADR set and this list. The current approved set is:

| Package | Purpose | ADR |
|---|---|---|
| `pg` | Postgres client | ADR-003, ADR-009 |
| `node-pg-migrate` | Schema migrations | ADR-009 |
| `zod` | Request validation | — |
| `express` | HTTP server | ADR-001 |
| `jsonwebtoken` | JWT issue/verify | ADR-010 |
| `argon2` | PIN hashing (Argon2id) for FR-14 | — |
| `pino` / `pino-http` | Structured logging | — |
| `node-cron` | In-process job scheduling | — |
| `@aws-sdk/client-s3` | Object storage (optional) | — |
| `cloudinary` | Image streaming upload / CDN | ADR-004 |
| `pdfkit` | PDF report generation | ADR-007 (amended) |
| `docx` | Word report generation | ADR-007 |
| `exceljs` | Excel report generation | ADR-007 |
| `resend` | Transactional email | ADR-008 (amended) |
| `messagebird` | SMS (P1 alerts) | ADR-008 (amended) |
| `react`, `react-dom` | Desktop portal + PWA UI | ADR-001 |
| `vite` | Build tooling | ADR-001 |
| `dexie` | IndexedDB wrapper for PWA | ADR-002 |
| `@tanstack/react-query` | Client-side data fetching | — |
| `react-error-boundary` | Error boundary wrapper | — |
| `@zxing/browser` | QR/barcode scanning for PWA | — |
| `exifr` | EXIF photo metadata extraction for PWA | — |
| `workbox-*` | Service worker for PWA | — |
| `tailwindcss`, `@theme` | Styling tokens | — |

A new package may only be added to this list with a corresponding ADR or an amendment to an existing one.
