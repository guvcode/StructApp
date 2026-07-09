import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';

export interface PhotoApiResponse {
  photo_id: string;
  deficiency_id: string;
  storage_url: string;
  caption: string;
  display_order: number;
  created_at: string;
  original_filename?: string;
  captured_at?: string;
  camera_make?: string;
  camera_model?: string;
  raw_exif_payload?: string;
}

export interface CreatePhotoInput {
  storage_url: string;
  caption: string;
  display_order?: number;
  exif?: {
    original_filename: string;
    captured_at: string;
    camera_make?: string;
    camera_model?: string;
    raw_exif_payload: string;
  };
}

export async function getDeficiencyPhotos(deficiencyId: string): Promise<PhotoApiResponse[]> {
  return apiClient(ENDPOINTS.deficiencies.photos(deficiencyId));
}

export async function createDeficiencyPhoto(deficiencyId: string, input: CreatePhotoInput): Promise<PhotoApiResponse> {
  return apiClient(ENDPOINTS.deficiencies.addPhoto(deficiencyId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}