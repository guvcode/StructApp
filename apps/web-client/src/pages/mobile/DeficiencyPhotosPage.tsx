import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { useOfflinePhotos } from '../../hooks/useOfflinePhotos';
import { uploadPhotoToCloudinary } from '../../lib/photoUpload';
import { getActiveClientId } from '../../lib/authStore';
import { getDeficiencyPhotos } from '../../services/api/photos';
import type { OfflinePhoto } from '../../lib/db';
import { InspectionStatus } from '../../types';

export default function DeficiencyPhotosPage() {
  const { localId } = useParams<{ localId: string }>();
  const { photos, isLoaded, addPhoto, removePhoto } = useOfflinePhotos(localId);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setError('');
  }, [localId]);

  const { data: deficiency } = useQuery({
    queryKey: ['deficiency', localId],
    queryFn: () => apiClient<{ title: string; priority_tier: string; inspection_id?: string }>(ENDPOINTS.deficiencies.byId(localId!)),
    enabled: !!localId,
    retry: false,
  });

  const { data: inspection } = useQuery({
    queryKey: ['inspection', deficiency?.inspection_id],
    queryFn: () => apiClient<{ status: string }>(ENDPOINTS.inspections.byId(deficiency!.inspection_id!)),
    enabled: !!deficiency?.inspection_id,
    retry: false,
  });
  const isReadOnly = inspection?.status === InspectionStatus.Submitted || inspection?.status === InspectionStatus.Approved;

  const { data: serverPhotos = [] } = useQuery({
    queryKey: ['deficiency-photos', localId],
    queryFn: () => getDeficiencyPhotos(localId!),
    enabled: !!localId && localId !== 'new',
    retry: false,
  });

  const displayPhotos = useMemo(() => {
    const localUrls = new Set(photos.map(p => p.cloudinaryUrl).filter(Boolean));
    const serverMapped: Array<{ id: string; imgSrc: string; caption: string; createdAt: string; syncState: string; serverPhotoId?: string }> = serverPhotos
      .filter(sp => !localUrls.has(sp.storage_url))
      .map(sp => ({
        id: sp.photo_id,
        imgSrc: sp.storage_url,
        caption: sp.caption,
        createdAt: sp.created_at,
        syncState: 'synced',
        serverPhotoId: sp.photo_id,
      }));
    const localMapped = photos.map(p => ({
      id: p.photoId,
      imgSrc: p.fileData || p.cloudinaryUrl || '',
      caption: p.caption,
      createdAt: p.createdAt,
      syncState: p.syncState,
      photoId: p.photoId,
    }));
    return [...serverMapped, ...localMapped].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [photos, serverPhotos]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // If the deficiency has a server ID, upload immediately
      const isSaved = localId && localId !== 'new';
      let cloudinaryUrl: string | undefined;
      let exifData: OfflinePhoto['exif'] = undefined;

      if (isSaved && deficiency?.inspection_id) {
        // Upload to Cloudinary with EXIF stripping
        const clientId = getActiveClientId() || 'unknown';
        const photoId = `photo-${Date.now()}`;
        const publicId = `${clientId}/inspections/${deficiency.inspection_id}/deficiencies/${localId}/${photoId}`;
        const result = await uploadPhotoToCloudinary(file, publicId);
        cloudinaryUrl = result.cloudinaryUrl;
        exifData = result.exif ?? undefined;

        // Save to API
        const body: Record<string, unknown> = {
          storage_url: cloudinaryUrl,
          caption: caption.trim() || file.name,
        };
        if (exifData) {
          const exifBody: Record<string, unknown> = {
            original_filename: exifData.originalFilename,
            captured_at: exifData.capturedAt,
            raw_exif_payload: exifData.rawExifPayload,
          };
          if (exifData.cameraMake) exifBody.camera_make = exifData.cameraMake;
          if (exifData.cameraModel) exifBody.camera_model = exifData.cameraModel;
          body.exif = exifBody;
        }
        await apiClient(ENDPOINTS.deficiencies.addPhoto(localId!), {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      // Read file as base64 for local storage (EXIF already stripped by upload if saved, otherwise raw)
      const dataUrl = await fileToDataUrl(file);

      const newPhoto: OfflinePhoto = {
        photoId: `photo-${Date.now()}`,
        deficiencyLocalId: localId ?? '',
        filename: file.name,
        fileData: dataUrl,
        caption: caption.trim() || file.name,
        cloudinaryUrl,
        syncState: isSaved ? 'synced' : 'pending',
        createdAt: new Date().toISOString(),
      } as OfflinePhoto;
      if (exifData) (newPhoto as Record<string, unknown>).exif = exifData;

      await addPhoto(newPhoto);
      setCaption('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async (photoId: string) => {
    await removePhoto(photoId);
  };

  if (!isLoaded) {
    return <div className="p-4 text-text-secondary text-sm">Loading photos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (!localId || localId === 'new') {
              navigate(-1);
            } else {
              navigate(`/m/deficiencies/${localId}?inspection_id=${deficiency?.inspection_id ?? ''}`);
            }
          }}
          className="p-1 -ml-1 text-text-primary hover:text-accent"
          aria-label="Back to deficiency detail"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-lg font-bold text-text-primary">Photo Manager / Evidence</h2>
      </div>
      {deficiency && (
        <p className="text-sm text-text-secondary">{deficiency.title}</p>
      )}

      {deficiency && (deficiency.priority_tier === 'P1' || deficiency.priority_tier === 'P2') && displayPhotos.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          This {deficiency.priority_tier} finding requires at least one photo before submission.
        </div>
      )}

      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          This inspection is {inspection?.status?.toLowerCase()} — photos are read-only.
        </div>
      )}

      {!isReadOnly && (
      <div className="space-y-3">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileSelected}
          className="hidden"
          aria-label="Take photo with camera"
        />
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={handleFileSelected}
          className="hidden"
          aria-label="Choose photo from gallery"
        />
        <div className="flex gap-2">
          <input
            placeholder="Photo caption (optional — defaults to filename)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary placeholder-text-secondary text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 px-4 py-3 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            aria-label="Take photo with camera"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {uploading ? 'Processing...' : 'Take Photo'}
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 px-4 py-3 bg-surface-secondary border border-border text-text-primary rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            aria-label="Choose photo from gallery"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {uploading ? 'Processing...' : 'From Gallery'}
          </button>
        </div>
        {error && (
          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 font-bold leading-none"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      )}

      <p className="text-xs text-text-secondary">{displayPhotos.length} photo{displayPhotos.length !== 1 ? 's' : ''}</p>

      {displayPhotos.length === 0 && (
        <div className="text-text-secondary text-sm text-center py-8 border border-dashed border-border rounded-lg">
          No photos yet. Use "Take Photo" or "From Gallery" to add evidence.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {displayPhotos.map(photo => (
          <div key={photo.id} className="bg-surface-primary border border-border rounded-lg p-2">
            <img src={photo.imgSrc} alt={photo.caption} className="w-full h-24 object-cover rounded mb-1" />
            <p className="text-xs text-text-primary truncate">{photo.caption}</p>
            <div className="flex justify-between items-center mt-1">
              {photo.syncState === 'synced' && <span className="text-xs text-green-600">synced</span>}
              {photo.syncState === 'pending' && <span className="text-xs text-yellow-600">pending</span>}
              {photo.syncState === 'failed' && <span className="text-xs text-red-600">failed</span>}
              {!isReadOnly && 'photoId' in photo && photo.photoId && (
              <button
                onClick={() => handleRemove(photo.photoId!)}
                className="text-xs text-red-600"
                aria-label={`Delete photo: ${photo.caption}`}
              >
                Delete
              </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isReadOnly && (
        <button
          onClick={() => {
            if (!localId || localId === 'new') {
              navigate(-1);
            } else {
              navigate(`/m/deficiencies/${localId}?inspection_id=${deficiency?.inspection_id ?? ''}`);
            }
          }}
          className="w-full px-4 py-3 bg-accent text-white rounded-lg text-sm font-medium"
        >
          Back to Details
        </button>
      )}
    </div>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}