import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || '',
  api_key: process.env.CLOUDINARY_KEY || '',
  api_secret: process.env.CLOUDINARY_SECRET || '',
});

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  clientSlug: string,
  inspectionId: string,
  deficiencyId: string,
  purpose: string
): Promise<string> {
  const folder = `clients/${clientSlug}/inspections/${inspectionId}/${purpose}/${deficiencyId}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `structapp/${folder}`, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result!.secure_url))
    );
    stream.end(fileBuffer);
  });
}