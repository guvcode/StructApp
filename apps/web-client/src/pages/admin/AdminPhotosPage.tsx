import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Skeleton from '../../components/Skeleton';
import { getAdminPhotos } from '../../services/api/adminPhotos';
import PhotoGallery from '../../components/PhotoGallery';
import type { AdminPhotoResponse } from '../../services/api/adminPhotos';

function parseGpsFromRaw(raw?: string): { lat?: number; lng?: number } {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return {
      lat: parsed.GPSLatitude,
      lng: parsed.GPSLongitude,
    };
  } catch {
    return {};
  }
}

export default function AdminPhotosPage() {
  const [clientFilter, setClientFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['admin-photos', clientFilter, searchQuery],
    queryFn: getAdminPhotos,
  });

  const filtered = photos.filter(p => {
    if (clientFilter && p.client_name !== clientFilter) return false;
    if (searchQuery && !p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) && !p.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const clients = Array.from(new Set(photos.map(p => p.client_name).filter(Boolean))) as string[];

  if (isLoading) {
    return <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      </div>
    </div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Photo Library</h1>
        <span className="text-xs text-text-secondary bg-surface-secondary px-2 py-1 rounded-full">{filtered.length} of {photos.length} photos</span>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by caption or filename..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary placeholder-text-secondary text-sm"
        />
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm"
        >
          <option value="">All Clients</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="text-text-secondary text-sm text-center py-12 border border-dashed border-border rounded-lg">
          {photos.length === 0 ? 'No photos found in the system.' : 'No photos match the current filters.'}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(p => {
          const gps = parseGpsFromRaw(p.raw_exif_payload);
          const hasGps = p.gps_latitude != null || gps.lat != null;
          return (
          <div key={p.photo_id} className="bg-surface-primary border border-border rounded-lg overflow-hidden">
            <img src={p.storage_url} alt={p.caption} className="w-full h-40 object-cover" />
            <div className="p-3">
              <p className="text-xs font-medium text-text-primary truncate" title={p.caption}>{p.caption}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">{p.client_name} {p.site_id ? `· ${p.site_id}` : ''}</p>
              {p.original_filename && <p className="text-[10px] text-text-muted mt-0.5 truncate" title={p.original_filename}>{p.original_filename}</p>}
              {p.camera_make && p.camera_model && <p className="text-[10px] text-text-muted">{p.camera_make} {p.camera_model}</p>}
              {p.captured_at && <p className="text-[10px] text-text-muted">{new Date(p.captured_at).toLocaleString()}</p>}
              {hasGps && (
                <p className="text-[10px] text-text-muted mt-0.5">
                  GPS: {(p.gps_latitude ?? gps.lat)?.toFixed(4)}, {(p.gps_longitude ?? gps.lng)?.toFixed(4)}
                </p>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
