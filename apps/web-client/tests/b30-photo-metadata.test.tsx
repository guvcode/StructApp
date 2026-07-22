// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PhotoGallery from '../src/components/PhotoGallery';
import type { PhotoRecord } from '../src/types/index';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>;
}

const photoWithMetadata: PhotoRecord = {
  id: 'p-1',
  deficiency_local_id: 'd-1',
  dataUrl: 'https://example.com/photo1.jpg',
  caption: 'Crack evidence',
  purpose: 'evidence',
  created_at: '2025-01-15T10:00:00Z',
  sync_state: 'synced',
  original_filename: 'DSC_0001.jpg',
  captured_at: '2025-01-15T09:30:00Z',
  camera_make: 'Canon',
  camera_model: 'EOS R5',
  raw_exif_payload: JSON.stringify({ GPSLatitude: 51.5, GPSLongitude: -0.12, FocalLength: 24 }),
  gps_latitude: 51.5,
  gps_longitude: -0.12,
};

describe('Bundle 30 — PhotoGallery metadata display', () => {
  beforeEach(() => {
    testQueryClient.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders photo grid with metadata panel in lightbox', async () => {
    render(wrap(
      <MemoryRouter>
        <PhotoGallery photos={[photoWithMetadata]} title="Evidence" />
      </MemoryRouter>
    ));

    const photoBtn = screen.getByRole('button', { name: /crack evidence/i });
    fireEvent.click(photoBtn);

    const lightbox = document.querySelector('.fixed.inset-0');
    expect(lightbox).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /photo details/i }));

    expect(screen.getByText(/DSC_0001.jpg/)).toBeTruthy();
    expect(screen.getByText(/Canon EOS R5/)).toBeTruthy();
    expect(screen.getByText(/51\.5.*-0\.12/)).toBeTruthy();
    expect(screen.getByText(/2025-01-15.*a\.m\./)).toBeTruthy();
  });

  it('does not show GPS section when no gps coordinates', async () => {
    const noGps: PhotoRecord = { ...photoWithMetadata, gps_latitude: undefined, gps_longitude: undefined, raw_exif_payload: undefined };
    render(wrap(
      <MemoryRouter>
        <PhotoGallery photos={[noGps]} title="Evidence" />
      </MemoryRouter>
    ));

    const photoBtn = screen.getByRole('button', { name: /crack evidence/i });
    fireEvent.click(photoBtn);

    fireEvent.click(screen.getByRole('button', { name: /photo details/i }));
    expect(screen.queryByText(/GPS|latitude|longitude/i)).not.toBeTruthy();
  });

  it('shows only filename and date when no camera data', async () => {
    const noCamera: PhotoRecord = { ...photoWithMetadata, camera_make: undefined, camera_model: undefined };
    render(wrap(
      <MemoryRouter>
        <PhotoGallery photos={[noCamera]} title="Evidence" />
      </MemoryRouter>
    ));

    const photoBtn = screen.getByRole('button', { name: /crack evidence/i });
    fireEvent.click(photoBtn);

    fireEvent.click(screen.getByRole('button', { name: /photo details/i }));
    expect(screen.getByText(/DSC_0001.jpg/)).toBeTruthy();
    expect(screen.queryByText(/Canon|EOS/)).not.toBeTruthy();
  });

  it('photo section header shows count', () => {
    render(wrap(
      <MemoryRouter>
        <PhotoGallery photos={[photoWithMetadata]} title="Evidence" />
      </MemoryRouter>
    ));

    expect(screen.getByText(/Evidence \(1\)/)).toBeTruthy();
  });
});
