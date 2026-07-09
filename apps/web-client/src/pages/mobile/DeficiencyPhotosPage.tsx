import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { useLocalState } from '../../lib/useLocalState';
import type { PhotoRecord } from '../../types/index';
import { SyncState } from '../../types/index';

export default function DeficiencyPhotosPage() {
  const { localId } = useParams<{ localId: string }>();
  const { value: photos, save: setPhotos } = useLocalState<PhotoRecord[]>(`photos-${localId}`);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const isReadOnly = inspection?.status === 'Submitted' || inspection?.status === 'Approved';

  const currentPhotos = photos ?? [];

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newPhoto: PhotoRecord = {
        id: `photo-${Date.now()}`,
        deficiency_local_id: localId ?? '',
        dataUrl,
        caption: caption.trim() || file.name,
        purpose: 'evidence',
        created_at: new Date().toISOString(),
        sync_state: SyncState.pending,
      };
      setPhotos([...currentPhotos, newPhoto]);
      setCaption('');
      setError('');
    };
    reader.onerror = () => setError('Failed to read the selected image.');
    reader.readAsDataURL(file);
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = (photoId: string) => {
    setPhotos(currentPhotos.filter(p => p.id !== photoId));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">Photo Manager / Evidence</h2>
      {deficiency && (
        <p className="text-sm text-text-secondary">{deficiency.title}</p>
      )}

      {deficiency && (deficiency.priority_tier === 'P1' || deficiency.priority_tier === 'P2') && currentPhotos.length === 0 && (
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
          aria-label="Select photo from gallery"
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
            disabled={currentPhotos.length >= 5}
            className="flex-1 px-4 py-3 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            aria-label="Take photo or choose from gallery"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {currentPhotos.length >= 5 ? 'Max 5 photos' : 'Take Photo / Choose from Gallery'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      )}

      <p className="text-xs text-text-secondary">{currentPhotos.length}/5 photos</p>

      {currentPhotos.length === 0 && (
        <div className="text-text-secondary text-sm text-center py-8 border border-dashed border-border rounded-lg">
          No photos yet. Tap "Take Photo / Choose from Gallery" to add evidence.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {currentPhotos.map(photo => (
          <div key={photo.id} className="bg-surface-primary border border-border rounded-lg p-2">
            <img src={photo.dataUrl} alt={photo.caption} className="w-full h-24 object-cover rounded mb-1" />
            <p className="text-xs text-text-primary truncate">{photo.caption}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-yellow-600">pending</span>
              {!isReadOnly && (
              <button
                onClick={() => handleRemove(photo.id)}
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
    </div>
  );
}