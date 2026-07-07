# 11. Operational & Non-Functional Requirements

## 11.1 Environment Configuration

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

> The notification provider env vars reflect the post-v2 ADR-008 amendment (Resend, MessageBird). SendGrid / Twilio vars were removed.

## 11.2 Pagination Convention

All list endpoints accept `page` (default 1) and `page_size` (default 25, max 100). Response envelope:

```json
{ "data": [ /* ... */ ], "pagination": { "page": 1, "page_size": 25, "total_count": 142, "total_pages": 6 } }
```

## 11.3 CI/CD Pipeline (GitHub Actions, default)

```yaml
name: ci
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: test }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run migrate:up   # node-pg-migrate against the service-container DB
      - run: npm test
      - run: npm run build
```

## 11.4 Sync Conflict Resolution Policy

StructApp avoids most conflict scenarios by design rather than by reconciliation logic:

* Master/reference data (structures, sites, assignments) is **read-only on the mobile client** — it's pulled via `/sync/pull-package`, never edited there.
* Inspector-authored records (deficiencies, photos, timesheets) are **append-only** from the device's perspective — an inspector creates new rows, never edits another user's existing rows, so two devices can't collide on the same record.
* The one residual case — an inspection is `Returned` or reassigned server-side while the contractor is mid-edit offline — is handled by making the server authoritative: if a sync payload targets an inspection whose current server status no longer permits new writes (e.g., already `Approved`), the sync fails that record with a clear conflict code, and the contractor is prompted to pull fresh state. No data is silently overwritten in either direction.

## 11.5 Data Protection & Retention (flagged for legal/compliance sign-off)

* Phone numbers and GPS coordinates are sensitive but not currently column-encrypted; if required by your jurisdiction, apply `pgcrypto` to `users.phone_number` as an additive control (RLS already restricts row visibility — this would add ciphertext-at-rest on top of that).
* Cloudinary URLs should be issued as signed, time-limited URLs rather than permanently public links, given the photos may constitute legal/safety evidence.
* **Retention period for inspection records and photos is a policy decision, not an engineering one** — this document does not assert a specific number of years. Confirm the required retention period with legal/compliance before building any auto-deletion logic, and default to "retain indefinitely, no auto-deletion" until that's settled.

## 11.6 Logging & Observability

* Structured JSON logs via `pino`; never `console.log`
* Request-scoped context (`userId`, `path`) attached via `pino-http` middleware
* Health check endpoint at `GET /health` — returns 200 if DB pool can answer `SELECT 1`
* No request bodies, JWTs, or photo blobs in logs at any level

## 11.9 Error Logging and Review (v3)

Three categories of runtime errors each go to a different destination for review. **Business-state changes** are recorded in `system_audit_logs` (existing; not changed by this section). **Runtime errors** go to the destinations below.

### 11.9.1 Backend runtime errors (server-side)

* All caught-and-logged errors from route handlers, services, and background jobs write to **pino structured JSON logs at `error` level** (per `04-engineering-standards.md` §4.8). Pino's output goes to **stdout** in the deployment container.
* The deployment's log shipper (configurable, e.g. Datadog Agent, Fluent Bit, Loki Promtail) ingests stdout into a log aggregation service. The exact log shipper is an operational concern and is **not pinned by this spec** — the pino output is plain JSON, ingestible by anything.
* No third-party SaaS error reporting on the backend. Sentry is not used for backend errors.

### 11.9.2 Background-job errors that exhaust retries

* When a background job exhausts its retry policy (3× with exponential backoff, e.g. `reportJobWorker` from `library-docs.md` → "PDF generation"), the job records a row in a new **`system_job_errors`** table. The row contains: `job_id`, `job_type` (e.g. `'report_generation'`, `'schedule_generation'`), `error_code` (e.g. `'DELIVERABLE_GENERATION_FAILED'`), `error_message`, `error_stack` (truncated to 8KB), `attempt_count`, `last_attempted_at`, `input_payload` (the original job input, so the job can be re-run with the same data).
* `system_job_errors` is **Admin-and-Reviewer viewable** in the same screen that shows `system_audit_logs` (a new "Job errors" tab). A row is dismissable by Admin; on dismiss, the row is archived (not deleted).
* A job that succeeded on a later attempt (e.g. succeeded on the 4th try after the first 3 failed) does not produce a `system_job_errors` row — only jobs that ultimately gave up do.

### 11.9.3 Frontend errors (PWA + desktop)

* **Sentry** is used for frontend errors. The PWA and the desktop portal both initialize `@sentry/react` at the app root.
* Sentry captures the following per event:
  - `user.id` (the verified `user_id` from the JWT — UUID only, **not** email)
  - `user.role` (Contractor / Reviewer / Admin)
  - `user.client_id` (the active client)
  - The current route
  - Active TanStack Query keys
  - The error message
  - The stack trace
  - Browser and OS
  - Build version (from `process.env.BUILD_SHA` or similar)
* Sentry's `beforeSend` hook **scrubs any field that looks like** an email, a phone number (E.164 pattern), a JWT (Bearer / eyJ prefix), or a GPS coordinate (`/\-?\d{1,3}\.\d{4,}/` in a string field). This is enforced in code, not just in Sentry's project settings.
* Sentry **never** captures: request/response bodies, photo blobs, deficiency descriptions, or anything else from `deficiency_records` or `photos`.
* The `SENTRY_DSN` env var is set per-environment (one for staging, one for production). Dev environments may run with a fake/mock Sentry client (the `@sentry/react` SDK is a no-op if `SENTRY_DSN` is unset).
* The global `QueryClient` error handler (per `04-engineering-standards.md` §4.7a) calls `Sentry.captureException(error, { extra: { queryKey, componentStack } })` for any uncaught query error, and a `QueryErrorBoundary` at the app root surfaces a user-friendly "Something went wrong" page with a "Reload" button. The same boundary also fires for React render errors via `componentDidCatch`.

### 11.9.4 Client-side errors that the PWA sends to the backend

In addition to Sentry, the PWA also POSTs a copy of any **unhandled exception** or **TanStack Query error** to a server-side endpoint, for redundancy (Sentry may be down, the network may be flaky, the user may be on a tightly-firewalled network that blocks Sentry's domain):

* `POST /api/v1/client-errors` — body: `{ kind: 'render' | 'query' | 'unhandled_rejection', message, stack, route, queryKeys?, buildVersion, at }`. The server writes a row to `system_job_errors` with `job_type: 'client_error'`.
* The endpoint is rate-limited per user (10 errors / hour) and per IP (100 errors / hour) to prevent a single misbehaving client from flooding the table. Beyond the rate limit, the server returns `429` and the PWA stops sending for the rest of the hour.
* The endpoint does **not** require auth (a logged-out PWA hitting a render error still needs to be capturable) — it accepts a `client_local_id` instead of a `user_id` if the user is not signed in. The server correlates client-side errors to users when possible (matching the `client_local_id` to a recent request) and stores them as anonymous rows otherwise.

### 11.9.5 Audit-log vs system_job_errors

For clarity, the two are distinct:

| Concern | Table | Visible to | Captures |
|---|---|---|---|
| Business state changes | `system_audit_logs` | Admin, Reviewer | "User X reassigned inspection Y to inspector Z" |
| Retry-exhausted jobs | `system_job_errors` | Admin, Reviewer | "Report generation job 1234 failed 3× with DELIVERABLE_GENERATION_FAILED" |
| Backend runtime errors | pino logs → log shipper | Operators (DevOps) | "Unhandled exception in /inspections POST handler" |
| Frontend errors | Sentry + `system_job_errors` (as `client_error` rows) | Admin, Reviewer (via the table); developers (via Sentry) | "React render error in <SpliceDashboard>" |

The two tables look similar but are accessed differently. The audit log is for "what business change happened" and is part of the product surface (Admin and Reviewer can read it). `system_job_errors` is for "what broke" and is part of the operational surface (same role gating, but the user is investigating a problem, not auditing a change).

## 11.7 Performance Targets

* API p95 latency < 300ms for read endpoints, < 800ms for write endpoints (excluding report generation, which is async)
* PWA cold load < 2s on 3G
* Sync of a 50-record outbox completes in < 5s end-to-end on a stable 3G connection

## 11.8 v3 Additions

* Schedule generation job runs daily; failure is logged and does not abort the rest of the run
* `<InspectionCalendarView>` initial render of a 1-month range must complete in < 200ms after data load
* Audit log query at 100k rows must paginate and return the first page in < 500ms — index on `(table_name, record_id, timestamp)`
* Photo evidence upload (multipart with Content-Range resume) must survive a connection drop mid-upload and resume without re-sending the already-uploaded bytes
