import exifr from 'exifr';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface PhotoUploadResult {
  cloudinaryUrl: string;
  exif: {
    originalFilename: string;
    capturedAt: string;
    cameraMake?: string;
    cameraModel?: string;
    rawExifPayload: string;
  } | null;
}

/**
 * Strip EXIF metadata by re-encoding the image through a canvas element.
 * Returns the stripped Blob.
 */
function stripExif(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to re-encode image'));
      }, file.type || 'image/jpeg', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/**
 * Read EXIF metadata from a file. Returns null if no EXIF data is found.
 */
async function readExif(file: File): Promise<PhotoUploadResult['exif']> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const exifData = await exifr.parse(arrayBuffer, true);
    if (!exifData || Object.keys(exifData).length === 0) return null;

    return {
      originalFilename: file.name,
      capturedAt: exifData.DateTimeOriginal
        ? new Date(exifData.DateTimeOriginal).toISOString()
        : new Date(file.lastModified).toISOString(),
      cameraMake: exifData.Make || undefined,
      cameraModel: exifData.Model || undefined,
      rawExifPayload: JSON.stringify(exifData),
    };
  } catch {
    // If EXIF parsing fails, proceed without EXIF data
    return null;
  }
}

/**
 * Upload an image file to Cloudinary (EXIF-stripped) and return the URL + EXIF metadata.
 *
 * @param file - The raw image file from the camera/gallery
 * @param folderPath - The Cloudinary folder path, e.g. 'structapp/{clientId}/sites/{siteId}/inspections/{inspectionId}/deficiencies/{deficiencyId}'
 * @returns The Cloudinary URL and extracted EXIF metadata
 */
export async function uploadPhotoToCloudinary(
  file: File,
  folderPath: string,
): Promise<PhotoUploadResult> {
  // 1. Read EXIF from original file
  const exif = await readExif(file);

  // 2. Strip EXIF by re-encoding through canvas
  const strippedBlob = await stripExif(file);

  // 3. Upload stripped image to Cloudinary
  const formData = new FormData();
  formData.append('file', strippedBlob, file.name);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('public_id', `${folderPath}/${Date.now()}`);

  const response = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${errBody}`);
  }
  const result = await response.json();

  return { cloudinaryUrl: result.secure_url, exif };
}