// Branding page: when you open it, ask what to view first (Cash 3.0 or Elite Café & Lounge) instead of
// jumping straight into the first project. It is built from the page's own project tabs, so a project
// added to the data later shows up here automatically. Picking a card opens that project, and the tabs
// come back so you can still switch between projects.

export type BrandingChooser = { show: () => void };

const STYLE_ID = 'branding-chooser-style';
const CSS = `
.bc-wrap{margin-top:1.75rem}
.bc-title{margin:0 0 1rem;font-size:1.05rem;font-weight:500;opacity:.75}
.bc-grid{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
.bc-card{display:flex;flex-direction:column;overflow:hidden;padding:0;text-align:left;color:inherit;font:inherit;cursor:pointer;
  border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:1.5rem;background:transparent;
  transition:transform .2s ease,box-shadow .2s ease}
.bc-card:hover,.bc-card:focus-visible{transform:translateY(-4px);box-shadow:0 18px 30px -18px rgba(0,0,0,.35)}
.bc-card:focus-visible{outline:2px solid currentColor;outline-offset:3px}
.bc-img{aspect-ratio:4/3;background:color-mix(in srgb,currentColor 8%,transparent) center/contain no-repeat}
.bc-foot{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.25rem}
.bc-name{font-size:1.25rem;font-weight:500}
.bc-go{font-size:.85rem;opacity:.7;white-space:nowrap}
@media (prefers-reduced-motion:reduce){.bc-card{transition:none}.bc-card:hover,.bc-card:focus-visible{transform:none}}
`;

const TINT = /(?:^|\s)(bg-[\w-]+-(?:light|soft))(?:\s|$)/;

export function createBrandingChooser(page: HTMLElement | null): BrandingChooser {
  const none: BrandingChooser = { show() {} };
  if (!page) return none;
  const tabs = Array.from(page.querySelectorAll<HTMLElement>('[data-tab]'));
  if (tabs.length < 2) return none; // nothing to choose between
  const group = tabs[0].dataset.tabGroup ?? '';
  const panels = Array.from(page.querySelectorAll<HTMLElement>(`[data-tab-panel="${group}"]`));
  if (!panels.length) return none;

  // the bar that holds all the tabs = lowest ancestor containing every tab
  let bar: HTMLElement = tabs[0].parentElement ?? tabs[0];
  while (bar.parentElement && !tabs.every((t) => bar.contains(t))) bar = bar.parentElement;

  let box: HTMLElement | null = null;

  const panelOf = (tab: HTMLElement) => panels.find((p) => p.dataset.panel === tab.dataset.tab);

  function choose(tab: HTMLElement) {
    if (box) box.style.display = 'none';
    bar.style.display = '';
    tab.click(); // the page's own tab handler opens the project
    tab.focus({ preventScroll: true });
  }

  function build(): HTMLElement {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.append(style);
    }
    const wrap = document.createElement('section');
    wrap.id = 'branding-chooser';
    wrap.className = 'bc-wrap';
    wrap.setAttribute('aria-label', 'Choose a branding project');

    const title = document.createElement('h2');
    title.className = 'bc-title';
    title.textContent = 'What would you like to view?';

    const grid = document.createElement('div');
    grid.className = 'bc-grid';

    tabs.forEach((tab) => {
      const panel = panelOf(tab);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'bc-card';

      const img = document.createElement('div');
      img.className = 'bc-img';
      const src = panel?.querySelector('img')?.getAttribute('src');
      if (src) img.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`;

      const foot = document.createElement('div');
      foot.className = 'bc-foot';
      // reuse the project's own tint so the card matches its page
      const tint = panel
        ? Array.from(panel.querySelectorAll('[class]')).map((el) => TINT.exec(el.getAttribute('class') ?? '')?.[1]).find(Boolean)
        : undefined;
      if (tint) foot.classList.add(tint, 'text-pastel-ink');

      const name = document.createElement('span');
      name.className = 'bc-name';
      name.textContent = tab.textContent?.trim() ?? '';
      const go = document.createElement('span');
      go.className = 'bc-go';
      go.textContent = 'View project →';
      foot.append(name, go);

      card.append(img, foot);
      card.addEventListener('click', () => choose(tab));
      grid.append(card);
    });

    wrap.append(title, grid);
    return wrap;
  }

  return {
    show() {
      const el = box ?? (box = build());
      panels.forEach((p) => p.classList.add('is-filtered-out'));
      tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
      bar.style.display = 'none';
      if (!el.isConnected) panels[0].parentElement?.insertBefore(el, panels[0]);
      el.style.display = '';
      el.classList.remove('filter-in');
      void el.offsetWidth;
      el.classList.add('filter-in');
    },
  };
}
