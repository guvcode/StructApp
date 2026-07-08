# Offline PIN Login + Onboarding Plan

## What we are building

A PIN-based offline login system for the mobile PWA. Users set a PIN after first login (skippable). The PIN hash is stored in Dexie for local offline verification AND synced to the server (argon2 hash stored in `users.pin_hash`) so it works across multiple devices. The login page switches to PIN entry when offline if a PIN is configured.

## Architecture

```
Offline login:  User enters PIN → SHA-256 local verify against Dexie hash → restore cached session
Online setup:   User sets PIN → SHA-256 hash stored in Dexie → argon2 hash sent to POST /auth/pin
Multi-device:   Device B comes online → GET /auth/pin checks if user has server PIN → downloads for offline use
```

## Files to modify/create

### Backend (`apps/api-server`)

| File | Action | Change |
|---|---|---|
| `src/routes/auth.ts` | Add | `POST /auth/pin` — authenticated user sets their own PIN hash (argon2) |
| `src/routes/auth.ts` | Add | `GET /auth/pin` — authenticated user checks if PIN exists on their account |
| `src/services/pin.ts` | No change | Already has `hashPin`/`verifyPin` (argon2) |

### Frontend (`apps/web-client`)

| File | Action | Change |
|---|---|---|
| `src/lib/db.ts` | Modify | Add `pinHash` and `userData` JSON fields to `AuthState` type; version bump to 2 |
| `src/hooks/usePinAuth.ts` | Create | SHA-256 local hash/verify, Dexie store/retrieve, online sync to server |
| `src/pages/auth/PinSetupPage.tsx` | Create | 4-6 digit PIN entry + confirm + skip button + sync to server |
| `src/pages/auth/LoginPage.tsx` | Modify | Add offline PIN mode: check `navigator.onLine` + `hasPin()` → show PIN entry |
| `src/pages/mobile/SettingsPage.tsx` | Modify | Add "Set/Change PIN" button |
| `src/components/RouteGuard.tsx` | Modify | After first login, redirect to `/m/setup-pin` if no PIN set (skippable) |
| `src/services/api/endpoints.ts` | Modify | Add `auth.pin` endpoint URLs |
| `src/services/api/auth.ts` | Modify | Add `syncPinToServer()`, `checkServerPin()`, `clearServerPin()` |
| `src/routes.tsx` | Modify | Add `/m/setup-pin` route |

## Detailed implementation steps

### Step 1 — Backend: Add PIN endpoints (`routes/auth.ts`)

```typescript
// POST /auth/pin — set/update own PIN hash
const pinSchema = z.object({ pin_hash: z.string().min(1) });
router.post('/pin', requireAuth, async (req, res, next) => {
  try {
    const { pin_hash } = pinSchema.parse(req.body);
    await pool.query(
      `UPDATE users SET pin_hash = $1, pin_set_at = NOW(), must_set_pin = FALSE
       WHERE user_id = $2`,
      [pin_hash, req.user!.sub],
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /auth/pin — returns whether user has a PIN
router.get('/pin', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT pin_hash IS NOT NULL AS has_pin FROM users WHERE user_id = $1',
      [req.user!.sub],
    );
    res.json({ success: true, data: { has_pin: result.rows[0]?.has_pin || false } });
  } catch (err) { next(err); }
});
```

### Step 2 — Update Dexie schema (`lib/db.ts`)

- Add `pinHash?: string` and `userData?: string` to `AuthState` type
- Bump Dexie version from 1 to 2 with upgrade logic (preserve existing data)

### Step 3 — Create `usePinAuth.ts` hook

Functions:
- `savePinLocally(pin: string)`: SHA-256 hash via Web Crypto → store in Dexie alongside current `authStore` session data
- `verifyPinLocally(pin: string): boolean`: SHA-256 hash → compare with Dexie `pinHash`
- `hasLocalPin(): boolean`: check Dexie for `pinHash`
- `syncPinToServer()`: read Dexie pinHash → POST to `/auth/pin` (server-side argon2 re-hash)
- `checkServerPin(): boolean`: GET `/auth/pin` → populate Dexie if server has PIN but local doesn't
- `clearLocalPin()`: remove PIN from Dexie

PIN hashing for local verification uses SHA-256 (Web Crypto API — works offline, no deps). The hash sent to server is a SHA-256 hash (the server re-hashes with argon2).

### Step 4 — Create `PinSetupPage.tsx`

Route: `/m/setup-pin`
- Enter 4-6 digit PIN
- Confirm PIN
- On save: `savePinLocally()` + `syncPinToServer()` (fire-and-forget, no block if offline)
- Skip button → redirects to landing route
- Validates: PIN is 4-6 digits, confirm matches

### Step 5 — Modify `LoginPage.tsx`

- On mount, check `navigator.onLine`
- If online → show normal email/password form (existing behavior)
- If offline:
  - Check `hasLocalPin()`
  - If yes → show PIN entry UI with keypad
  - If no → show "No network — sign in with email/password when connected"
- PIN entry flow:
  - Enter PIN → `verifyPinLocally()` → if match, call `setSession()` with cached user data, redirect to landing route
  - If wrong → show error, max 5 attempts then lockout

### Step 6 — Modify `RouteGuard.tsx`

- Add `/m/setup-pin` to public/auth routes
- After login, check if `hasLocalPin() === false` → redirect to `/m/setup-pin` (with skip option)

### Step 7 — Modify `SettingsPage.tsx`

- Add "Set PIN" or "Change PIN" row
- Tapping it navigates to `/m/setup-pin`
- Show "PIN enabled" / "PIN disabled" status

### Step 8 — Add endpoints & API functions

- `ENDPOINTS.auth.pin`: `${BASE_URL}/auth/pin`
- `auth.ts`: `syncPinToServer(pinHash: string)`, `checkServerPin(): Promise<boolean>`, `clearServerPin()`

### Step 9 — Build and verify

- `npm run build` on both api-server and web-client
- No TS errors (excluding pre-existing TS6059)

## Multi-device sync flow

1. User sets PIN on Device A → `savePinLocally()` → `syncPinToServer()` (POST argon2 hash to server)
2. User logs in on Device B (online, email/password) → `RouteGuard` checks if PIN exists locally
3. If no local PIN → `checkServerPin()` → if server has PIN → prompt "A PIN is set on another device. Download it for offline use?"
4. User confirms → server returns pin_hash → stored in Dexie for offline use
5. Now Device B also has offline PIN login
6. User changes PIN on Device A → updates Dexie + server → Device B syncs on next online check

## PIN security

- Local: SHA-256 hashed (fast, works offline, adequate for local device security)
- Server: argon2id hashed (slow, resists brute force, standard password hashing)
- 5 failed attempts → lockout (frontend-imposed, resets on successful online login)
- PIN is 4-6 numeric digits (standard mobile pattern)