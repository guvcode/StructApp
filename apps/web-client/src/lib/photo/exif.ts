import exifr from 'exifr';

export type ExifData = {
  make?: string;
  model?: string;
  capturedAt?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
};

export async function extractExifData(file: Blob): Promise<ExifData> {
  const tags: Record<string, unknown> = await exifr.parse(file, {
    tiff: true,
    exif: true,
    gps: true,
  });

  const result: ExifData = {};
  const make = tags.Make as string | undefined;
  if (make) result.make = make;
  const model = tags.Model as string | undefined;
  if (model) result.model = model;
  const capturedAt = tags.DateTimeOriginal as string | undefined;
  if (capturedAt) result.capturedAt = capturedAt;
  const gpsLatitude = tags.GPSLatitude as number | undefined;
  if (gpsLatitude) result.gpsLatitude = gpsLatitude;
  const gpsLongitude = tags.GPSLongitude as number | undefined;
  if (gpsLongitude) result.gpsLongitude = gpsLongitude;
  return result;
}