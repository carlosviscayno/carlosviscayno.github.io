// Shrinks oversized pictures in src/images so the site loads fast and GitHub accepts them (100 MB limit per file).
//
//   node scripts/optimize-images.mjs            -> shrinks every picture that is big (see the numbers below)
//   node scripts/optimize-images.mjs --dry-run  -> only lists what it WOULD change
//
// Safe by design:
//  • Your untouched originals are copied to  images-originals/  (next to src, NOT inside it) before anything changes.
//  • Pictures that are already small are left alone, and so are SVG / GIF files.
//  • Shapes never change: the picture is only made smaller, never cropped. Transparent PNG logos keep their transparency.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Windows keeps a picture "in use" while sharp has it open, which blocks saving over it. So: no caching, and every
// picture is read fully into memory first (the file itself is then free to be replaced).
sharp.cache(false);

const ROOT = path.resolve('src/images');
const BACKUP = path.resolve('images-originals');
const MAX_SIDE = 2400;            // longest side in pixels (the site never shows pictures bigger than this)
const MIN_BYTES = 1.5 * 1024 * 1024; // only touch files bigger than 1.5 MB ... or wider/taller than MAX_SIDE
const JPEG_QUALITY = 82;
const DRY = process.argv.includes('--dry-run');
const TYPES = /\.(jpe?g|png|webp|avif|tiff?|bmp)$/i;

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';

let saved = 0, changed = 0, failed = 0;
for await (const file of walk(ROOT)) {
  if (!TYPES.test(file)) continue;
  const rel = path.relative(ROOT, file);
  try {
    const input = await fs.readFile(file);          // whole picture in memory; the file on disk is not held open
    const before = input.length;
    const meta = await sharp(input, { limitInputPixels: false }).metadata();
    const tooBig = Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_SIDE;
    if (before < MIN_BYTES && !tooBig) continue;

    if (DRY) { console.log(`would shrink  ${rel}  ${mb(before)}  ${meta.width}x${meta.height}`); continue; }

    const ext = path.extname(file).toLowerCase();
    if (ext === '.bmp') { console.log(`SKIP (BMP, convert to JPG by hand)  ${rel}`); continue; }

    // 1. keep the original (only the first time, so the true original is never overwritten)
    const copy = path.join(BACKUP, rel);
    await fs.mkdir(path.dirname(copy), { recursive: true });
    try { await fs.access(copy); } catch { await fs.writeFile(copy, input); }

    // 2. resize (never enlarge, never crop) and compress, keeping the same format and file name
    let img = sharp(input, { limitInputPixels: false }).rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true });
    if (ext === '.png') img = img.png({ compressionLevel: 9, palette: false });
    else if (ext === '.webp') img = img.webp({ quality: JPEG_QUALITY });
    else if (ext === '.avif') img = img.avif({ quality: 60 });
    else if (ext === '.tif' || ext === '.tiff') img = img.tiff({ compression: 'lzw' });
    else img = img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });

    const out = await img.toBuffer();
    if (out.length >= before && !tooBig) { console.log(`kept (already tight)  ${rel}`); continue; }

    // 3. save: write next to it, then swap in (a failed save can never leave a half-written picture)
    const tmp = file + '.tmp-optimize';
    await fs.writeFile(tmp, out);
    await fs.rm(file, { force: true });
    await fs.rename(tmp, file);

    const info = await sharp(out).metadata();
    saved += before - out.length; changed++;
    console.log(`shrunk  ${rel}  ${mb(before)} -> ${mb(out.length)}  (${meta.width}x${meta.height} -> ${info.width}x${info.height})`);
  } catch (err) {
    failed++;
    console.log(`FAILED  ${rel}  ${err.code ?? ''} ${err.message}`);
  }
}
console.log(DRY ? '\nDry run only: nothing was changed.' : `\nDone. ${changed} picture(s) shrunk, ${mb(saved)} saved.${failed ? ` ${failed} FAILED (see above).` : ''} Originals are in images-originals/`);
