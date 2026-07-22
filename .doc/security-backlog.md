# Security Vulnerability Backlog

## Purpose
This backlog tracks security vulnerabilities discovered during codebase audits. It is organized by severity (Critical, High, Medium, Low) and ordered by remediation priority. Each item includes a reference ID, affected location, root cause, and concrete fix guidance.

## Priority Definitions

| Priority | Meaning |
|---|---|
| P0 | Exploitable in production; fix immediately |
| P1 | Significant attack surface; fix before next release |
| P2 | Defense-in-depth improvement; fix in next sprint |
| P3 | Hardening; fix when convenient |

---

# CRITICAL

| ID | Vulnerability | Affected Location | Root Cause | Fix Guidance |
|---|---|---|---|---|
| SEC-VULN-01 | Hardcoded JWT fallback secret | `routes/auth.ts:17`, `routes/users.ts:12` | `ACTIVATE_TOKEN_SECRET` falls back to `'fallback-activate-secret'` when `JWT_ACCESS_SECRET` is missing. In production, an attacker can forge invite/activation tokens and impersonate any user. | Remove the fallback. If `JWT_ACCESS_SECRET` is not set, throw at startup and refuse to bind the port. |
| SEC-VULN-02 | SQL injection via dynamic column names | `services/users.ts:42-53` | `updateUser` interpolates `Object.entries(fields)` keys directly into `SET` clauses. If any caller passes untrusted keys, arbitrary SQL is executed. | Validate keys against an explicit allowlist (e.g. `['role', 'is_active', 'display_name', 'password_hash']`) before building the query. |
| SEC-VULN-03 | RLS bypass via `app.bypass_tenant_check` | `services/sync.ts:36,293`, `lib/db.ts:35` | Sync operations disable PostgreSQL row-level security and rely solely on application-level `client_id` filtering. Any query that omits `client_id` from its WHERE clause leaks cross-tenant data. | Audit every query in `processSyncPush` and `processSyncPull` to confirm `client_id` is present. Remove `bypass_tenant_check` if possible; if required, gate it behind a server-side constant, not a user-supplied value. Add a database trigger or comment that asserts RLS is active for non-sync sessions. |

---

# HIGH

| ID | Vulnerability | Affected Location | Root Cause | Fix Guidance |
|---|---|---|---|---|
| SEC-VULN-04 | Unauthenticated client error endpoint | `routes/clientErrors.ts:7-48` | `/api/v1/client-errors` POST has no `requireAuth` middleware. Anyone can submit error reports. | Add `requireAuth` or at minimum a rate-limited anonymous endpoint with strict payload validation. |
| SEC-VULN-05 | Error stack traces exposed to admins | `services/jobErrors.ts:70-78` | `listJobErrors` returns `error_stack` and `input_payload` to Admin/Reviewer users, leaking internal file paths, database internals, and request payloads. | Strip or truncate `error_stack` to the first meaningful frame. Sanitize `input_payload` to remove secrets before returning. |
| SEC-VULN-06 | Password reset token race condition | `services/auth.ts:36-56` | The SELECT does not check `consumed_at`. Two concurrent requests with the same valid token can both pass bcrypt before either sets `consumed_at`, allowing token reuse. | Add `AND consumed_at IS NULL` to the SELECT. Use a single atomic UPDATE that checks `consumed_at IS NULL` and returns the row, then compare the token. |
| SEC-VULN-07 | No file size or type limits on photo uploads | `routes/sync.ts:7` | `multer({ storage: multer.memoryStorage() })` has no `limits` option. An attacker can upload arbitrarily large files, exhausting server memory. No content-type whitelist or magic-byte validation is performed. | Add `limits: { fileSize: 10 * 1024 * 1024, files: 1 }` to multer. Validate `file.mimetype` against an allowlist (`image/jpeg`, `image/png`). Optionally validate magic bytes server-side. |

---

# MEDIUM

| ID | Vulnerability | Affected Location | Root Cause | Fix Guidance |
|---|---|---|---|---|
| SEC-VULN-08 | Insecure direct object reference in timesheets | `routes/timesheets.ts:127-134` | `clientId` is taken from `req.query.client_id` if provided, allowing any authenticated user to read/modify another client's timesheets by supplying that client's ID. | Remove the `req.query.client_id` override. Use only `req.user!.client_id` for all timesheet lookups. |
| SEC-VULN-09 | Client-controlled priority self-triage in sync | `services/sync.ts:67` | `tier = data.priority_rating ?? 'P3'` allows the mobile client to self-assign deficiency priority. A malicious or buggy client could downgrade P1 deficiencies to P5. | Always calculate priority server-side. Remove `data.priority_rating` from the accepted schema or ignore it and recompute from `consequence_severity` and `likelihood`. |
| SEC-VULN-10 | CORS falls back to localhost in production | `index.ts:41-44` | `origin: process.env.CORS_ORIGIN || 'http://localhost:3000'` allows localhost when `CORS_ORIGIN` is unset, which is wrong for production. | Use a hardcoded allowlist. If `CORS_ORIGIN` is not set in production, return a 500 or use a specific production domain. Do not default to localhost. |
| SEC-VULN-11 | CSV injection in imports | `services/imports.ts:28-58` | Raw CSV cell values are stored without sanitization. Formulas like `=cmd|'/c calc'!A1` execute when the exported CSV is opened in Excel. | Prefix cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` with a single quote or tab. Validate on import and sanitize on export. |
| SEC-VULN-12 | No rate limiting on auth endpoints | `routes/auth.ts` | Only `/forgot-password` and `/reset-password` have rate limiters. Login, invite, switch-client, and PIN endpoints are unprotected against brute-force. | Apply `express-rate-limit` to all auth routes. Limit login to 5 attempts per 15 minutes per IP. Apply similar limits to invite activation and PIN verify. |
| SEC-VULN-13 | Duplicate router registration | `index.ts:33-35,65-72` | `usersRouter2` and `clientsRouter2` are imported as aliases but may not be used. If they are mounted, routes execute twice. If not, dead code increases attack surface. | Remove unused `usersRouter2` and `clientsRouter2` imports. Verify each `app.use` mounts exactly one router instance. |

---

# LOW

| ID | Vulnerability | Affected Location | Root Cause | Fix Guidance |
|---|---|---|---|---|
| SEC-VULN-14 | JWT issuer/audience not validated | `middleware/auth.ts:24` | `jwt.verify(token, secret)` validates the signature but does not enforce `iss` or `aud` claims. Tokens from other services using the same secret could be accepted. | Pass `{ issuer: 'structapp-app', audience: 'structapp-api' }` as the third argument to `jwt.verify`. |
| SEC-VULN-15 | Missing security headers (Helmet) | `index.ts:40-44` | The app uses `cors` but not `helmet`. Missing `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, and `Content-Security-Policy` reduce defense-in-depth. | Add `app.use(helmet())` with a production-appropriate content security policy. |
| SEC-VULN-16 | Password hash strength too low | `services/auth.ts:46,99,166`, `routes/users.ts:144` | `bcrypt.hash(password, 10)` uses 10 rounds, which is below current OWASP recommendations (12+ rounds for bcrypt). | Increase to 12 or 14 rounds. Re-hash on next successful login if the stored hash was created with fewer rounds. |
| SEC-VULN-17 | Refresh token not invalidated on logout | `services/auth.ts` | Logout logic (if any) should invalidate the refresh token. If the refresh token is stored only as a JWT without a server-side revocation list, a stolen refresh token remains valid until expiry. | Store refresh token hashes in the database. On logout, mark the hash as revoked. Check revocation on refresh. |

---

## Remediation Order

1. **SEC-VULN-01** — Hardcoded JWT fallback secret (CRITICAL)
2. **SEC-VULN-03** — RLS bypass in sync (CRITICAL)
3. **SEC-VULN-02** — SQL injection via dynamic columns (CRITICAL)
4. **SEC-VULN-04** — Unauthenticated error endpoint (HIGH)
5. **SEC-VULN-06** — Password reset token race (HIGH)
6. **SEC-VULN-07** — Unlimited file uploads (HIGH)
7. **SEC-VULN-05** — Stack trace exposure (HIGH)
8. **SEC-VULN-08** — IDOR in timesheets (MEDIUM)
9. **SEC-VULN-09** — Client-controlled priority (MEDIUM)
10. **SEC-VULN-12** — Missing auth rate limits (MEDIUM)
11. **SEC-VULN-10** — CORS localhost fallback (MEDIUM)
12. **SEC-VULN-11** — CSV injection (MEDIUM)
13. **SEC-VULN-13** — Duplicate router registration (MEDIUM)
14. **SEC-VULN-14** — JWT issuer/audience (LOW)
15. **SEC-VULN-15** — Missing Helmet headers (LOW)
16. **SEC-VULN-16** — Low bcrypt rounds (LOW)
17. **SEC-VULN-17** — Refresh token revocation (LOW)
