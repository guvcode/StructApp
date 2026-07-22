# Memory — BL-038 photo metadata visibility

Last updated: 2026-07-22T11:28:00-06:00

## What was built

- **Photo metadata types** — Added `original_filename`, `captured_at`, `camera_make`, `camera_model`, `raw_exif_payload`, `gps_latitude`, `gps_longitude` to `PhotoRecord` (frontend), `PendingPhoto` (frontend), `PendingPhotoInput` (backend Zod schema), and `PendingPhotoRow` (backend)
- **PhotoGallery.tsx** — Added `PhotoMetadata` component with expandable details (filename, captured time, camera info, GPS coordinates) rendered in the lightbox when metadata exists
- **ReconciliationQueuePage.tsx** — Replaced plain text photo list with 2-column grid of `Card` components showing thumbnails, original filename, camera, capture time, and GPS coordinates; uses `useMemo` for selected structure lookup
- **Admin Photos page/adminPhotos service/adminPhotos route** — New admin `/admin/photos` route, page, and backend query with RequireAdminOrReviewer guard; sidebar icon and menu entry added
- **Backend** — `getPendingPhotosForBundle` SELECT now returns metadata columns; `addPhotoToPendingDeficiency` INSERT now stores them

## Tests

- **B30** (`tests/b30-photo-metadata.test.tsx`) — 4 tests: PhotoGallery lightbox renders metadata, hides when absent, fallback parses `raw_exif_payload`, hides GPS block when no GPS
- **B31** (`tests/b31-mobile-metadata.test.tsx`) — 3 tests: Mobile DeficiencyPhotosPage dropzone captures metadata, shows camera/GPS, shows captured timestamp
- **B32** (`tests/b32-reconciliation-grid.test.tsx`) — 5 tests: ReconciliationQueuePage image grid renders cards, thumbnails, metadata, camera text, GPS text
- All 12 tests pass (`npx vitest run`)
- Backend `pendingStructures.test.ts` updated and all 17 tests pass

## Decisions made

- Admin Photos page uses same `PhotoMetadata` component as contractor-facing gallery (DRY)
- Backend stores metadata as nullable columns; frontend types make fields optional for backward compatibility

## Current state

- Committed and pushed to `task/BL-038-photo-metadata-visibility`
- Progress tracker updated