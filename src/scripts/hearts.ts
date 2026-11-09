// Little hearts that float up from the "View projects" button:
//   mouse   -> a steady trickle while the cursor is on the button (or the button has keyboard focus)
//   touch   -> a burst when the button is pressed, since there is no hover on a phone
//   click   -> a bigger burst as the mascot celebrates
// The button is whatever carries the data-heart attribute. Nothing is added for visitors who prefer reduced motion.

const COLORS = ['#ff6b8b', '#ff8fb1', '#ffb3c6', '#ff4d79', '#ff9fb8'];
const MAX_ALIVE = 36;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

const CSS = `
.fx-heart{position:fixed;left:0;top:0;z-index:40;width:var(--s);height:var(--s);margin:calc(var(--s) / -2) 0 0 calc(var(--s) / -2);pointer-events:none;opacity:0;
  color:var(--c);filter:drop-shadow(0 2px 3px rgba(255,107,139,.35));animation:fx-heart-rise var(--t) cubic-bezier(.25,.6,.4,1) forwards}
.fx-heart svg{display:block;width:100%;height:100%;fill:currentColor;animation:fx-heart-beat .5s ease-in-out infinite alternate}
@keyframes fx-heart-rise{
  0%{opacity:0;transform:translate(var(--x),var(--y)) scale(.3) rotate(0)}
  15%{opacity:1}
  70%{opacity:.9}
  100%{opacity:0;transform:translate(calc(var(--x) + var(--dx)),calc(var(--y) - var(--rise))) scale(1) rotate(var(--rot))}}
@keyframes fx-heart-beat{to{transform:scale(1.18)}}
`;

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.500C5 16.600 2 13 2 9.300 2 6.400 4.200 4.500 6.700 4.500c1.900 0 3.500 1 5.300 3 1.800-2 3.400-3 5.300-3C19.800 4.500 22 6.400 22 9.300c0 3.700-3 7.300-10 12.200Z"/></svg>';

export function createHearts() {
  const btn = document.querySelector<HTMLElement>('[data-heart]');
  if (!btn || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  let alive = 0, timer = 0;

  function spawn(big = false) {
    if (alive >= MAX_ALIVE || document.hidden) return;
    const r = btn!.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
    const el = document.createElement('span');
    el.className = 'fx-heart';
    el.innerHTML = HEART;
    const s = big ? rnd(14, 28) : rnd(10, 22);
    el.style.setProperty('--s', `${s.toFixed(0)}px`);
    el.style.setProperty('--c', pick(COLORS));
    el.style.setProperty('--x', `${(r.left + r.width * rnd(0.08, 0.92)).toFixed(0)}px`);
    el.style.setProperty('--y', `${(r.top + r.height * rnd(0.05, 0.4)).toFixed(0)}px`);
    el.style.setProperty('--dx', `${rnd(-36, 36).toFixed(0)}px`);
    el.style.setProperty('--rise', `${rnd(70, big ? 190 : 140).toFixed(0)}px`);
    el.style.setProperty('--rot', `${rnd(-28, 28).toFixed(0)}deg`);
    el.style.setProperty('--t', `${rnd(1.3, 2.2).toFixed(2)}s`);
    alive++;
    el.addEventListener('animationend', (e) => { if (e.target === el) { el.remove(); alive--; } });
    document.body.append(el);
  }
  const burst = (n: number) => { for (let i = 0; i < n; i++) window.setTimeout(() => spawn(true), i * 45); };

  const on = () => { if (!timer) { spawn(); timer = window.setInterval(spawn, 170); } };
  const off = () => { clearInterval(timer); timer = 0; };

  btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') on(); });
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) on(); });
  btn.addEventListener('blur', off);
  btn.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') burst(7); });
  btn.addEventListener('click', () => { off(); burst(12); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) off(); });
}
