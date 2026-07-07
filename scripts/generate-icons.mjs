// Generate valid PWA icons using pngjs (pure JS, no native deps)
import { writeFileSync } from 'fs';
import { PNG } from 'pngjs';

for (const [size, file] of [[192, 'pwa-192x192.png'], [512, 'pwa-512x512.png']]) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      png.data[idx] = 124;      // R
      png.data[idx + 1] = 92;   // G
      png.data[idx + 2] = 252;  // B
      png.data[idx + 3] = 255;  // A
    }
  }
  writeFileSync(`apps/web-client/public/${file}`, PNG.sync.write(png));
  console.log(`${file} created (${size}x${size})`);
}