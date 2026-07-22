import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';

export interface AdminPhotoResponse {
  photo_id: string;
  deficiency_id?: string;
  storage_url: string;
  caption: string;
  display_order: number;
  created_at: string;
  original_filename?: string;
  captured_at?: string;
  camera_make?: string;
  camera_model?: string;
  raw_exif_payload?: string;
  client_name?: string;
  site_id?: string;
  inspection_id?: string;
  purpose?: string;
}

export async function getAdminPhotos(): Promise<AdminPhotoResponse[]> {
  return apiClient<AdminPhotoResponse[]>(ENDPOINTS.admin.photos);
}
