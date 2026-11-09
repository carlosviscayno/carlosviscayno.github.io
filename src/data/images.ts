// ─────────────────────────────────────────────────────────────
//  HOW TO CHANGE PICTURES (no code needed)
//
//  1. Open the folder in src/images (e.g. src/images/logofolio).
//  2. Drop your pictures in. Delete or replace the old ones.
//  3. That's it. The site picks them up by itself.
//
//  • Any picture format works: jpg, jpeg, png, webp, avif, gif, svg, bmp, ico, tif, jfif.
//    Upper or lower case ("PHOTO.JPG" is fine), and you can mix formats in one folder.
//  • The order on the site is the file name order, with numbers sorted properly:
//    1, 2, 10  (not 1, 10, 2).  To reorder, rename:  01-logo.png, 02-poster.jpg, 03-menu.webp ...
//  • To hide a picture without deleting it, start its name with _ or ~   (e.g. _old-logo.png).
//  • Files that are not pictures (notes, .DS_Store, Thumbs.db) are ignored.
//  • An empty folder never crashes the site: it shows a "put pictures here" card instead.
//
//  Profile picture = the first picture in src/images/profile.
//
//  If the page shows an "ENOENT: no such file" error right after you delete or rename a file, the dev server is just
//  remembering the old name. Refresh the page; if it stays, stop the server (Ctrl+C), delete the .astro folder, and run
//  npm run dev again.
// ─────────────────────────────────────────────────────────────

// Vite lists every picture inside src/images at build time (the literal list below is required by Vite's glob syntax).
const found = import.meta.glob(
  '../images/**/*.{jpg,jpeg,png,webp,avif,gif,svg,bmp,ico,tif,tiff,jfif,JPG,JPEG,PNG,WEBP,AVIF,GIF,SVG,BMP,ICO,TIF,TIFF,JFIF}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const IMAGE = /\.(jpe?g|png|webp|avif|gif|svg|bmp|ico|tiff?|jfif)$/i;
const ROOT = '../images/';

const natural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

// A friendly stand-in so an empty (or mistyped) folder still shows something instead of a broken picture.
function placeholder(folder: string): string {
  const label = `Add pictures to src/images/${folder}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">` +
    `<rect width="1200" height="900" fill="#f1eee8"/><rect x="40" y="40" width="1120" height="820" rx="28" fill="none" stroke="#b9b2a4" stroke-width="4" stroke-dasharray="18 14"/>` +
    `<text x="600" y="430" text-anchor="middle" font-family="system-ui,sans-serif" font-size="46" font-weight="600" fill="#4a463f">Your picture goes here</text>` +
    `<text x="600" y="500" text-anchor="middle" font-family="system-ui,sans-serif" font-size="30" fill="#6d675c">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Exported separately so it can be tested without Vite.
export function pickImages(modules: Record<string, string>, folder: string): string[] {
  const dir = `${ROOT}${folder.replace(/^\/+|\/+$/g, '')}/`.toLowerCase();
  const list = Object.entries(modules)
    .filter(([path]) => {
      if (!path.toLowerCase().startsWith(dir)) return false;
      const name = path.slice(dir.length);
      if (name.includes('/')) return false;                       // only this folder, not its sub-folders
      return IMAGE.test(name) && !/^[._~]/.test(name);            // real pictures only; _hidden / ~hidden / .dotfiles skipped
    })
    .sort(([a], [b]) => natural(a, b));
  return list.map(([, url]) => url);
}

/** All pictures of a folder inside src/images, in file-name order, as URLs ready for <img src>. */
export function imagesIn(folder: string): string[] {
  const list = pickImages(found, folder);
  if (list.length) return list;
  if (import.meta.env?.DEV) {
    const leaf = folder.replace(/^\/+|\/+$/g, '').split('/').pop()!.toLowerCase();
    const near = Object.keys(found).filter((p) => p.toLowerCase().includes(`/${leaf}/`) || p.toLowerCase().includes(leaf)).slice(0, 5);
    console.warn(
      `[images] No pictures found in src/images/${folder}. Check the folder name and that it has pictures in it.` +
        (near.length ? `\n  Pictures with a similar path that were found: ${near.join(', ')}` : `\n  The site found ${Object.keys(found).length} pictures in total, none in this folder. Is this the same src folder the dev server is running from?`),
    );
  }
  return [placeholder(folder)];
}
