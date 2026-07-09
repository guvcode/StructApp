import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || '',
  api_key: process.env.CLOUDINARY_KEY || '',
  api_secret: process.env.CLOUDINARY_SECRET || '',
});

const PRESET_NAME = 'structapp_unsigned';

async function main() {
  console.log(`Creating upload preset "${PRESET_NAME}"...`);

  try {
    const result = await cloudinary.api.create_upload_preset({
      name: PRESET_NAME,
      unsigned: true,
      folder: 'structapp',
      auto_create_folders: true,
      use_filename: true,
      unique_filename: true,
    });
    console.log('Upload preset created successfully:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err: unknown) {
    const error = err as { http_code?: number; message?: string };
    if (error.http_code === 409) {
      console.log(`Preset "${PRESET_NAME}" already exists. Updating instead...`);
      const result = await cloudinary.api.update_upload_preset(PRESET_NAME, {
        unsigned: true,
        folder: 'structapp',
        auto_create_folders: true,
        use_filename: true,
        unique_filename: true,
      });
      console.log('Upload preset updated successfully:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Failed to create upload preset:', error.message || error);
      process.exit(1);
    }
  }
}

main();