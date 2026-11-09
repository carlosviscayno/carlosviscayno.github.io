// Print Design: the project pop-up.
//
// Opens in the CENTER of the screen (not as a side drawer) and shows every picture of the project stacked
// vertically at full width and in its own shape, so nothing is cropped. The pop-up scrolls when the
// project is taller than the screen. Tap a picture to zoom it in the lightbox.
//
// It reads the text and the pictures from the same <template id="tpl-<project>"> the old side drawer used,
// so nothing in the page markup or in src/data/site.ts has to change.

export type PrintViewer = { open: (id: string) => void; close: () => void };

const STYLE_ID = 'print-viewer-style';
const CSS = `
dialog.pv{position:fixed;inset:0;margin:auto;padding:0;border:1px solid color-mix(in srgb,currentColor 12%,transparent);
  border-radius:1.75rem;color:inherit;background:var(--color-canvas,Canvas);
  width:min(52rem,calc(100vw - 1.5rem));max-height:calc(100dvh - 1.5rem);overflow:hidden;
  box-shadow:0 40px 90px -30px rgba(0,0,0,.55);overscroll-behavior:contain}
dialog.pv[open]{display:flex;flex-direction:column;animation:pv-in .26s cubic-bezier(.2,.9,.3,1.1)}
dialog.pv::backdrop{background:rgba(15,15,25,.55);backdrop-filter:blur(3px);animation:pv-fade .2s ease-out}
.pv-bar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.9rem 1.25rem .9rem 1.75rem;
  border-bottom:1px solid color-mix(in srgb,currentColor 10%,transparent)}
.pv-kicker{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;opacity:.6}
.pv-x{display:grid;place-items:center;width:2.25rem;height:2.25rem;border-radius:999px;cursor:pointer;color:inherit;background:transparent;
  border:1px solid color-mix(in srgb,currentColor 18%,transparent);transition:background .15s}
.pv-x:hover,.pv-x:focus-visible{background:color-mix(in srgb,currentColor 10%,transparent)}
.pv-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:1.5rem 1.75rem 2rem;-webkit-overflow-scrolling:touch}
.pv-stack{display:flex;flex-direction:column;gap:1.25rem;margin-top:1.5rem}
.pv-stack img{display:block;width:100%;height:auto;border-radius:1rem;cursor:zoom-in;
  background:color-mix(in srgb,currentColor 6%,transparent)}
.pv-count{margin:1.5rem 0 0;font-size:.8rem;opacity:.6}
@keyframes pv-in{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
@keyframes pv-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){dialog.pv[open],dialog.pv::backdrop{animation:none}}
`;

export function createPrintViewer(): PrintViewer {
  let dialog: HTMLDialogElement | null = null;
  let scroller: HTMLElement | null = null;
  let kicker: HTMLElement | null = null;

  function build() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.append(style);
    }
    const d = document.createElement('dialog');
    d.className = 'pv bg-canvas';
    d.id = 'print-viewer';

    const bar = document.createElement('div');
    bar.className = 'pv-bar';
    kicker = document.createElement('span');
    kicker.className = 'pv-kicker';
    kicker.textContent = 'Project';
    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'pv-x';
    x.setAttribute('aria-label', 'Close');
    x.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    x.addEventListener('click', () => d.close());
    bar.append(kicker, x);

    scroller = document.createElement('div');
    scroller.className = 'pv-scroll';
    d.append(bar, scroller);

    // click on the dimmed area outside the card closes it
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    // restore page scrolling however it was closed (X, Esc, backdrop)
    d.addEventListener('close', () => { document.body.style.overflow = ''; });
    // the arrow keys must not turn the album page behind the pop-up
    d.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation();
    });

    document.body.append(d);
    dialog = d;
  }

  function open(id: string) {
    const tpl = document.querySelector<HTMLTemplateElement>(`#tpl-${id}`);
    if (!tpl) return;
    if (!dialog) build();
    const d = dialog!, body = scroller!;

    // Work on a copy of the template: keep its text, lift its pictures out.
    const holder = document.createElement('div');
    holder.append(tpl.content.cloneNode(true));

    const track = holder.querySelector<HTMLElement>('[data-carousel]');
    const pics = Array.from((track ?? holder).querySelectorAll('img'));
    const sources = pics.map((p) => ({ src: p.getAttribute('src') ?? '', alt: p.getAttribute('alt') ?? '' })).filter((p) => p.src);

    if (track) {
      const wrap = track.closest<HTMLElement>('.relative');
      if (wrap && !wrap.querySelector('h1,h2,h3,p')) wrap.remove();
      else {
        track.remove();
        holder.querySelectorAll('[data-carousel-prev],[data-carousel-next],[data-carousel-count]').forEach((el) => el.remove());
      }
    } else {
      pics.forEach((p) => p.remove());
    }

    const title = holder.querySelector('h1,h2,h3')?.textContent?.trim() ?? 'Project';
    d.setAttribute('aria-label', title);

    const stack = document.createElement('div');
    stack.className = 'pv-stack';
    const group = `pv-${id}`;
    sources.forEach((s, i) => {
      const img = document.createElement('img');
      img.src = s.src;
      img.alt = s.alt || `${title}, picture ${i + 1}`;
      img.decoding = 'async';
      // tap to zoom: the site's own lightbox picks these attributes up
      img.dataset.lightbox = group;
      img.dataset.src = s.src;
      img.dataset.caption = title;
      stack.append(img);
    });

    body.replaceChildren(holder, stack);
    if (sources.length > 1) {
      const n = document.createElement('p');
      n.className = 'pv-count';
      n.textContent = `${sources.length} pictures · tap one to zoom`;
      body.append(n);
    }
    if (kicker) kicker.textContent = sources.length > 1 ? `Project · ${sources.length} pictures` : 'Project';

    body.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    if (!d.open) d.showModal();
  }

  return { open, close: () => dialog?.close() };
}
