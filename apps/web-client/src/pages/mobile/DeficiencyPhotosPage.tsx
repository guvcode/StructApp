import { useState } from 'react';
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

  const { data: deficiency } = useQuery({
    queryKey: ['deficiency', localId],
    queryFn: () => apiClient<{ title: string; priority_tier: string }>(ENDPOINTS.deficiencies.byId(localId!)),
    enabled: !!localId,
    retry: false,
  });

  const currentPhotos = photos ?? [];

  const handleAdd = () => {
    if (!caption.trim()) return;
    const newPhoto: PhotoRecord = {
      id: `photo-${Date.now()}`,
      deficiency_local_id: localId ?? '',
      dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+UGhvdG88L3RleHQ+PC9zdmc+',
      caption: caption.trim(),
      purpose: 'evidence',
      created_at: new Date().toISOString(),
      sync_state: SyncState.pending,
    };
    setPhotos([...currentPhotos, newPhoto]);
    setCaption('');
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

      <div className="flex gap-2">
        <input
          placeholder="Photo caption (required)"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="flex-1 px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary placeholder-text-secondary text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={currentPhotos.length >= 5 || !caption.trim()}
          className="px-3 py-2 bg-accent text-white rounded-lg text-sm disabled:opacity-50"
          aria-label="Add photo"
        >
          Add Photo
        </button>
      </div>

      <p className="text-xs text-text-secondary">{currentPhotos.length}/5 photos</p>

      {currentPhotos.length === 0 && (
        <div className="text-text-secondary text-sm text-center py-8 border border-dashed border-border rounded-lg">
          No photos yet. Add a caption and click "Add Photo".
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {currentPhotos.map(photo => (
          <div key={photo.id} className="bg-surface-primary border border-border rounded-lg p-2">
            <img src={photo.dataUrl} alt={photo.caption} className="w-full h-24 object-cover rounded mb-1" />
            <p className="text-xs text-text-primary truncate">{photo.caption}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-yellow-600">pending</span>
              <button
                onClick={() => handleRemove(photo.id)}
                className="text-xs text-red-600"
                aria-label={`Delete photo: ${photo.caption}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}