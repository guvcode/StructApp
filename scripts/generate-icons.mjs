// Generate valid PNG icons for PWA manifest
// Uses pure Node.js (no external dependencies)
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function crc32(data) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
  }
  return (~c >>> 0);
}

function makePNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // RGB
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // no interlace

  const ihdrChunk = Buffer.concat([Buffer.from('IHDR'), ihdr]);
  const ihdrLen = Buffer.alloc(4); ihdrLen.writeUInt32BE(13);
  const ihdrCrc = Buffer.alloc(4); ihdrCrc.writeUInt32BE(crc32(ihdrChunk));

  // IDAT - raw pixel rows with filter byte
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const off = y * rowSize + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const compressed = deflateSync(raw);
  const idatChunk = Buffer.concat([Buffer.from('IDAT'), compressed]);
  const idatLen = Buffer.alloc(4); idatLen.writeUInt32BE(compressed.length);
  const idatCrc = Buffer.alloc(4); idatCrc.writeUInt32BE(crc32(idatChunk));

  // IEND
  const iendChunk = Buffer.from('IEND');
  const iendLen = Buffer.alloc(4); iendLen.writeUInt32BE(0);
  const iendCrc = Buffer.alloc(4); iendCrc.writeUInt32BE(crc32(iendChunk));

  return Buffer.concat([
    sig,
    ihdrLen, ihdrChunk, ihdrCrc,
    idatLen, idatChunk, idatCrc,
    iendLen, iendChunk, iendCrc,
  ]);
}

writeFileSync('apps/web-client/public/pwa-192x192.png', makePNG(192, 192, 124, 92, 252));
writeFileSync('apps/web-client/public/pwa-512x512.png', makePNG(512, 512, 124, 92, 252));
console.log('Icons created');