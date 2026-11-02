// ──────────────────────────────────────────────────────────────────────────────
// PWA icon generator — emits placeholder PNG icons into /public/icons.
//
// These are *placeholders*: a white heart on the CareConnect brand colour, drawn
// procedurally so we don't need a binary design asset checked in. Replace the
// PNGs with real artwork before production — the manifest references stay valid.
//
// Pure Node (zlib only): rasterises a heart, then hand-encodes a PNG. Run with:
//   node scripts/gen-icons.mjs
// ──────────────────────────────────────────────────────────────────────────────
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

// Brand colours (calm-600 background, white heart)
const BRAND = [0x14, 0x64, 0x88]; // #146488
const WHITE = [0xff, 0xff, 0xff];

// CRC-32 table for PNG chunk checksums
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// Is normalised point (nx, ny) inside the classic heart curve?
// (x² + y² − 1)³ − x²·y³ ≤ 0
function insideHeart(nx, ny) {
  const a = nx * nx + ny * ny - 1;
  return a * a * a - nx * nx * ny * ny * ny <= 0;
}

function encodePng(size, { maskable }) {
  const raw = Buffer.alloc(size * (size * 4 + 1)); // +1 filter byte per row
  // Heart scale: maskable keeps art within the central ~60% safe zone;
  // the "any" icon can use more of the canvas (~80%).
  const span = maskable ? 1.7 : 1.35;

  for (let py = 0; py < size; py++) {
    const rowStart = py * (size * 4 + 1);
    raw[rowStart] = 0; // filter type 0 (none)
    for (let px = 0; px < size; px++) {
      // Map pixel → heart space (y axis pointing up, slight vertical offset)
      const nx = ((px / (size - 1)) * 2 - 1) * span;
      const ny = (1 - (py / (size - 1)) * 2) * span + 0.25;
      const inHeart = insideHeart(nx, ny);

      let r, g, b, a;
      if (maskable) {
        // Full-bleed brand background, white heart (safe for any mask)
        [r, g, b] = inHeart ? WHITE : BRAND;
        a = 0xff;
      } else if (inHeart) {
        // Transparent background, brand-coloured heart
        [r, g, b] = BRAND;
        a = 0xff;
      } else {
        r = g = b = 0;
        a = 0x00;
      }

      const o = rowStart + 1 + px * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type 6 = RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // signature
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'maskable-192.png', size: 192, maskable: true },
  { file: 'maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true }, // iOS wants opaque
];

for (const t of targets) {
  writeFileSync(join(OUT_DIR, t.file), encodePng(t.size, { maskable: t.maskable }));
  console.log(`  emitted public/icons/${t.file} (${t.size}×${t.size})`);
}
console.log('PWA icons generated.');
