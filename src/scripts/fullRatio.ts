// Full-ratio pictures: nothing is cropped by its box.
//
//  • Branding (Cash 3.0, Elite Café): every picture shows at its own shape, full width of its slot.
//  • Print Design cards: the thumbnail box takes the shape of the project's first picture.
//
// The ONLY exception is the Logofolio, which stays 1:1 (see logoRatio.ts).
//
// Both layouts are packed as a tidy masonry (plain CSS grid, 1px rows) so pictures of different heights
// leave no big empty gaps.

// Print thumbnails only: keep extreme pictures from making a huge or a tiny card.
// The picture is never cut: if it is beyond this range it gets a little empty space instead.
const MIN_RATIO = 0.5;  // tallest thumbnail = twice as tall as wide
const MAX_RATIO = 2;    // widest thumbnail  = twice as wide as tall

const force = (el: HTMLElement, prop: string, value: string) => el.style.setProperty(prop, value, 'important');

/** From a picture, climb to the box that is "its slot" in the layout (the box that holds only this picture). */
function slotOf(img: HTMLImageElement, stopAt: HTMLElement): HTMLElement[] {
  const chain: HTMLElement[] = [img];
  let el: HTMLElement = img;
  for (let depth = 0; depth < 4; depth++) {
    const up = el.parentElement;
    if (!up || up === stopAt) break;
    if (up.querySelectorAll('img').length !== 1) break;       // this is the gallery itself
    if (up.querySelector('h1,h2,h3,h4')) break;               // this is a text card, not a picture slot
    if (getComputedStyle(up).display === 'grid') break;       // the grid: its children are the slots
    chain.push(up);
    el = up;
  }
  return chain; // chain[0] = img … chain[last] = the slot
}

/** Masonry with plain CSS grid: 1px rows, every slot spans as many rows as it is tall. */
function masonry(grid: HTMLElement, slots: HTMLElement[]) {
  if (grid.dataset.masonry) return;
  grid.dataset.masonry = '1';
  const gapPx = parseFloat(getComputedStyle(grid).rowGap);
  const gap = Number.isFinite(gapPx) ? gapPx : 16;
  force(grid, 'grid-auto-rows', '1px');
  force(grid, 'row-gap', '0px');
  force(grid, 'align-items', 'start');
  slots.forEach((slot) => {
    force(slot, 'align-self', 'start');
    force(slot, 'margin-bottom', `${gap}px`);
    new ResizeObserver(() => {
      const h = slot.offsetHeight;
      if (h > 0) slot.style.gridRowEnd = `span ${Math.ceil(h + gap)}`;
    }).observe(slot);
  });
}

/** Branding pages: every picture at its own full shape. */
function branding() {
  const page = document.querySelector<HTMLElement>('[data-page="branding"]');
  if (!page) return;
  const panels = Array.from(page.querySelectorAll<HTMLElement>('[data-tab-panel]'));
  const galleries = new Map<HTMLElement, HTMLElement[]>();

  panels.forEach((panel) => {
    panel.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const chain = slotOf(img, panel);
      const slot = chain[chain.length - 1];

      // let the whole slot grow to the picture instead of holding a fixed box
      chain.forEach((el) => {
        force(el, 'aspect-ratio', 'auto');
        force(el, 'height', 'auto');
        force(el, 'min-height', '0');
        force(el, 'max-height', 'none');
      });
      force(img, 'position', 'static');
      force(img, 'inset', 'auto');
      force(img, 'display', 'block');
      force(img, 'width', '100%');
      force(img, 'object-fit', 'contain');
      img.loading = 'eager';

      const parent = slot.parentElement;
      if (parent && parent !== panel) {
        const list = galleries.get(parent) ?? [];
        list.push(slot);
        galleries.set(parent, list);
      }
    });
  });

  galleries.forEach((slots, grid) => {
    if (slots.length < 2) return;
    const display = getComputedStyle(grid).display;
    if (display === 'grid') masonry(grid, slots);
    else force(grid, 'align-items', 'flex-start');
  });
}

/** Print Design cards: the thumbnail takes the shape of its picture. */
function printCards() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-project]'));
  const grids = new Map<HTMLElement, HTMLElement[]>();

  cards.forEach((card) => {
    const img = card.querySelector<HTMLImageElement>('img');
    if (img) {
      const chain = slotOf(img, card);
      const slot = chain[chain.length - 1];
      const box = slot === img ? img : slot;

      force(box, 'height', 'auto');
      force(box, 'min-height', '0');
      force(box, 'max-height', 'none');
      force(box, 'aspect-ratio', '4 / 3');                  // until the picture has loaded and its shape is known
      if (box !== img) {
        force(img, 'width', '100%');
        force(img, 'height', '100%');
      } else {
        force(img, 'width', '100%');
      }
      force(img, 'object-fit', 'contain');
      img.loading = 'eager';

      const fit = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const r = w > 0 && h > 0 ? w / h : 4 / 3;
        force(box, 'aspect-ratio', String(Math.min(MAX_RATIO, Math.max(MIN_RATIO, r))));
      };
      if (img.complete && img.naturalWidth > 0) fit();
      else img.addEventListener('load', fit, { once: true });
    }
    const parent = card.parentElement;
    if (parent) grids.set(parent, [...(grids.get(parent) ?? []), card]);
  });

  grids.forEach((slots, grid) => {
    if (slots.length > 1 && getComputedStyle(grid).display === 'grid') masonry(grid, slots);
  });
}

export function initFullRatio() {
  branding();
  printCards();
}
