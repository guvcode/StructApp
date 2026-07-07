import { useState } from 'react';
import type { PhotoRecord } from '../types/index';

interface PhotoGalleryProps {
  photos: PhotoRecord[];
  title?: string;
}

export default function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [lightbox, setLightbox] = useState<PhotoRecord | null>(null);
  if (photos.length === 0) return null;

  const evidencePhotos = photos.filter(p => p.purpose === 'evidence');
  const remediationPhotos = photos.filter(p => p.purpose === 'remediation_evidence');

  const renderPhoto = (photo: PhotoRecord) => (
    <button
      key={photo.id}
      onClick={() => setLightbox(photo)}
      className="group relative aspect-video bg-surface-secondary rounded-lg overflow-hidden border border-border hover:border-accent transition-colors text-left"
    >
      <img src={photo.dataUrl} alt={photo.caption} className="w-full h-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-xs text-white truncate">{photo.caption}</p>
      </div>
      <span className="absolute top-2 right-2 text-[10px] uppercase bg-black/60 text-white px-1.5 py-0.5 rounded">
        {photo.purpose === 'evidence' ? 'Evidence' : 'Remediation'}
      </span>
    </button>
  );

  return (
    <div>
      {(title || photos.length > 0) && (
        <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-3">
          {title ?? 'Photos'} ({photos.length})
        </p>
      )}

      {evidencePhotos.length > 0 && (
        <div className="mb-4">
          {evidencePhotos.length > 0 && <p className="text-xs text-text-secondary font-medium mb-2">Evidence</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {evidencePhotos.map(renderPhoto)}
          </div>
        </div>
      )}

      {remediationPhotos.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary font-medium mb-2">Remediation</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {remediationPhotos.map(renderPhoto)}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-3xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
            <img src={lightbox.dataUrl} alt={lightbox.caption} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
            <p className="text-white text-sm mt-3 text-center">{lightbox.caption}</p>
            <p className="text-gray-400 text-xs mt-1 text-center">
              {lightbox.purpose === 'evidence' ? 'Inspection Photo' : 'Remediation Photo'}
              <span className="mx-2">·</span>
              {new Date(lightbox.created_at).toLocaleDateString()}
            </p>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-xl"
              aria-label="Close lightbox"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}