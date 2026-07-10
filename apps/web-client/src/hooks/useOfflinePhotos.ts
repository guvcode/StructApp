import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/db';
import type { OfflinePhoto } from '../lib/db';
import { uploadPhotoToCloudinary } from '../lib/photoUpload';
import { createDeficiencyPhoto } from '../services/api/photos';
import { getActiveClientId } from '../lib/authStore';

export interface UseOfflinePhotosResult {
  photos: OfflinePhoto[];
  isLoaded: boolean;
  addPhoto: (photo: OfflinePhoto) => Promise<void>;
  removePhoto: (photoId: string) => Promise<void>;
  uploadPending: (deficiencyServerId: string, inspectionId: string) => Promise<void>;
  getPhotoCount: () => number;
}

export function useOfflinePhotos(deficiencyLocalId: string | undefined): UseOfflinePhotosResult {
  const [photos, setPhotos] = useState<OfflinePhoto[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load photos from Dexie on mount / when localId changes
  useEffect(() => {
    if (!deficiencyLocalId) { setPhotos([]); setIsLoaded(true); return; }
    let cancelled = false;
    db.offlinePhotos
      .where('deficiencyLocalId')
      .equals(deficiencyLocalId)
      .toArray()
      .then(results => {
        if (!cancelled) {
          setPhotos(results.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
          setIsLoaded(true);
        }
      })
      .catch(() => { if (!cancelled) { setPhotos([]); setIsLoaded(true); } });
    return () => { cancelled = true; };
  }, [deficiencyLocalId]);

  const addPhoto = useCallback(async (photo: OfflinePhoto) => {
    await db.offlinePhotos.put(photo);
    setPhotos(prev => [...prev, photo].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  }, []);

  const removePhoto = useCallback(async (photoId: string) => {
    await db.offlinePhotos.delete(photoId);
    setPhotos(prev => prev.filter(p => p.photoId !== photoId));
  }, []);

  const uploadPending = useCallback(async (
    deficiencyServerId: string,
    inspectionId: string,
  ) => {
    const pending = await db.offlinePhotos
      .where('deficiencyLocalId')
      .equals(deficiencyLocalId!)
      .filter(p => p.syncState === 'pending' && !p.deficiencyServerId)
      .toArray();

    if (pending.length === 0) return;

    const clientId = getActiveClientId() || 'unknown';

    for (const photo of pending) {
      try {
        // Reconstruct the File from the stored base64 data
        const response = await fetch(photo.fileData);
        const blob = await response.blob();
        const file = new File([blob], photo.filename, { type: blob.type || 'image/jpeg' });

        // Upload to Cloudinary (EXIF is already stripped, re-read from stored exif)
        const publicId = `${clientId}/inspections/${inspectionId}/deficiencies/${deficiencyServerId}/${photo.photoId}`;
        const { cloudinaryUrl } = await uploadPhotoToCloudinary(file, publicId);

        // Save to API — build payload with optional camera fields
        const exifPayload: Record<string, unknown> = {
          original_filename: photo.exif?.originalFilename || photo.filename,
          captured_at: photo.exif?.capturedAt || new Date().toISOString(),
          raw_exif_payload: photo.exif?.rawExifPayload || '{}',
        };
        if (photo.exif?.cameraMake) exifPayload.camera_make = photo.exif.cameraMake;
        if (photo.exif?.cameraModel) exifPayload.camera_model = photo.exif.cameraModel;

        const apiPayload: Record<string, unknown> = {
          storage_url: cloudinaryUrl,
          caption: photo.caption,
        };
        if (photo.exif) apiPayload.exif = exifPayload;

        const apiPhoto = await createDeficiencyPhoto(
          deficiencyServerId,
          apiPayload as any,
        );

        // Update Dexie record — set deficiencyLocalId to server ID so photos
        // are visible after navigation to the edit page
        await db.offlinePhotos.put({
          ...photo,
          deficiencyLocalId: deficiencyServerId,
          deficiencyServerId,
          cloudinaryUrl,
          serverPhotoId: apiPhoto.photo_id,
          syncState: 'synced',
        });
      } catch {
        // Mark as failed — update localId so it shows on the edit page
        await db.offlinePhotos.put({ ...photo, deficiencyLocalId: deficiencyServerId, deficiencyServerId, syncState: 'failed' });
      }
    }

    // Refresh local state
    const updated = await db.offlinePhotos
      .where('deficiencyLocalId')
      .equals(deficiencyLocalId!)
      .toArray();
    setPhotos(updated.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  }, [deficiencyLocalId]);

  const getPhotoCount = useCallback(() => photos.length, [photos]);

  return { photos, isLoaded, addPhoto, removePhoto, uploadPending, getPhotoCount };
}