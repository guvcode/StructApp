# Implementation Plan — Photos Page Navigation Fix

## What we are building
Add a back-navigation affordance to the mobile `DeficiencyPhotosPage` so users can return to the deficiency detail page after taking/uploading images. Currently there is no "Back" button, "Done" button, or any on-screen way to leave the photos page.

## Language we agreed on
- **Back navigation**: Navigate to explicit URL `/m/deficiencies/:localId?inspection_id=...` (not history.back)
- **Done button**: Navigation only — photos are uploaded immediately when taken, no additional save action needed

## Affected files
- `apps/web-client/src/pages/mobile/DeficiencyPhotosPage.tsx` — only file that needs changes

## Changes to make

### 1. Add an import for `useNavigate`
Add `useNavigate` to the existing react-router-dom import on line 3.

### 2. Replace the static `<h2>` header with a header bar containing a back arrow + title
- Use `useNavigate()` to get navigate function
- Show a left-pointing chevron SVG button alongside the heading text
- On click, navigate to `/m/deficiencies/${localId}?inspection_id=${deficiency?.inspection_id ?? ''}`
- If `localId` is undefined or `'new'`, fall back to `navigate(-1)` as a safety net

### 3. Add a "Done" button below the photo grid
- Styled as a full-width accent button (same style as the "Take Photo" / "From Gallery" buttons)
- Navigates to the same deficiency detail URL as the back arrow
- Hidden when `isReadOnly` (consistent with the upload buttons)

## Edge cases
- **localId is undefined or 'new'**: Fall back to `navigate(-1)` since there's no valid detail page URL
- **deficiency query not yet loaded**: The back arrow and Done button will navigate with empty `inspection_id` param — the detail page handles missing `inspection_id` gracefully via its own fallbacks
- **Read-only mode**: Done button is hidden alongside upload buttons

## Validation
- Verify no TypeScript errors: `cd apps/web-client && npx tsc --noEmit --skipLibCheck 2>&1 | Where-Object { $_ -notmatch 'TS6059' }`
- Verify no test regressions: `npx jest tests/ --no-coverage` (if tests exist for this page)