// All interactivity for the site (plain TypeScript, no framework).
import { createMascot, type Mascot } from './mascot';
import { createSoundtrack } from './audio';
import { createHearts } from './hearts';
import { initLogoTone } from './logoTone';
import { initLogoRatio } from './logoRatio';
import { createBrandingChooser } from './brandingChooser';
import { initFullRatio } from './fullRatio';
import { createPrintViewer } from './printViewer';
const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/* ───────── Album pages ───────── */
const brandingChooser = createBrandingChooser($('[data-page="branding"]'));
const pages = $$('[data-page]');
const ids = pages.map((p) => p.dataset.page!);
const labels: Record<string, string> = {
  home: 'Home', about: 'About', projects: 'Projects', logofolio: 'Logofolio',
  branding: 'Branding', 'print-design': 'Print Design', contact: 'Contact',
};
let current = -1;
let mascot: Mascot | null = null;

// The bottom toggle only steps through these four stops, in this order.
// The three project chapters sit under "Projects" and are opened from there.
const chapterIds = ['logofolio', 'branding', 'print-design'];
const pagerOrder = ['home', 'about', 'projects', 'contact'].filter((id) => ids.includes(id));
const pagerPos = (id: string) => pagerOrder.indexOf(chapterIds.includes(id) ? 'projects' : id);
function step(d: number) {
  const id = ids[current];
  // From a project chapter, "previous" goes back to the Projects page
  if (d < 0 && chapterIds.includes(id)) return go('projects');
  const pos = Math.min(pagerOrder.length - 1, Math.max(0, pagerPos(id) + d));
  go(pagerOrder[pos]);
}

const dots = $('#page-dots')!;
dots.innerHTML = pagerOrder.map(() => '<span class="block size-1.5 rounded-full bg-hairline-strong transition-all"></span>').join('');

/* Numbers on the About page count up when the page opens */
function countUp(root: HTMLElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? '';
    if (reduce) { el.textContent = target + suffix; return; }
    const startTime = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / duration);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function go(id: string, push = true) {
  const next = ids.indexOf(id);
  if (next < 0 || next === current) return;
  const dir = next > current ? 'next' : 'prev';
  pages.forEach((p, i) => {
    p.classList.remove('page-enter-next', 'page-enter-prev');
    p.classList.toggle('is-filtered-out', i !== next);
  });
  const page = pages[next];
  void page.offsetWidth;
  if (current !== -1) page.classList.add(`page-enter-${dir}`);
  current = next;
  mascot?.setPage(id);
  if (id === 'branding') brandingChooser.show(); // ask which project to view first
  if (id === 'about') countUp(page);
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

  $('#page-label')!.textContent = labels[id] ?? id;
  const pos = pagerPos(id);
  Array.from(dots.children).forEach((d, i) => {
    d.classList.toggle('!bg-brand-blue', i === pos);
    d.classList.toggle('!w-4', i === pos);
  });
  $<HTMLButtonElement>('#prev-page')!.disabled = pos <= 0 && !chapterIds.includes(id);
  $<HTMLButtonElement>('#next-page')!.disabled = pos === pagerOrder.length - 1;
  // The three project chapters all highlight "Projects" in the top menu
  const navId = ['logofolio', 'branding', 'print-design'].includes(id) ? 'projects' : id;
  $$('[data-nav]').forEach((b) => {
    const on = b.dataset.nav === navId;
    b.classList.toggle('is-active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('#mobile-menu')!.classList.add('is-filtered-out');
  $('#menu-btn')!.setAttribute('aria-expanded', 'false');
  if (push) history.replaceState(null, '', `#${id}`);
}

document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-go]');
  if (t) { closeDrawer(); go(t.dataset.go!); }
});
$('#prev-page')!.addEventListener('click', () => step(-1));
$('#next-page')!.addEventListener('click', () => step(1));

const lightbox = $<HTMLDialogElement>('#lightbox')!;
document.addEventListener('keydown', (e) => {
  const tag = (e.target as HTMLElement).tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
  if (lightbox.open) {
    if (e.key === 'ArrowRight') stepLightbox(1);
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    return;
  }
  if (e.key === 'Escape') closeDrawer();
  if (drawer.classList.contains('is-open')) return;
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});

// Swipe on touch screens to turn the page
let sx = 0, sy = 0;
document.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if ((e.target as HTMLElement).closest('[data-carousel], [data-drag], [data-profile], dialog, #drawer, input[type=range]')) return;
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 2) {
    step(dx < 0 ? 1 : -1);
  }
}, { passive: true });

window.addEventListener('hashchange', () => go(location.hash.slice(1), false));

/* ───────── Menu + dark mode ───────── */
$('#menu-btn')!.addEventListener('click', () => {
  const menu = $('#mobile-menu')!;
  const hidden = menu.classList.toggle('is-filtered-out');
  $('#menu-btn')!.setAttribute('aria-expanded', String(!hidden));
});
const themeBtn = $('#theme-toggle')!;
const syncTheme = () => themeBtn.setAttribute('aria-checked', String(document.documentElement.classList.contains('dark')));
syncTheme();
themeBtn.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  syncTheme();
});

/* ───────── Toast ───────── */
let toastTimer: number;
function toast(msg: string) {
  const el = $('#toast')!;
  el.textContent = msg;
  el.classList.remove('is-filtered-out');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.add('is-filtered-out'), 2600);
}

/* ───────── Logofolio: contrasting card behind every logo ───────── */
initLogoTone();
initLogoRatio();   // logos: always 1:1
initFullRatio();   // everything else (branding, print cards): full ratio, never cropped

/* ───────── Logofolio grid-size slider ───────── */
// Slider right = bigger logos = FEWER columns, so the value is flipped (min + max - value).
const size = $<HTMLInputElement>('#logo-size');
const logoGrid = $('#logo-grid');
if (size && logoGrid) {
  const lo = Number(size.min) || 0, hi = Number(size.max) || 100;
  const columns = () => Math.min(hi, Math.max(lo, lo + hi - Number(size.value)));
  const apply = () => { logoGrid.style.gridTemplateColumns = `repeat(${columns()}, minmax(0, 1fr))`; };
  // Start with the thumb matching the columns the grid already shows (read from its CSS), so nothing jumps on load.
  const tracks = (logoGrid.style.gridTemplateColumns || getComputedStyle(logoGrid).gridTemplateColumns || '').trim();
  const rep = /repeat\(\s*(\d+)/.exec(tracks);
  const shown = rep ? Number(rep[1]) : /^[\d.]+px(\s|$)/.test(tracks) ? tracks.split(/\s+/).length : NaN;
  if (shown >= lo && shown <= hi) size.value = String(lo + hi - shown);
  else apply();
  size.addEventListener('input', apply);
}

/* ───────── Tabs (Branding) ───────── */
document.addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
  if (!tab) return;
  const group = tab.dataset.tabGroup!;
  $$(`[data-tab-group="${group}"]`).forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
  $$(`[data-tab-panel="${group}"]`).forEach((p) => {
    const show = p.dataset.panel === tab.dataset.tab;
    p.classList.toggle('is-filtered-out', !show);
    if (show) { p.classList.remove('filter-in'); void p.offsetWidth; p.classList.add('filter-in'); }
  });
});

/* ───────── Print filter ───────── */
const cards = $$('[data-project]');
const count = $('#print-count')!;
function updateCount() {
  const n = cards.filter((c) => !c.classList.contains('is-filtered-out')).length;
  count.textContent = `Showing ${n} of ${cards.length} projects`;
}
updateCount();
document.addEventListener('click', (e) => {
  const f = (e.target as HTMLElement).closest<HTMLElement>('[data-filter]');
  if (!f) return;
  $$('[data-filter]').forEach((b) => {
    const on = b === f;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  cards.forEach((c) => {
    const show = f.dataset.filter === 'all' || c.dataset.cat === f.dataset.filter;
    c.classList.toggle('is-filtered-out', !show);
    if (show) { c.classList.remove('filter-in'); void c.offsetWidth; c.classList.add('filter-in'); }
  });
  updateCount();
});

/* ───────── Drawer ───────── */
const drawer = $('#drawer')!;
const scrim = $('#scrim')!;
const drawerBody = $('#drawer-body')!;
function openDrawer(id: string) {
  const tpl = $<HTMLTemplateElement>(`#tpl-${id}`);
  if (!tpl) return;
  drawerBody.innerHTML = '';
  drawerBody.append(tpl.content.cloneNode(true));
  drawerBody.scrollTop = 0;
  drawer.classList.add('is-open'); scrim.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  drawer.focus();
}
function closeDrawer() {
  drawer.classList.remove('is-open'); scrim.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
// Print projects open in a centered, scrollable pop-up that shows every picture uncropped
// (the old side drawer above is no longer opened by the project cards).
const printViewer = createPrintViewer();
document.addEventListener('click', (e) => {
  const c = (e.target as HTMLElement).closest<HTMLElement>('[data-project]');
  if (c) printViewer.open(c.dataset.project!);
});
scrim.addEventListener('click', closeDrawer);
$('#drawer-close')!.addEventListener('click', closeDrawer);

/* Carousel inside the drawer */
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-carousel-prev], [data-carousel-next]');
  if (!btn) return;
  const track = btn.closest('.relative')!.querySelector<HTMLElement>('[data-carousel]')!;
  track.scrollBy({ left: (btn.hasAttribute('data-carousel-next') ? 1 : -1) * track.clientWidth, behavior: 'smooth' });
});
drawerBody.addEventListener('scroll', (e) => {
  const track = e.target as HTMLElement;
  if (!track.matches?.('[data-carousel]')) return;
  const label = track.parentElement!.querySelector('[data-carousel-count]');
  if (label) label.textContent = `${Math.round(track.scrollLeft / track.clientWidth) + 1} / ${track.children.length}`;
}, true);

/* ───────── Lightbox ───────── */
let group: HTMLElement[] = [];
let idx = 0;
function showLightbox() {
  const el = group[idx];
  ($('#lightbox-img') as HTMLImageElement).src = el.dataset.src!;
  ($('#lightbox-img') as HTMLImageElement).alt = el.dataset.caption ?? '';
  $('#lightbox-caption')!.textContent = el.dataset.caption ?? '';
  $('#lightbox-count')!.textContent = group.length > 1 ? `${idx + 1} / ${group.length}` : '';
  $('#lightbox-prev')!.classList.toggle('is-filtered-out', group.length < 2);
  $('#lightbox-next')!.classList.toggle('is-filtered-out', group.length < 2);
}
function stepLightbox(d: number) {
  idx = (idx + d + group.length) % group.length;
  showLightbox();
}
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-lightbox]');
  if (!t) return;
  group = $$(`[data-lightbox="${t.dataset.lightbox}"]`);
  idx = Math.max(0, group.indexOf(t));
  showLightbox();
  lightbox.showModal();
});
$('#lightbox-prev')!.addEventListener('click', () => stepLightbox(-1));
$('#lightbox-next')!.addEventListener('click', () => stepLightbox(1));
$('#lightbox-close')!.addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });

/* ───────── Contact form ───────── */
const form = $<HTMLFormElement>('#contact-form')!;
function syncInquiry() {
  const v = (form.elements.namedItem('inquiry') as RadioNodeList).value;
  $$('[data-show-for]', form).forEach((el) => el.classList.toggle('is-filtered-out', el.dataset.showFor !== v));
}
form.addEventListener('change', syncInquiry);
syncInquiry();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim();
  const email = String(fd.get('email') || '').trim();
  const message = String(fd.get('message') || '').trim();
  const err = $('#form-error')!;
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) {
    err.textContent = 'Please add your name, a valid email and a message.';
    err.classList.remove('is-filtered-out');
    return;
  }
  err.classList.add('is-filtered-out');
  const to = form.dataset.email!;
  const kind = fd.get('inquiry');
  const company = String(fd.get('company') || '').trim();
  const need = kind === 'project' ? `\nLooking for: ${fd.get('need')}` : kind === 'job' && company ? `\nCompany/team: ${company}` : '';
  const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
  const body = encodeURIComponent(`${message}${need}\n\n— ${name} (${email})`);
  const cc = fd.get('copy') ? `&cc=${encodeURIComponent(email)}` : '';
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}${cc}`;
  toast('Opening your email app…');
});

/* ───────── Creative layer (cursor, stickers, tilt, scroll-in) ───────── */
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Rotating word on the home page
$$('[data-rotate]').forEach((el) => {
  const words = (el.dataset.words ?? '').split('|').filter(Boolean);
  if (words.length < 2 || calm) return;
  let n = 0;
  setInterval(() => {
    n = (n + 1) % words.length;
    el.classList.remove('rot-in');
    void el.offsetWidth;
    el.textContent = words[n];
    el.classList.add('rot-in');
  }, 2200);
});

// Scroll progress bar
const bar = document.createElement('div');
bar.className = 'fx-progress';
document.body.append(bar);
const updateBar = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
};
addEventListener('scroll', updateBar, { passive: true });
addEventListener('resize', updateBar);

// Things that fade/slide in when they scroll into view
const viewer: IntersectionObserver | null = 'IntersectionObserver' in window && !calm
  ? new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in-view'); viewer!.unobserve(en.target); }
    }), { threshold: 0.15 })
  : null;
$$('[data-inview]').forEach((el) => (viewer ? viewer.observe(el) : el.classList.add('in-view')));

if (fine && !calm) {
  // Magnetic buttons: they lean toward the pointer
  $$('.btn, [data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - (r.left + r.width / 2)) * 0.25}px ${(e.clientY - (r.top + r.height / 2)) * 0.3}px`;
    });
    el.addEventListener('pointerleave', () => {
      const from = el.style.translate || '0px 0px';
      el.style.translate = '';
      el.animate([{ translate: from }, { translate: '0px 0px' }], { duration: 350, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    });
  });

  // Cards tilt in 3D toward the pointer
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-py * 10}deg) rotateY(${px * 12}deg) scale(1.02)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // Background blobs drift the opposite way to the mouse
  const heroRoot = $('[data-parallax-root]');
  heroRoot?.addEventListener('pointermove', (e) => {
    const r = heroRoot.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    $$('[data-depth]', heroRoot).forEach((b) => {
      const d = Number(b.dataset.depth);
      b.style.translate = `${-px * d}px ${-py * d}px`;
    });
  });
}

// The curly-haired mascot (also makes the View projects button beat)
mascot = createMascot();

// Calm, warm background music (starts on the first tap or click; the nav speaker button toggles it)
const soundBtn = $('#sound-btn');
if (soundBtn) createSoundtrack(soundBtn);

// Little hearts floating up from the View projects button
createHearts();

// Draggable stickers (double-click one to send it home)
$$('[data-drag]').forEach((el) => {
  let ox = 0, oy = 0, sx = 0, sy = 0, down = false;
  el.addEventListener('pointerdown', (e) => {
    down = true; sx = e.clientX - ox; sy = e.clientY - oy;
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
  });
  el.addEventListener('pointermove', (e) => {
    if (!down) return;
    ox = e.clientX - sx; oy = e.clientY - sy;
    el.style.translate = `${ox}px ${oy}px`;
  });
  const drop = () => {
    if (!down) return;
    down = false;
    el.classList.remove('is-dragging');
    if (!calm) el.animate([{ scale: '1.12' }, { scale: '0.94' }, { scale: '1' }], { duration: 320, easing: 'ease-out' });
  };
  el.addEventListener('pointerup', drop);
  el.addEventListener('pointercancel', drop);
  el.addEventListener('dblclick', () => {
    const from = `${ox}px ${oy}px`;
    ox = 0; oy = 0;
    el.style.translate = '';
    if (!calm) el.animate([{ translate: from }, { translate: '0px 0px' }], { duration: 450, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  });
});

/* ───────── Start ───────── */
const start = location.hash.slice(1);
go(ids.includes(start) ? start : 'home', false);
