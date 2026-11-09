// The curly-haired stick man who lives on the site: a cartoon embodiment of the portfolio's owner,
// so everything he says is in the owner's own voice, talking to the visitor.
//
// He is NOT a cursor follower. He travels through the album with you: on every page he
// sprints around frantically and bothers the boxes, text and little widgets on it.
// On Home he finally runs to the "View projects" button, and then it is up to the cursor:
//   cursor far from the button  -> he stops running, kneels, clasps his hands and sobs
//   cursor near the button      -> he scrambles around it in a frenzy
//   cursor on the button        -> he dances around like a lunatic
//   button clicked              -> eye-to-eye smile, sparkling eyes, camera zooms into his face
// While he is in joy (dancing at the button, or the celebration after the click) he broadcasts a "mascot:mood" window
// event so the background music can swap to its upbeat track (see audio.ts).
// Hover (or tap, on touch screens) his own profile photo and he rushes over to react to it: bashful, posing,
// flexing, waving, squinting at it, with candid and slightly self-roasting commentary.
// The further away he is (depth), the smaller and blurrier he gets (depth of field).

type Mode = 'tour' | 'roam' | 'home';
type Act = 'stand' | 'run' | 'beg' | 'hope' | 'dance' | 'poke' | 'perch' | 'knock' | 'hug' | 'stomp' | 'lean' | 'hop' | 'cheer' | 'dangle' | 'fight' | 'model' | 'wave';
type Kind = 'letter' | 'sticker' | 'button' | 'chip' | 'box' | 'image' | 'text' | 'field';
interface Job { el: HTMLElement; kind: Kind; act: Act; frac: number; side: 1 | -1; zt: number }
interface Look { eyes: string; mouth: string; brow: string; tears?: 1; sweat?: 1; blush?: 1; spark?: 1 }
export interface Mascot { setPage(id: string): void }

/* ───────────────────────── skeleton ───────────────────────── */
// Angles are in degrees. For limbs, 0 = hanging straight down and positive = swung FORWARD.
// For torso/head, 0 = upright and positive = leaning FORWARD. Child joints are relative to the parent.
const KEYS = ['hx', 'hy', 'lean', 'head', 'au0', 'af0', 'au1', 'af1', 't0', 's0', 'f0', 't1', 's1', 'f1'] as const;
type Pose = Record<(typeof KEYS)[number], number>;
const P = (o: Partial<Pose> = {}): Pose =>
  ({ hx: 0, hy: 0, lean: 0, head: 0, au0: 6, af0: 8, au1: -6, af1: 8, t0: -3, s0: -2, f0: 0, t1: 3, s1: -2, f1: 0, ...o });
const mixPose = (a: Pose, b: Pose, w: number): Pose => {
  const o = {} as Pose;
  for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * w;
  return o;
};

const UA = 22, FA = 20;          // upper arm / forearm length
const SHX = [-2, 2.5];            // shoulder x (far, near) in torso space
const SHY = -36;
const HPX = [-1.5, 1.5];          // hip x (far, near)
const D2R = Math.PI / 180;
const norm = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

// Two-bone IK. dx/dy = target relative to the shoulder (dx forward, dy down). Returns [upper, forearm-relative].
function ik(dx: number, dy: number, bend = 1): [number, number] {
  const d = Math.hypot(dx, dy) || 0.001;
  const dd = Math.min(UA + FA - 0.4, Math.max(Math.abs(UA - FA) + 0.4, d));
  const phi = Math.atan2(dx, dy);
  const a = Math.acos(Math.max(-1, Math.min(1, (UA * UA + dd * dd - FA * FA) / (2 * UA * dd))));
  const u = phi - bend * a;
  const ex = Math.sin(u) * UA, ey = Math.cos(u) * UA;
  const tx = (dx / d) * dd, ty = (dy / d) * dd;
  const f = Math.atan2(tx - ex, ty - ey);
  return [u / D2R, norm((f - u) / D2R)];
}
// Put arm i's hand at a point given in torso space.
const armTo = (i: 0 | 1, tx: number, ty: number, bend = 1) => ik(tx - SHX[i], ty - SHY, bend);

/* ───────────────────────── drawing ───────────────────────── */
const INK = 'var(--mc-ink)', PAPER = 'var(--mc-paper)';
const f1 = (n: number) => n.toFixed(1);

const curl = (cx: number, cy: number, r: number) =>
  `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="${PAPER}" stroke-width="2"/>` +
  `<path d="M${f1(cx - r * 0.1)} ${f1(cy + r * 0.45)} a${r * 0.5} ${r * 0.5} 0 1 1 ${f1(r * 0.7)} ${f1(-r * 0.2)} a${r * 0.28} ${r * 0.28} 0 1 1 ${f1(-r * 0.4)} ${f1(-r * 0.1)}" stroke-width="1.3"/>`;

let hairBack = '';
for (let a = 0; a <= 180; a += 20) hairBack += curl(Math.cos(a * D2R) * 16.2, -Math.sin(a * D2R) * 16.2 - 0.5, 6.7);
for (let a = 28; a <= 152; a += 31) hairBack = curl(Math.cos(a * D2R) * 21, -Math.sin(a * D2R) * 20.5, 5.2) + hairBack;
const hairFront = [[-9.5, -13.8, 4.3], [-3, -15.6, 4.5], [3.8, -15.2, 4.5], [10, -12.6, 4.3]].map(([x, y, r]) => curl(x, y, r)).join('');

const star = (x: number, y: number, s: number, cls = '') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path class="${cls}" d="M0 -6 L1.7 -1.7 L6 0 L1.7 1.7 L0 6 L-1.7 1.7 L-6 0 L-1.7 -1.7Z"/></g>`;

const arm = (i: number) => `
  <g class="g-au g-au${i}"><path d="M0 0V${UA}"/>
    <g class="g-af g-af${i}"><path d="M0 0V${FA}"/><circle cx="0" cy="${FA + 1}" r="2.7" fill="${PAPER}" stroke-width="2.2"/></g>
  </g>`;
const leg = (i: number) => `
  <g class="g-t g-t${i}"><path d="M0 0V27"/>
    <g class="g-s g-s${i}"><path d="M0 0V27"/>
      <g class="g-f g-f${i}"><path d="M0 0H10" stroke-width="3.6"/></g>
    </g>
  </g>`;

const SVG = `
<svg class="mc-svg" viewBox="-60 -96 120 160" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
  <ellipse class="mc-shadow" cx="0" cy="58.5" rx="24" ry="4" fill="rgba(0,0,0,.2)" stroke="none"/>
  <ellipse class="mc-puddle" cx="16" cy="58" rx="0" ry="2.6" fill="#8fdcff" stroke="none"/>
  <g class="g-body">
    ${leg(0)}${leg(1)}
    <g class="g-torso">
      <g class="g-arm0" transform="translate(${SHX[0]} ${SHY})">${arm(0)}</g>
      <path d="M-7.5 -39.5 Q0 -42.5 7.5 -39.5 L8.2 -3 Q0 1.5 -8.2 -3 Z" fill="${PAPER}"/>
      <path d="M-6.2 -40 L-0.4 -34.5 L-6.8 -33.5 Z M6.2 -40 L0.4 -34.5 L6.8 -33.5 Z" fill="${PAPER}" stroke-width="1.8"/>
      <path d="M0 -38.5 L2.6 -35.2 L1.8 -33.2 L4.6 -17 L0 -11 L-4.6 -17 L-1.8 -33.2 L-2.6 -35.2 Z" fill="${INK}" stroke-width="1.4"/>
      <g class="g-arm1" transform="translate(${SHX[1]} ${SHY})">${arm(1)}</g>
      <g class="g-head">
        <g transform="translate(0 -17)">
          <g class="mc-hair-back">${hairBack}</g>
          <circle r="17" fill="${PAPER}"/>
          <g class="mc-hair-front">${hairFront}</g>
          <g class="mc-sparks" fill="#ffd84d" stroke-width="1.3">
            ${star(-25, -6, 1.3, 'tw')}${star(25, -11, 1.1, 'tw tw2')}${star(-19, -29, 1, 'tw tw3')}${star(21, -29, 1.3, 'tw tw2')}${star(0, -37, 0.9, 'tw')}${star(-27, 10, 0.9, 'tw tw3')}${star(27, 8, 1, 'tw')}
          </g>
          <g class="mc-face">
            <ellipse class="mc-blush" cx="-11.5" cy="5.5" rx="3.6" ry="2.2" fill="#ff8fb1" stroke="none" opacity=".6"/>
            <ellipse class="mc-blush" cx="11.5" cy="5.5" rx="3.6" ry="2.2" fill="#ff8fb1" stroke="none" opacity=".6"/>
            <!-- eyes -->
            <g class="e e-dot" fill="${INK}" stroke="none"><circle cx="-6.5" cy="-1.5" r="2"/><circle cx="6.5" cy="-1.5" r="2"/></g>
            <g class="e e-wide" stroke-width="1.8">
              <circle cx="-6.5" cy="-1.5" r="5.4" fill="${PAPER}"/><circle cx="6.5" cy="-1.5" r="5.4" fill="${PAPER}"/>
              <g class="wj" fill="${INK}" stroke="none"><circle cx="-6.5" cy="-1.5" r="1.7"/><circle cx="6.5" cy="-1.5" r="1.7"/></g>
            </g>
            <g class="e e-plead" stroke-width="1.8">
              <circle cx="-6.5" cy="-1" r="6" fill="${PAPER}"/><circle cx="6.5" cy="-1" r="6" fill="${PAPER}"/>
              <g class="wj" stroke="none"><circle cx="-6.5" cy="-0.6" r="4.3" fill="${INK}"/><circle cx="6.5" cy="-0.6" r="4.3" fill="${INK}"/>
                <circle cx="-8" cy="-2.2" r="1.7" fill="#fff"/><circle cx="5" cy="-2.2" r="1.7" fill="#fff"/><circle cx="-5.2" cy="1.4" r="0.9" fill="#fff"/><circle cx="7.8" cy="1.4" r="0.9" fill="#fff"/></g>
              <path d="M-11.2 2 Q-6.5 5.8 -1.8 2 M1.8 2 Q6.5 5.8 11.2 2" stroke="#7fd3ff" stroke-width="1.6"/>
            </g>
            <g class="e e-sob"><path d="M-11 -5.5 L-4 -1.5 L-11 2.5"/><path d="M11 -5.5 L4 -1.5 L11 2.5"/></g>
            <g class="e e-happy"><path d="M-11 0.5 Q-6.5 -6.5 -2 0.5"/><path d="M2 0.5 Q6.5 -6.5 11 0.5"/></g>
            <g class="e e-crazy" stroke-width="1.8">
              <circle cx="-6.5" cy="-2" r="6.4" fill="${PAPER}"/><circle cx="6.5" cy="-0.5" r="3.4" fill="${PAPER}"/>
              <g class="wj" fill="${INK}" stroke="none"><circle cx="-5.5" cy="-1" r="1.3"/><circle cx="6.5" cy="-0.5" r="2.1"/></g>
            </g>
            <g class="e e-spiral" stroke-width="1.8">
              <circle cx="-6.5" cy="-1.5" r="5.6" fill="${PAPER}"/><circle cx="6.5" cy="-1.5" r="5.6" fill="${PAPER}"/>
              <g transform="translate(-6.5 -1.5)"><path class="sp" stroke-width="1.5" d="M0 0 m-.7 0 a.7 .7 0 1 1 1.4 0 a1.7 1.7 0 1 1 -3 0 a2.7 2.7 0 1 1 4.6 0 a3.6 3.6 0 1 1 -6.2 0"/></g>
              <g transform="translate(6.5 -1.5)"><path class="sp" stroke-width="1.5" d="M0 0 m-.7 0 a.7 .7 0 1 1 1.4 0 a1.7 1.7 0 1 1 -3 0 a2.7 2.7 0 1 1 4.6 0 a3.6 3.6 0 1 1 -6.2 0"/></g>
            </g>
            <g class="e e-lid" stroke-width="1.8">
              <circle cx="-6.5" cy="-1" r="4.9" fill="${PAPER}"/><circle cx="6.5" cy="-1" r="4.9" fill="${PAPER}"/>
              <g fill="${INK}"><path d="M-11.4 -1 A4.9 4.9 0 0 1 -1.6 -1 Z"/><path d="M1.6 -1 A4.9 4.9 0 0 1 11.4 -1 Z"/><circle cx="-4.6" cy="1.2" r="1.5" stroke="none"/><circle cx="8.4" cy="1.2" r="1.5" stroke="none"/></g>
            </g>
            <g class="e e-slit"><path d="M-11 -0.5 H-3.5"/><path d="M3.5 -0.5 H11"/></g>
            <g class="e e-heart" fill="#ff6b8b" stroke-width="1.5">
              <g class="hb"><path transform="translate(-6.5 -1.5)" d="M0 3.4 C-8 -2.5 -4 -8 0 -4.2 C4 -8 8 -2.5 0 3.4Z"/></g>
              <g class="hb"><path transform="translate(6.5 -1.5)" d="M0 3.4 C-8 -2.5 -4 -8 0 -4.2 C4 -8 8 -2.5 0 3.4Z"/></g>
            </g>
            <g class="e e-spark" stroke-width="1.8">
              <circle cx="-6.5" cy="-1.5" r="6.4" fill="${PAPER}"/><circle cx="6.5" cy="-1.5" r="6.4" fill="${PAPER}"/>
              <g stroke="none"><circle cx="-6.5" cy="-1" r="4.8" fill="${INK}"/><circle cx="6.5" cy="-1" r="4.8" fill="${INK}"/></g>
              <g fill="#fff" stroke="none">
                <circle cx="-8.3" cy="-3" r="1.9"/><circle cx="4.7" cy="-3" r="1.9"/><circle cx="-4.6" cy="1.6" r="1"/><circle cx="8.4" cy="1.6" r="1"/>
                ${star(-3.6, -3.6, 0.45, 'tw')}${star(9.4, -3.6, 0.45, 'tw tw2')}
              </g>
            </g>
            <!-- brows -->
            <path class="mc-brow mc-brow-l" d="M-10.5 -9.5 L-3.5 -9.5" stroke-width="2.8"/>
            <path class="mc-brow mc-brow-r" d="M3.5 -9.5 L10.5 -9.5" stroke-width="2.8"/>
            <!-- mouths -->
            <path class="m m-flat" d="M-5 9 H5"/>
            <path class="m m-smile" d="M-6.5 7 Q0 14 6.5 7"/>
            <g class="m m-grin"><path d="M-9 5.5 Q0 20 9 5.5 Z" fill="#8b1e3f"/><path d="M-4.5 12.8 Q0 9.5 4.5 12.8 Q0 16.5 -4.5 12.8Z" fill="#ff8fb1" stroke="none"/></g>
            <g class="m m-beam"><path d="M-12.8 8.4 Q0 25 12.8 8.4 Z" fill="#fff" stroke-width="2.2"/><path d="M-10.8 10.6 H10.8" stroke-width="1.1"/><path d="M-5.6 15.2 Q0 11.4 5.6 15.2 Q0 18.4 -5.6 15.2Z" fill="#ff8fb1" stroke="none"/><path d="M-15.6 4.6 q-1.6 2.4 -0.2 5 M15.6 4.6 q1.6 2.4 0.2 5" stroke-width="1.4"/></g>
            <g class="m m-scream"><ellipse class="mw" cx="0" cy="10.5" rx="6.6" ry="8" fill="#8b1e3f"/><path d="M-3.8 14.5 Q0 11.5 3.8 14.5 Q0 17.5 -3.8 14.5Z" fill="#ff8fb1" stroke="none"/></g>
            <ellipse class="m m-o" cx="0" cy="10.5" rx="3.3" ry="4.4" fill="#8b1e3f"/>
            <g class="m m-wail"><path class="mw" d="M-9 4.8 Q0 2.4 9 4.8 L6.8 15.6 Q0 18.4 -6.8 15.6 Z" fill="#8b1e3f"/><path d="M-4 14.2 Q0 11.6 4 14.2 Q0 16.8 -4 14.2Z" fill="#ff8fb1" stroke="none"/></g>
            <path class="m m-wobble" d="M-7 9.5 q1.75 -3.5 3.5 0 t3.5 0 t3.5 0 t3.5 0"/>
            <path class="m m-wavy" d="M-7 9.5 q1.75 -3.5 3.5 0 t3.5 0 t3.5 0 t3.5 0"/>
            <g class="m m-tongue"><path d="M-8 6 Q0 15 8 6"/><path d="M-2.8 10.2 v6 a2.8 2.8 0 0 0 5.6 0 v-6" fill="#ff6b8b"/></g>
            <path class="m m-smirk" d="M-5.5 10.5 Q2 12 7.5 5"/>
            <g class="m m-gnash"><path d="M-7.5 6.5 H7.5 V13 H-7.5Z" fill="#fff"/><path d="M-2.5 6.5 V13 M2.5 6.5 V13 M-7.5 9.8 H7.5" stroke-width="1.2"/></g>
            <!-- crying / sweating -->
            <g class="mc-tears" fill="none" stroke="#6cc8ff" stroke-width="3.2">
              <path class="td" d="M-8 3.5 Q-17 5 -21 17 Q-23 26 -22 60"/>
              <path class="td td2" d="M8 3.5 Q17 5 21 17 Q23 26 22 60"/>
            </g>
            <g class="mc-sweat" fill="#8fdcff" stroke-width="1.4">
              <path class="sw" d="M-17 -12 q-3.5 5.5 0 8 q3.5 -2.5 0 -8z"/><path class="sw sw2" d="M17 -9 q-3.5 5.5 0 8 q3.5 -2.5 0 -8z"/>
            </g>
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>`;

const CSS = `
.mc{position:fixed;left:0;top:0;z-index:45;pointer-events:none;transform-origin:0 0;will-change:transform,filter;--mc-ink:#1b1b1b;--mc-paper:#fff}
html.dark .mc{--mc-ink:#f4f4f4;--mc-paper:#26282c}
.mc-flip{width:100%;height:100%;transform:scaleX(var(--face,1));transition:transform .16s}
.mc-svg{width:100%;height:100%;overflow:visible}
.mc.zoomed .mc-svg *{stroke-width:1.2px}
html.mc-grabbing,html.mc-grabbing *{cursor:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M8 13c0-1.700 1.300-3 3-3 .6 0 1.100.2 1.600.5.500-1 1.500-1.700 2.700-1.700 1.100 0 2 .6 2.500 1.400.4-.3.900-.4 1.400-.4 1.700 0 3 1.300 3 3v5.500c0 4-3.100 7.200-7.100 7.200h-.5c-3.500 0-6.600-2.600-6.600-6.100z' fill='white' stroke='%231b1b1b' stroke-width='1.600' stroke-linejoin='round'/><path d='M12.600 10.500v5M16.800 9.600v5.200M21 11v4.400' stroke='%231b1b1b' stroke-width='1.200' stroke-linecap='round'/></svg>") 16 16,grabbing!important;user-select:none!important}
.mc-dim{position:fixed;inset:0;z-index:44;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 50%,rgba(255,216,77,.28),rgba(20,16,40,.62) 70%)}
.mc-say{position:fixed;left:0;top:0;z-index:46;width:max-content;max-width:210px;padding:.4rem .7rem;border:2.5px solid #1b1b1b;border-radius:14px;background:#fff;color:#1b1b1b;font:700 .78rem/1.25 inherit;font-family:inherit;text-align:center;pointer-events:none;box-shadow:0 6px 14px -8px rgba(0,0,0,.4);transform:translate(-50%,-100%);scale:0;transform-origin:50% 100%;transition:scale .22s cubic-bezier(.3,1.6,.5,1)}
.mc-say.show{scale:1}
.mc-say.side-r::after{left:0;top:50%;border-width:0 0 2.5px 2.5px;transform:translate(-50%,-50%) rotate(45deg);translate:none}
.mc-say.side-l::after{left:100%;top:50%;border-width:2.5px 2.5px 0 0;transform:translate(-50%,-50%) rotate(45deg);translate:none}
.mc-say::after{content:'';position:absolute;left:50%;top:100%;width:10px;height:10px;background:#fff;border:solid #1b1b1b;border-width:0 2.5px 2.5px 0;transform:translate(-50%,-6px) rotate(45deg);translate:calc(var(--sx,0px) * -1) 0}

.mc .e,.mc .m,.mc .mc-tears,.mc .mc-sweat,.mc .mc-blush,.mc .mc-sparks{display:none}
.mc[data-eyes=dot] .e-dot,.mc[data-eyes=wide] .e-wide,.mc[data-eyes=plead] .e-plead,.mc[data-eyes=sob] .e-sob,.mc[data-eyes=happy] .e-happy,.mc[data-eyes=crazy] .e-crazy,.mc[data-eyes=spiral] .e-spiral,.mc[data-eyes=lid] .e-lid,.mc[data-eyes=slit] .e-slit,.mc[data-eyes=heart] .e-heart,.mc[data-eyes=spark] .e-spark{display:inline}
.mc[data-mouth=flat] .m-flat,.mc[data-mouth=smile] .m-smile,.mc[data-mouth=grin] .m-grin,.mc[data-mouth=beam] .m-beam,.mc[data-mouth=scream] .m-scream,.mc[data-mouth=o] .m-o,.mc[data-mouth=wail] .m-wail,.mc[data-mouth=wobble] .m-wobble,.mc[data-mouth=wavy] .m-wavy,.mc[data-mouth=tongue] .m-tongue,.mc[data-mouth=smirk] .m-smirk,.mc[data-mouth=gnash] .m-gnash{display:inline}
.mc[data-tears] .mc-tears,.mc[data-sweat] .mc-sweat,.mc[data-blush] .mc-blush,.mc[data-spark] .mc-sparks{display:inline}

.mc-brow{transform-box:fill-box;transform-origin:center;transition:transform .12s}
.mc[data-brow=up] .mc-brow{transform:translateY(-3.4px)}
.mc[data-brow=worry] .mc-brow-l{transform:rotate(-24deg) translateY(-1px)}.mc[data-brow=worry] .mc-brow-r{transform:rotate(24deg) translateY(-1px)}
.mc[data-brow=angry] .mc-brow-l{transform:rotate(24deg)}.mc[data-brow=angry] .mc-brow-r{transform:rotate(-24deg)}
.mc[data-brow=one] .mc-brow-l{transform:translateY(-4px) rotate(-8deg)}.mc[data-brow=one] .mc-brow-r{transform:rotate(9deg)}

.mc-face{transform-box:fill-box;transform-origin:center}
.wj{animation:mc-jit .16s steps(2) infinite}
.mw{transform-box:fill-box;transform-origin:50% 0;animation:mc-wob .16s ease-in-out infinite alternate}
.mc[data-mouth=wail] .m-wail,.mc[data-mouth=wobble] .m-wobble{animation:mc-shake .1s linear infinite alternate}
.td{stroke-dasharray:7 5;animation:mc-tear .3s linear infinite}.td2{animation-delay:-.13s}
.sw{animation:mc-drip 1s ease-in infinite}.sw2{animation-delay:-.5s}
.tw{transform-box:fill-box;transform-origin:center;animation:mc-twk .7s ease-in-out infinite}.tw2{animation-delay:-.25s}.tw3{animation-delay:-.5s}
.sp{transform-box:view-box;animation:mc-spin .5s linear infinite}
.hb{transform-box:fill-box;transform-origin:center;animation:mc-beat .5s ease-in-out infinite}
.mc[data-spark] .mc-sparks .tw{animation-duration:.5s}

@keyframes mc-jit{0%{transform:translate(-.9px,.5px)}100%{transform:translate(.9px,-.6px)}}
@keyframes mc-wob{to{transform:scaleY(.8) scaleX(1.08)}}
@keyframes mc-shake{to{transform:translate(.7px,.5px)}}
@keyframes mc-tear{to{stroke-dashoffset:-24}}
@keyframes mc-drip{0%{transform:translateY(0);opacity:1}100%{transform:translateY(12px);opacity:0}}
@keyframes mc-twk{0%,100%{transform:scale(.35) rotate(0)}50%{transform:scale(1.15) rotate(35deg)}}
@keyframes mc-spin{to{transform:rotate(360deg)}}
@keyframes mc-beat{0%,100%{transform:scale(.85)}50%{transform:scale(1.25)}}

@media (prefers-reduced-motion:reduce){
  .mc *{animation:none!important}
  .mc-say,.mc-flip{transition:none}
}
`;

/* ───────────────────────── expressions ───────────────────────── */
const EX: Record<string, Look> = {
  neutral:  { eyes: 'dot',    mouth: 'flat',   brow: 'flat' },
  confused: { eyes: 'dot',    mouth: 'wavy',   brow: 'worry' },
  panic:    { eyes: 'wide',   mouth: 'scream', brow: 'worry', sweat: 1 },
  shock:    { eyes: 'wide',   mouth: 'o',      brow: 'up' },
  gasp:     { eyes: 'wide',   mouth: 'o',      brow: 'worry' },
  joy:      { eyes: 'happy',  mouth: 'grin',   brow: 'up', blush: 1 },
  giddy:    { eyes: 'crazy',  mouth: 'tongue', brow: 'up' },
  dizzy:    { eyes: 'spiral', mouth: 'wavy',   brow: 'flat' },
  angry:    { eyes: 'slit',   mouth: 'gnash',  brow: 'angry' },
  smug:     { eyes: 'lid',    mouth: 'smirk',  brow: 'one' },
  cry:      { eyes: 'sob',    mouth: 'wail',   brow: 'worry', tears: 1 },
  plead:    { eyes: 'plead',  mouth: 'wobble', brow: 'worry', tears: 1 },
  love:     { eyes: 'heart',  mouth: 'smile',  brow: 'up', blush: 1 },
  beam:     { eyes: 'spark',  mouth: 'beam',   brow: 'up', blush: 1, spark: 1 },
  shy:      { eyes: 'happy',  mouth: 'smile',  brow: 'worry', blush: 1 },
};
const POOL: Record<string, [string[], number]> = {
  run:   [['panic', 'shock', 'giddy', 'angry', 'gasp', 'dizzy', 'joy', 'smug'], 0.7],
  hope:  [['giddy', 'plead', 'shock', 'joy', 'love', 'panic'], 0.45],
  beg:   [['cry', 'plead', 'cry', 'panic', 'plead'], 1.0],
  dance: [['giddy', 'joy', 'love', 'dizzy', 'smug', 'shock'], 0.55],
  perch: [['smug', 'joy', 'love'], 1.2], knock: [['angry', 'panic', 'shock', 'plead'], 0.8],
  hug:   [['love', 'joy'], 1.2], stomp: [['joy', 'giddy'], 0.9], hop: [['joy', 'giddy', 'shock'], 0.7],
  lean:  [['gasp', 'smug', 'dizzy', 'shock'], 0.9], poke: [['shock', 'giddy', 'gasp'], 0.7],
  stand: [['confused', 'neutral'], 1.2], cheer: [['beam'], 9],
  dangle: [['panic', 'cry', 'angry', 'plead', 'shock'], 0.4], fight: [['angry', 'angry', 'giddy', 'smug'], 0.7],
};

const LINES: Record<string, string[]> = {
  beg: ['Please, just look at my work!!', 'One click. That is all I am asking!!', 'I poured my heart into these projects!', 'WAAAH! Nobody ever clicks it!', 'I will redo your logo for FREE. Just click!!', 'Every project took me sleepless nights!', 'Please do not leave without looking!!'],
  hope: ['You are getting closer!! Please!!', 'Is this it?! Are you going to click?!', 'I can feel it! My work is about to be seen!', 'Oh my gosh, oh my gosh, please!!', 'So close!! Do not stop now!'],
  dance: ['YOU FOUND IT!! My projects are right there!', 'Click it, click it, click it!!', 'This is the best day of my career!!', 'WOOOO! Someone is finally looking!', 'I have never been this happy!!'],
  perch: ['I design from up here. Great view.', 'Nice layout. I would have kerned it differently.', 'My favorite spot to think about logos.'],
  knock: ['Is anyone checking my spacing in there?', 'Solid grid. I approve.', 'Open up! I want to see the margins!'],
  hug: ['I love a well-made layout.', 'Good hierarchy deserves a hug.', 'I would design this one again in a heartbeat.'],
  stomp: ['I designed on this and I would do it again!', 'Look at me, I own this layout!', 'Another box conquered!'],
  hop: ['I put a lot of love into these letters!', 'Kerning check: passed!', 'I spent hours on this typography!'],
  lean: ['Let me read that again. I wrote it myself.', 'Hmm, is that the right typeface?', 'I pick every word as carefully as every font.', 'Did I really write that? I did.'],
  poke: ['Boop! Does this work? I hope so.', 'I built this myself, you know!', 'Click it. I promise it works!', 'Hello, little detail!'],
  grab: ['PUT ME DOWN!! I am the designer here!', 'You are kidnapping me from my own portfolio!!', 'Not the hair!! Not the curls!!', 'WAAAH! Wait, I can explain my pricing!', 'I have deadlines!! Let me go!!'],
  begged: ['Please, I am begging you, no more!', 'I will give you a discount! Just be gentle!', 'I am just a small designer!! Have mercy!', 'Okay okay, I am sorry! Please!!'],
  fought: ['You want a piece of me?! Come on!!', 'Nobody touches the designer!!', 'I did not spend years on this to be pushed around!', 'HAND VS DESIGNER! FIGHT!!', 'I have a Wacom pen and I am not afraid to use it!'],
  poked: ['Ow! Careful, I am an artist!', 'Hee hee hee, that tickles!', 'Hey! My hair took an hour!', 'EEEK!'],
  dark: ['Ooh, dark mode! My designs look good here too.', 'Lights out! I made sure it works in dark mode.'],
  light: ['MY EYES! Warn me before light mode!', 'So bright! Still looks great though.'],
  profbye: ['Okay, show is over. Now look at my projects!', 'Thank you, thank you. No autographs, please.', 'Enough about my face. Let me show you my work!'],
  'enter:home': ['Hi! I am Carlos, a graphic designer. Welcome!', 'Welcome to my portfolio! Please look around!'],
  'enter:about': ['This is my story. Be gentle!', 'Here is where I tell you all about me!'],
  'enter:projects': ['These are my projects. I am so nervous!', 'My work! Please be kind!'],
  'enter:contact': ['Say hi! I promise I reply fast.', 'Want to work together? I would love that!'],
  'enter:logofolio': ['These are all my logos. I love each one!', 'My logofolio! Every one has a story.'],
  'enter:branding': ['Whole brand identities I built!', 'Branding is my favorite thing to do!'],
  'enter:print-design': ['Real print work I made myself!', 'Posters, menus, flyers. All mine!'],
};

/* ───────────────────────── targets he likes to bother ───────────────────────── */
const KINDS: [Kind, string][] = [
  ['letter', '.hero-letter'],
  ['sticker', '[data-drag]'],
  ['button', '.btn, .pill, [data-filter], .switch, .btn-icon'],
  ['chip', '.chip, .rotator'],
  ['image', 'img'],
  ['box', '.card, article, aside, [data-project], [data-tilt], .tile, form'],
  ['field', 'input:not([type=radio]):not([type=checkbox]):not([type=range]), textarea, select'],
  ['text', 'h1, h2, h3, h4, p, .eyebrow, label'],
];
const DUR: Partial<Record<Act, number>> = { poke: 1.9, knock: 2.3, hug: 2.6, perch: 3.2, stomp: 2.2, hop: 1.5, lean: 2.4 };
// What he does while the cursor is on his profile photo. Each beat lasts a couple of seconds; the lines are
// his honest, slightly self-roasting commentary on his own picture.
const PROF: { act: Act; look: string; lines: string[] }[] = [
  { act: 'lean',  look: 'shock', lines: ['Oh no. That is my face. In full HD.', 'Wait, they used THAT photo?!', 'Is that really me? ...Unfortunately yes.'] },
  { act: 'stand', look: 'shy',   lines: ['Please do not stare. I blinked in that one.', 'I swear I do not look this nervous in real life.', 'My mom says it looks just like me. Hmm.'] },
  { act: 'model', look: 'smug',  lines: ['Yes, that is my good side. I only have one.', 'Photogenic? I took 47 tries to get this.', 'Smoldering look: 100%. Sleep: 0%.'] },
  { act: 'cheer', look: 'joy',   lines: ['Okay but the curls are doing great today.', 'Fine, I look like a professional. Hire me!', 'Not bad for a designer who hates being photographed.'] },
  { act: 'wave',  look: 'giddy', lines: ['Hi! The one in the photo says hi too.', 'Do not zoom in. The curls act up.', 'We are both available for projects!'] },
];
const ORDER = ['home', 'about', 'projects', 'logofolio', 'branding', 'print-design', 'contact'];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (w: number) => w * w * (3 - 2 * w);
const easeOutBack = (p: number) => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };

export function createMascot(): Mascot {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const U = fine ? 1.3 : 0.85;               // pixels per drawing unit
  const W = 120 * U, H = 160 * U;
  const FEET_X = 60 * U, FEET_Y = 154.5 * U;  // where his feet sit inside the box
  const HEAD_X = 60 * U, HEAD_Y = 38 * U;     // where his head centre sits inside the box
  const sc = (zz: number) => 1 - 0.55 * zz;   // depth -> scale

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const root = document.createElement('div');
  root.className = 'mc';
  root.style.width = `${W}px`; root.style.height = `${H}px`;
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `<div class="mc-flip">${SVG}</div>`;
  const dim = document.createElement('div');
  dim.className = 'mc-dim';
  dim.setAttribute('aria-hidden', 'true');
  const bubble = document.createElement('div');
  bubble.className = 'mc-say';
  bubble.setAttribute('aria-hidden', 'true');
  document.body.append(dim, root, bubble);

  const flipper = root.querySelector<HTMLElement>('.mc-flip')!;
  const q = <T extends Element>(s: string) => root.querySelector<T>(s)!;
  const qa = (s: string) => [0, 1].map((i) => q<SVGGElement>(`.${s}${i}`));
  const gBody = q<SVGGElement>('.g-body'), gTorso = q<SVGGElement>('.g-torso'), gHead = q<SVGGElement>('.g-head');
  const gAu = qa('g-au'), gAf = qa('g-af'), gT = qa('g-t'), gS = qa('g-s'), gF = qa('g-f');
  const faceG = q<SVGGElement>('.mc-face');
  const puddle = q<SVGEllipseElement>('.mc-puddle');
  const shadow = q<SVGEllipseElement>('.mc-shadow');

  const ctaEl = document.querySelector<HTMLElement>('[data-heart]');
  const profileEl = document.querySelector<HTMLElement>('[data-profile]');
  const drawerEl = document.querySelector<HTMLElement>('#drawer');
  const lightboxEl = document.querySelector<HTMLDialogElement>('#lightbox');

  // the View projects button's heartbeat: faster the closer the cursor
  const beat = ctaEl && !calm
    ? ctaEl.animate([
        { scale: '1', boxShadow: '0 0 0 0 rgba(255,107,139,0)' },
        { scale: '1.1', boxShadow: '0 0 0 9px rgba(255,107,139,.28)', offset: 0.14 },
        { scale: '1', boxShadow: '0 0 0 0 rgba(255,107,139,0)', offset: 0.28 },
        { scale: '1.07', boxShadow: '0 0 0 6px rgba(255,107,139,.2)', offset: 0.42 },
        { scale: '1', boxShadow: '0 0 0 0 rgba(255,107,139,0)' },
      ], { duration: 1000, iterations: Infinity, easing: 'ease-in-out' })
    : null;
  let heart = 0.8;

  /* ── state ── */
  let page = 'home', pageIdx = -1;
  let mode: Mode = 'roam';
  let x = -140, y = innerHeight * 0.7, z = 1, face = 1;
  let tourLeft = 0;
  let job: Job | null = null, phase: 'go' | 'do' = 'go', doUntil = 0, fxNext = 0, pauseUntil = 0;
  let leg = { d0: 0, z0: 1, bump: 0 };
  let lastKind: Kind | '' = '';
  const recent: HTMLElement[] = [];
  let mood = '', moodSince = 0, hopeWp: { x: number; y: number; t: number } | null = null;
  let zoomT = -1, zoomF = 0, pending: string | null = null, calmBeamUntil = 0;
  let cur: Pose = P(), snap: Pose = P(), blendT = 1, lastAct: Act | '' = '';
  let lookName = '', nextLook = 0, lockLook = '', lockUntil = 0;
  let puddleAmt = 0, lastSay = 0, hideTimer = 0, lastLine = '';
  let danceSpin = 0;
  let joyOn = false;
  const setJoy = (on: boolean) => {
    if (on === joyOn) return;
    joyOn = on;
    window.dispatchEvent(new CustomEvent('mascot:mood', { detail: { joy: on } }));
  };
  // profile-photo reaction: hover on mouse, a few seconds after a tap on touch / pen
  let profHover = false, profUntil = 0, profOn = false, profBeat = -1, profBeatAt = 0, profRound = 0, profSince = 0;
  const cursor = { x: 0, y: 0, seen: false, down: false };

  const say = (text: string, ms = 2400, force = false) => {
    const now = performance.now();
    if (!force && now - lastSay < 1600) return;
    lastSay = now;
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => bubble.classList.remove('show'), ms);
  };
  const sayKey = (key: string, force = false, ms = 2400) => {
    const l = LINES[key];
    if (!l) return;
    let t = pick(l);
    if (l.length > 1 && t === lastLine) t = l[(l.indexOf(t) + 1) % l.length];
    lastLine = t;
    say(t, ms, force);
  };
  const forceLook = (name: string, ms: number) => { lockLook = name; lockUntil = performance.now() + ms; };

  function setLook(name: string) {
    if (name === lookName) return;
    lookName = name;
    const l = EX[name] ?? EX.neutral;
    root.dataset.eyes = l.eyes; root.dataset.mouth = l.mouth; root.dataset.brow = l.brow;
    for (const k of ['tears', 'sweat', 'blush', 'spark'] as const) { if (l[k]) root.dataset[k] = ''; else delete root.dataset[k]; }
    if (!calm) faceG.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
  }

  /* ── the page's things ── */
  function usable(el: HTMLElement): boolean {
    if (el.offsetParent === null || el.closest('.mc')) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 28 && r.height >= 14 && r.bottom > 120 && r.top < innerHeight - 140 && r.right > 20 && r.left < innerWidth - 20;
  }
  function candidates(): Job[] {
    const pg = document.querySelector<HTMLElement>('[data-page]:not(.is-filtered-out)');
    if (!pg) return [];
    const seen = new Set<HTMLElement>(), out: Job[] = [];
    for (const [kind, sel] of KINDS) {
      pg.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (seen.has(el) || recent.includes(el)) return;
        seen.add(el);
        if (usable(el)) out.push({ el, kind, act: 'stand', frac: 0.5, side: 1, zt: 0 });
      });
    }
    return out;
  }
  function startJob(): boolean {
    const list = candidates();
    if (!list.length) return false;
    const pool = list.filter((j) => j.kind !== lastKind);
    const j = pick(pool.length ? pool : list);
    const r = j.el.getBoundingClientRect();
    j.frac = rnd(0.18, 0.82);
    j.side = r.left > 150 * U && (Math.random() < 0.6 || r.right > innerWidth - 150 * U) ? 1 : -1;   // 1 = stand on its left
    j.zt = pick([0, 0, 0.12, 0.28]);
    const big = r.width > 560;
    switch (j.kind) {
      case 'letter': j.act = 'hop'; break;
      case 'sticker': case 'button': case 'chip': j.act = 'poke'; break;
      case 'field': case 'text': j.act = 'lean'; break;
      default: j.act = big ? pick(['knock', 'perch', 'stomp'] as Act[]) : pick(['hug', 'knock', 'perch', 'stomp'] as Act[]);
    }
    job = j; phase = 'go'; leg = { d0: 0, z0: z, bump: pick([0, 0, 0.4, 0.55]) };
    recent.push(j.el); if (recent.length > 7) recent.shift();
    return true;
  }
  // where his feet should be to do the job
  function spotFor(j: Job, r: DOMRect, s: number) {
    const k = U * s;
    switch (j.act) {
      case 'hop': case 'stomp': case 'lean':
        return { x: r.left + r.width * j.frac, y: r.top + (j.kind === 'letter' ? r.height * 0.22 : 3), face: j.frac < 0.5 ? 1 : -1 };
      case 'perch':
        return { x: r.left + r.width * j.frac, y: r.top + 54 * k, face: j.frac < 0.5 ? 1 : -1 };
      default: {
        const cy = clamp(r.top + Math.min(r.height, 400) * 0.4, 140, innerHeight - 140);
        return { x: j.side === 1 ? r.left - 30 * k : r.right + 30 * k, y: cy + 88 * k, face: j.side };
      }
    }
  }

  /* ── poses ── */
  function poseFor(act: Act, t: number, reach: { dx: number; dy: number }): Pose {
    const w = 2 * Math.PI;
    switch (act) {
      case 'run': case 'hope': {
        const p = t * w * (act === 'hope' ? 3.8 : 3.3);
        const leg_ = (ph: number) => ({ t: 52 * Math.sin(ph), s: -(34 + 34 * Math.sin(ph - 1.1)), f: 12 + 12 * Math.sin(ph) });
        const a = leg_(p), b = leg_(p + Math.PI);
        const up = act === 'hope';
        return P({
          hy: -Math.abs(Math.sin(p)) * 7, lean: up ? 8 : 17, head: 4 + 7 * Math.sin(p * 2),
          t0: a.t, s0: a.s, f0: a.f, t1: b.t, s1: b.s, f1: b.f,
          au0: up ? 150 + 35 * Math.sin(p) : -58 * Math.sin(p), af0: up ? 25 * Math.sin(p + 1) : 55 + 28 * Math.sin(p + 0.8),
          au1: up ? 150 - 35 * Math.sin(p) : 58 * Math.sin(p), af1: up ? -25 * Math.sin(p + 1) : 55 - 28 * Math.sin(p + 0.8),
        });
      }
      case 'beg': {
        const sob = Math.sin(t * 13), hands = armTo(1, 12 + 1.3 * Math.sin(t * 17), -46 + 2 * sob);
        const hands0 = armTo(0, 12 + 1.3 * Math.sin(t * 17), -46 + 2 * sob);
        return P({
          hy: 28 + 0.8 * sob, hx: -2, lean: 9 + 3 * sob, head: -20 + 5 * Math.sin(t * 9),
          au0: hands0[0], af0: hands0[1], au1: hands[0], af1: hands[1],
          t0: 4, s0: -92, f0: 68, t1: 16, s1: -90, f1: 64,
        });
      }
      case 'dance': return dancePose(t);
      case 'poke': {
        const jab = 0.5 + 0.5 * Math.sin(t * 15), h = armTo(0, 8, -5), n = armTo(1, reach.dx - 5 * jab, reach.dy);
        return P({ lean: 9, head: 8, au0: h[0], af0: h[1], au1: n[0], af1: n[1], t0: -6, t1: 8 });
      }
      case 'knock': {
        const n = Math.sin(t * 19), a0 = armTo(0, reach.dx - 6 * Math.max(0, n), reach.dy + 4), a1 = armTo(1, reach.dx - 6 * Math.max(0, -n), reach.dy - 4);
        return P({ lean: 12 + 4 * n, head: 6 * n, au0: a0[0], af0: a0[1], au1: a1[0], af1: a1[1], t0: -10, t1: 10, s0: -8, s1: -4 });
      }
      case 'hug': {
        const a0 = armTo(0, reach.dx + 5, reach.dy - 7), a1 = armTo(1, reach.dx + 3, reach.dy + 6);
        return P({ lean: 15 + 1.5 * Math.sin(t * 4), head: 24, au0: a0[0], af0: a0[1], au1: a1[0], af1: a1[1], t0: -8, t1: 8 });
      }
      case 'perch': {
        const k = Math.sin(t * 6), wave = Math.sin(t * 10), hand = armTo(1, 9, 3);
        return P({
          lean: -3, head: -4 + 4 * Math.sin(t * 2), t0: 86, s0: -88 + 24 * k, f0: 6, t1: 90, s1: -92 - 24 * k, f1: 6,
          au0: 150 + 22 * wave, af0: 25 * Math.sin(t * 10 + 1), au1: hand[0], af1: hand[1],
        });
      }
      case 'stomp': case 'hop': case 'cheer': {
        const amp = act === 'hop' ? 0.65 : 1, hp = Math.abs(Math.sin(t * Math.PI * (act === 'hop' ? 3 : 2.3))), sw = Math.sin(t * 9);
        const crouch = 1 - hp;
        return P({
          hy: -hp * 15 * amp + crouch * 5, head: act === 'cheer' ? 8 * sw : -8, lean: act === 'cheer' ? 2 : -3,
          t0: 10 + 15 * crouch, s0: -(8 + 36 * crouch), f0: 4, t1: -10 - 12 * crouch, s1: -(8 + 36 * crouch), f1: 4,
          au0: 160 + 14 * sw, af0: 10 * sw, au1: 160 - 14 * sw, af1: -10 * sw,
        });
      }
      case 'dangle': {
        const k = Math.sin(t * 15), k2 = Math.sin(t * 11 + 1);
        return P({ lean: -2 + 4 * k2, head: 10 * k, au0: 112 + 48 * k, af0: 36 * k2, au1: 112 - 48 * k, af1: -36 * k2, t0: 6 + 20 * k, s0: -(12 + 16 * Math.abs(k2)), f0: 10, t1: 6 - 20 * k, s1: -(12 + 16 * Math.abs(k)), f1: 10 });
      }
      case 'fight': {
        const sn = Math.sin(t * 10), pa = Math.max(0, sn), pb = Math.max(0, -sn);
        const a0 = armTo(0, 13 + 24 * pb, -41 + 2 * pb), a1 = armTo(1, 13 + 24 * pa, -41 + 2 * pa);
        return P({ hy: 3, hx: 3 * (pa + pb), lean: 10 + 7 * (pa + pb), head: 4 - 4 * (pa + pb), au0: a0[0], af0: a0[1], au1: a1[0], af1: a1[1], t0: 28, s0: -34, f0: 4, t1: -22, s1: -28, f1: 4 });
      }
      case 'model': {        // hand on hip, other hand flicking the hair, chin up
        const sw = Math.sin(t * 2.2), hip = armTo(0, 8, -4), hair = armTo(1, 3, -62 + 2 * sw);
        return P({ lean: -4, head: -12 + 4 * sw, hx: 2, au0: hip[0], af0: hip[1], au1: hair[0], af1: hair[1], t0: 16, s0: -4, t1: -8, s1: -4 });
      }
      case 'wave': {         // hand on hip, other arm waving hello
        const wv = Math.sin(t * 11), hip = armTo(0, 7, -4);
        return P({ lean: -2, head: 6 * Math.sin(t * 3), au0: hip[0], af0: hip[1], au1: 150, af1: 38 * wv, t0: -4, t1: 4 });
      }
      case 'lean': {
        const chin = armTo(1, 9.5, -48 + Math.sin(t * 3)), tap = Math.sin(t * 8);
        return P({ lean: 22, head: 22 + 4 * Math.sin(t * 2), au0: -34, af0: 40, au1: chin[0], af1: chin[1], t0: -8, t1: 8, f1: 8 * tap });
      }
      default: { // 'stand' — the confused pose from the reference sketch: one hand on hip, one scratching the head
        const sc_ = Math.sin(t * 9), head = armTo(1, 3.6 + sc_ * 1.6, -66 + sc_ * 1.2), hip = armTo(0, 7, -4);
        return P({ lean: 1, head: 6, au0: hip[0], af0: hip[1], au1: head[0], af1: head[1], t0: -3, t1: 3 });
      }
    }
  }
  function dancePose(t: number): Pose {
    const move = (m: number, tt: number): Pose => {
      const w = tt * 2 * Math.PI * 2.6, s = Math.sin(w), c = Math.cos(w);
      switch (m % 5) {
        case 0: return P({ hy: -9 * Math.abs(s), lean: 9 * s, head: 20 * s, au0: 140 + 40 * s, af0: 70 * c, au1: 140 - 40 * s, af1: -70 * c, t0: 34 * s, s0: -(24 + 22 * Math.abs(c)), f0: 8, t1: -34 * s, s1: -(24 + 22 * Math.abs(s)), f1: 8 });
        case 1: return P({ hx: 9 * s, hy: 5 * Math.abs(c), lean: 20 * s, head: -22 * s, au0: 85 + 60 * s, af0: 40 * c, au1: 85 - 60 * s, af1: -40 * c, t0: 22, s0: -50, t1: -12, s1: -50 });
        case 2: return P({ hy: -4, lean: -6, head: 8 * s, au0: 95, af0: 30 * s, au1: 95, af1: -30 * s, t0: 80 * Math.max(0, s), s0: -8, f0: 20, t1: 80 * Math.max(0, -s), s1: -8, f1: 20 });
        case 3: return P({ hy: 6 + 4 * Math.sin(w * 2), lean: 18 * Math.sin(w * 2), head: 36 * Math.sin(w * 2), au0: 90 + 70 * Math.sin(w * 2), af0: 80, au1: 90 - 70 * Math.sin(w * 2), af1: 80, t0: 18, s0: -58, t1: -6, s1: -58 });
        default: return P({ hx: 11 * s, hy: -3 * Math.abs(c), lean: 6 * s, head: -14 * s, au0: 30 + 90 * s, af0: 8, au1: 30 - 90 * s, af1: 8, t0: -26 * s, s0: -(16 + 16 * Math.abs(c)), t1: 26 * s, s1: -(16 + 16 * Math.abs(s)) });
      }
    };
    const seg = 1.25, i = Math.floor(t / seg), f = (t / seg) % 1;
    const a = move(i, t), b = move(i + 1, t);
    return f > 0.82 ? mixPose(a, b, smooth((f - 0.82) / 0.18)) : a;
  }
  function apply(p: Pose) {
    gBody.setAttribute('transform', `translate(${p.hx.toFixed(2)} ${p.hy.toFixed(2)})`);
    gTorso.setAttribute('transform', `rotate(${p.lean.toFixed(2)})`);
    gHead.setAttribute('transform', `translate(0 -41) rotate(${p.head.toFixed(2)})`);
    for (let i = 0; i < 2; i++) {
      gAu[i].setAttribute('transform', `rotate(${(-(p as any)[`au${i}`]).toFixed(2)})`);
      gAf[i].setAttribute('transform', `translate(0 ${UA}) rotate(${(-(p as any)[`af${i}`]).toFixed(2)})`);
      gT[i].setAttribute('transform', `translate(${HPX[i]} 0) rotate(${(-(p as any)[`t${i}`]).toFixed(2)})`);
      gS[i].setAttribute('transform', `translate(0 27) rotate(${(-(p as any)[`s${i}`]).toFixed(2)})`);
      gF[i].setAttribute('transform', `translate(0 27) rotate(${(-(p as any)[`f${i}`]).toFixed(2)})`);
    }
  }

  /* ── element reactions ── */
  function wiggle(el: HTMLElement, kind: Kind, a = 1) {
    if (calm) return;
    try {
      if (kind === 'sticker' || kind === 'button' || kind === 'chip') {
        el.animate([{ scale: '1' }, { scale: `${1 + 0.14 * a}` }, { scale: `${1 - 0.05 * a}` }, { scale: '1' }], { duration: 380, easing: 'ease-out' });
      } else if (kind === 'letter') {
        el.animate([{ translate: '0 0', rotate: '0deg' }, { translate: `0 ${-0.14 * a}em`, rotate: `${-8 * a}deg`, offset: 0.4 }, { translate: '0 0', rotate: '0deg' }], { duration: 420, easing: 'ease-out' });
      } else if (kind === 'box' || kind === 'image') {
        el.animate([{ rotate: '0deg', scale: '1' }, { rotate: `${-0.9 * a}deg`, scale: `${1 + 0.012 * a}`, offset: 0.3 }, { rotate: `${0.7 * a}deg`, scale: '1', offset: 0.65 }, { rotate: '0deg', scale: '1' }], { duration: 420, easing: 'ease-out' });
      }
    } catch { /* animating can fail on odd elements; the show goes on */ }
  }
  const LETTER_COLORS = ['#ff6b8b', '#17b8a6', '#f5a623', '#4f6bff'];
  function startFx(j: Job) {
    if (j.kind === 'letter') {
      const c = j.el.style.color;
      j.el.style.color = pick(LETTER_COLORS);
      window.setTimeout(() => { j.el.style.color = c; }, 900);
    }
    wiggle(j.el, j.kind, j.act === 'hug' ? 1.6 : 1);
    if (Math.random() < 0.75) sayKey(j.act);
  }

  /* ── input (never steers him, only decides how he feels about the button) ── */
  /* ── the visitor can grab, drag, click and throw him ── */
  const press = { on: false, id: 0, sx: 0, sy: 0, moved: false };
  const drag = { on: false, px: 0, py: 0, gx: 0, gy: 0, hist: [] as { x: number; y: number; t: number }[] };
  let falling = false, vx = 0, vy = 0, swallow = false, dragCount = 0;
  let react: { kind: 'beg' | 'fight'; until: number } | null = null;
  const hidden = () => !!(drawerEl?.classList.contains('is-open') || lightboxEl?.open);
  const hitMe = (px: number, py: number) => {
    if (zoomT >= 0 || hidden()) return false;
    const k = U * sc(z);
    return px >= x - 27 * k && px <= x + 27 * k && py >= y - (140 - Math.max(0, cur.hy)) * k && py <= y + 5 * k;
  };
  function startReact(kind: 'beg' | 'fight', ms: number) {
    react = { kind, until: performance.now() + ms };
    job = null; hopeWp = null; mood = '';
    sayKey(kind === 'beg' ? 'begged' : 'fought', true, 3000);
  }
  function endDrag() {
    if (!drag.on) return;
    drag.on = false;
    document.documentElement.classList.remove('mc-grabbing');
    const h = drag.hist, n = h.length;
    if (n > 1) {
      const a = h[0], b = h[n - 1], dt_ = Math.max(0.03, (b.t - a.t) / 1000);
      vx = clamp((b.x - a.x) / dt_, -1800, 1800); vy = clamp((b.y - a.y) / dt_, -1800, 1800);
    } else { vx = 0; vy = 0; }
    falling = true;
  }
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { cursor.x = e.clientX; cursor.y = e.clientY; cursor.seen = true; }
    if (press.on && e.pointerId === press.id) {
      if (!press.moved && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) > 6) {
        press.moved = true; drag.on = true; falling = false; react = null; job = null; dragCount++;
        drag.gx = x - e.clientX; drag.gy = y - e.clientY; drag.hist = [];
        document.documentElement.classList.add('mc-grabbing');
        sayKey('grab', true, 3000);
      }
      if (drag.on) {
        drag.px = e.clientX; drag.py = e.clientY;
        const now = performance.now();
        drag.hist.push({ x: e.clientX, y: e.clientY, t: now });
        while (drag.hist.length > 1 && now - drag.hist[0].t > 90) drag.hist.shift();
      }
    }
  });
  document.documentElement.addEventListener('pointerleave', () => { cursor.seen = false; });
  document.addEventListener('pointerdown', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest?.('[data-heart]')) { cursor.down = true; return; }
    if (e.button === 0 && hitMe(e.clientX, e.clientY)) {
      press.on = true; press.id = e.pointerId; press.sx = e.clientX; press.sy = e.clientY; press.moved = false;
      swallow = true;
      if (e.pointerType === 'mouse') e.preventDefault();
    }
  }, true);
  const release = (e: PointerEvent) => {
    cursor.down = false;
    if (!press.on || e.pointerId !== press.id) return;
    press.on = false;
    if (drag.on) endDrag();
    else if (!press.moved) {          // a plain click on him: he either begs or fights back
      forceLook('shock', 400);
      startReact(Math.random() < 0.5 ? 'beg' : 'fight', 3400);
      if (!calm) flipper.animate([{ rotate: '0deg' }, { rotate: '-14deg' }, { rotate: '10deg' }, { rotate: '0deg' }], { duration: 380, easing: 'ease-out' });
    }
    window.setTimeout(() => { swallow = false; }, 60);
  };
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);
  // stop the page scrolling away while a finger is dragging him
  document.addEventListener('touchstart', (e) => {
    const tt = e.touches[0];
    if (tt && hitMe(tt.clientX, tt.clientY)) e.preventDefault();
  }, { passive: false });

  if (profileEl) {
    profileEl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') profHover = true; });
    profileEl.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') { profHover = false; profUntil = performance.now() + 500; }
    });
    profileEl.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') profUntil = performance.now() + 7000; });
  }

  // The big moment: clicking View projects
  document.addEventListener('click', (e) => {
    if (swallow) { e.stopPropagation(); e.preventDefault(); swallow = false; return; }
    if ((e.target as HTMLElement).closest?.('[data-heart]')) startZoom();
  }, true);

  function startZoom() {
    if (zoomT >= 0) return;
    zoomT = performance.now();
    job = null; bubble.classList.remove('show');
    if (calm) calmBeamUntil = zoomT + 1800;
  }

  // dark mode flip
  let wasDark = document.documentElement.classList.contains('dark');
  new MutationObserver(() => {
    const dark = document.documentElement.classList.contains('dark');
    if (dark === wasDark) return;       // other class changes (e.g. while he is being dragged) are not a theme flip
    wasDark = dark;
    forceLook(dark ? 'panic' : 'shock', 900);
    sayKey(dark ? 'dark' : 'light', true);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  /* ── pages ── */
  function enter(id: string) {
    const idx = ORDER.indexOf(id);
    const fromRight = idx > pageIdx && pageIdx !== -1;
    page = id; pageIdx = idx;
    job = null; hopeWp = null; mood = '';
    tourLeft = id === 'home' ? 3 + Math.floor(rnd(0, 2)) : 0;
    mode = id === 'home' ? 'tour' : 'roam';
    if (calm) { mode = id === 'home' ? 'home' : 'roam'; x = 70; y = innerHeight - 140; z = 0; return; }
    x = fromRight ? innerWidth + 120 : -120;
    y = rnd(innerHeight * 0.45, innerHeight * 0.75);
    z = 1; face = fromRight ? -1 : 1;
    window.setTimeout(() => sayKey(`enter:${id}`, true, 3000), 1600);
  }
  function setPage(id: string) {
    if (zoomT >= 0) { pending = id; return; }
    enter(id);
  }

  const distToRect = (px: number, py: number, r: DOMRect) =>
    Math.hypot(Math.max(r.left - px, 0, px - r.right), Math.max(r.top - py, 0, py - r.bottom));

  /* ── the loop ── */
  let last = performance.now();
  function frame(now: number) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = calm ? 0.37 : now / 1000;

    // hide while a project drawer / lightbox is open
    if (drawerEl?.classList.contains('is-open') || lightboxEl?.open) { root.style.opacity = '0'; bubble.classList.remove('show'); setJoy(false); return; }

    const cta = page === 'home' && ctaEl ? ctaEl.getBoundingClientRect() : null;
    const guard = !!cta && cta.width > 0 && cta.top >= 60 && cta.bottom <= innerHeight - 20;
    const hasCursor = (cursor.seen && fine) || cursor.down;
    const dBtn = cta && guard ? (cursor.down ? 0 : hasCursor ? distToRect(cursor.x, cursor.y, cta) : 999) : 999;

    // heartbeat of the button
    if (beat && cta && cta.width > 0) {
      const d = hasCursor ? dBtn : 600;
      const rate = d === 0 ? 4.2 : d < 170 ? 3.2 - (d / 170) * 1.4 : d < 420 ? 1.8 - ((d - 170) / 250) : 0.8;
      heart += (rate - heart) * Math.min(1, dt * 6);
      beat.updatePlaybackRate(heart);
    }

    let act: Act = 'stand';
    let reach = { dx: 28, dy: 6 };
    let zTarget = z;
    const s0 = sc(z);

    // is the cursor (or a recent tap) on his profile photo, and is that photo actually on screen?
    const pr = profileEl && page === 'home' ? profileEl.getBoundingClientRect() : null;
    const profOk = !!pr && pr.width > 0 && pr.bottom > 110 && pr.top < innerHeight - 60;
    const wantProf = profOk && (profHover || now < profUntil);

    /* ---------- what is he doing? ---------- */
    if (react && now >= react.until && !drag.on && !falling) { react = null; pauseUntil = now + 300; }
    if (zoomT >= 0) {
      act = 'cheer';
      zTarget = 0;
    } else if (drag.on) {
      // lifted by the hair: the grip point eases up to the top of his head, and he follows the cursor exactly
      act = 'dangle'; zTarget = 0;
      const k = U * sc(z), e = Math.min(1, dt * 10);
      drag.gx += (0 - drag.gx) * e; drag.gy += (122 * k - drag.gy) * e;
      x = drag.px + drag.gx; y = drag.py + drag.gy;
    } else if (falling) {
      // let go: he tumbles, bounces off the edges, then reacts
      act = 'dangle'; zTarget = 0;
      vy += 2400 * dt; x += vx * dt; y += vy * dt;
      const lo = 28 * U, hi = innerWidth - 28 * U, top = 150 * U * sc(z), floor = innerHeight - 18;
      if (x < lo) { x = lo; vx = Math.abs(vx) * 0.5; } if (x > hi) { x = hi; vx = -Math.abs(vx) * 0.5; }
      if (y < top) { y = top; vy = Math.abs(vy) * 0.4; }
      if (y >= floor) {
        y = floor;
        if (Math.abs(vy) > 420) { vy = -vy * 0.35; vx *= 0.7; }
        else { falling = false; vx = 0; vy = 0; startReact(Math.random() < 0.5 ? 'beg' : 'fight', 4200); }
      }
    } else if (react && now < react.until) {
      zTarget = 0;
      if (react.kind === 'beg') { act = 'beg'; face = 1; }
      else if (hasCursor) {
        // he squares up to the hand cursor and swings at it
        const side = cursor.x > x ? 1 : -1;
        const tx = cursor.x - side * 70 * U, ty = clamp(cursor.y + 78 * U, 150 * U, innerHeight - 8);
        const dx = tx - x, dy = ty - y, dd = Math.hypot(dx, dy);
        face = side;
        if (dd > 24) { act = 'run'; const st = Math.min(dd, 640 * dt); x += (dx / dd) * st; y += (dy / dd) * st; forceLook('angry', 150); }
        else { act = 'fight'; x += dx * Math.min(1, dt * 8); y += dy * Math.min(1, dt * 8); }
      } else { act = 'fight'; }
    } else if (wantProf && pr) {
      /* ---- his own photo: rush over and react ---- */
      mood = ''; job = null; hopeWp = null; zTarget = 0;
      if (!profOn) { profOn = true; profBeat = -1; profSince = now; }
      const k = U * s0;
      const room = pr.left > 80 * k;     // space beside the photo? otherwise he photobombs it from the inside corner
      const tx = clamp(room ? pr.left - 34 * k : pr.left + 46 * k, 28 * U, innerWidth - 28 * U);
      const ty = clamp(room ? pr.top + pr.height * 0.8 : pr.bottom - 16 * k, 90 + 140 * U * s0 * 0.95, innerHeight - 6);
      const dx = tx - x, dy = ty - y, dd = Math.hypot(dx, dy);
      if (calm) { x = tx; y = ty; }
      if (dd > 14 && !calm) {
        act = 'run';
        const step = Math.min(dd, 620 * dt); x += (dx / dd) * step; y += (dy / dd) * step;
        if (Math.abs(dx) > 6) face = dx > 0 ? 1 : -1;
        profBeatAt = now;
      } else {
        const e = Math.min(1, dt * 8); x += dx * e; y += dy * e; face = 1;
        if (profBeat < 0 || now - profBeatAt > 2500) {
          profBeat = (profBeat + 1) % PROF.length; profBeatAt = now;
          if (profBeat === 0) profRound++;
          const b = PROF[profBeat];
          forceLook(b.look, 2300);
          say(b.lines[profRound % b.lines.length], 2400, true);
        }
        act = PROF[profBeat].act;
      }
    } else if (now < pauseUntil) {
      act = 'stand'; zTarget = 0;
    } else if (calm) {
      // reduced motion: no running about, just the key poses where the button is
      if (guard && cta) {
        const cx = cta.left + cta.width / 2;
        x = cx; y = Math.min(innerHeight - 10, cta.bottom + 113 * U + 8);
        act = dBtn === 0 ? 'dance' : 'beg';
      } else { act = 'stand'; x = 70; y = innerHeight - 140; }
      zTarget = 0;
    } else if (mode === 'home' && guard && cta) {
      /* ---- at the View projects button ---- */
      const cx = cta.left + cta.width / 2;
      const m = dBtn === 0 ? 'dance' : dBtn < 260 ? 'hope' : 'beg';
      if (m !== mood) {
        mood = m; moodSince = now; hopeWp = null;
        if (m === 'beg') puddleAmt = Math.min(puddleAmt, 0.2);
        sayKey(m, true, 2600);
      } else if (now - moodSince > 3600 && Math.random() < dt * 0.35) { moodSince = now; sayKey(m, true, 2400); }

      if (m === 'dance') {
        act = 'dance';
        const ox = cx + Math.sin(t * 1.9) * Math.min(160, cta.width * 0.9 + 50), oy = cta.bottom + 70 * U + Math.sin(t * 2.7) * 30;
        const k = Math.min(1, dt * 7);
        x += (ox - x) * k; y += (oy - y) * k;
        face = Math.cos(t * 1.9) > 0 ? 1 : -1;
        zTarget = 0.12 + 0.14 * Math.sin(t * 1.3);
        if (Math.random() < dt * 0.3) { flipper.animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 620, easing: 'ease-in-out' }); danceSpin = now; }
      } else if (m === 'hope') {
        act = 'hope';
        const cy = cta.top + cta.height / 2;
        if (!hopeWp || now > hopeWp.t || Math.hypot(hopeWp.x - x, hopeWp.y - y) < 20) {
          const a = Math.random() * Math.PI * 2;
          hopeWp = {
            x: cx + Math.cos(a) * (cta.width / 2 + 70 + Math.random() * 70),
            y: cy + Math.sin(a) * (cta.height / 2 + 60 + Math.random() * 50) + 70 * U,
            t: now + 700 + Math.random() * 600,
          };
        }
        const dd = Math.hypot(hopeWp.x - x, hopeWp.y - y) || 1, step = Math.min(dd, 640 * dt);
        x += ((hopeWp.x - x) / dd) * step; y += ((hopeWp.y - y) / dd) * step;
        if (Math.abs(hopeWp.x - x) > 6) face = hopeWp.x > x ? 1 : -1;
        zTarget = 0.08 + 0.2 * (0.5 + 0.5 * Math.sin(t * 2.2));
      } else {
        const bx = cx, by = Math.min(innerHeight - 10, cta.bottom + 113 * U + 8);
        const dx = bx - x, dy = by - y, dd = Math.hypot(dx, dy);
        if (dd > 14) {
          act = 'run';
          const step = Math.min(dd, 600 * dt); x += (dx / dd) * step; y += (dy / dd) * step;
          if (Math.abs(dx) > 6) face = dx > 0 ? 1 : -1;
        } else { act = 'beg'; x += dx * Math.min(1, dt * 8); y += dy * Math.min(1, dt * 8); face = 1; }
        zTarget = 0;
      }
    } else {
      /* ---- tour (Home arrival) / roam (everywhere else): bother things ---- */
      mood = '';
      if (!job) {
        if (mode === 'tour' && tourLeft <= 0) mode = 'home';
        else if (startJob()) { if (mode === 'tour') tourLeft--; }
        else if (mode === 'tour') mode = 'home';
        else { act = 'stand'; zTarget = 0; pauseUntil = now + 500; }
      }
      if (job) {
        const el = job.el;
        const r = el.getBoundingClientRect();
        if (!el.isConnected || el.offsetParent === null || r.bottom < 100 || r.top > innerHeight - 100) { job = null; }
        else {
          const sp = spotFor(job, r, sc(z));
          sp.x = clamp(sp.x, 28 * U, innerWidth - 28 * U);
          sp.y = clamp(sp.y, 90 + 140 * U * sc(z) * 0.95, innerHeight - 6);
          if (phase === 'go') {
            act = 'run';
            const dx = sp.x - x, dy = sp.y - y, dist = Math.hypot(dx, dy);
            if (!leg.d0) leg.d0 = Math.max(dist, 1);
            const burst = 0.85 + 0.3 * Math.sin(t * 7.3);
            const step = Math.min(dist, 620 * burst * dt);
            if (dist > 0.01) {
              x += (dx / dist) * step + Math.sin(t * 40) * 0.6;
              y += (dy / dist) * step;
            }
            if (Math.abs(dx) > 8) face = dx > 0 ? 1 : -1;
            const prog = clamp(1 - dist / leg.d0, 0, 1);
            zTarget = leg.z0 + (job.zt - leg.z0) * prog + leg.bump * Math.sin(Math.PI * prog);
            z = clamp(zTarget, 0, 1);       // follows the path exactly, not eased
            if (dist < 14) { phase = 'do'; doUntil = now + (DUR[job.act] ?? 2) * 1000; fxNext = now + 380; face = sp.face; startFx(job); }
          } else {
            act = job.act;
            const k = Math.min(1, dt * 9);
            x += (sp.x - x) * k; y += (sp.y - y) * k;
            face = sp.face;
            zTarget = Math.min(job.zt, 0.2);
            const edge = job.side === 1 ? r.left : r.right;
            reach = { dx: Math.abs(edge - x) / (U * sc(z)) - SHX[1], dy: 6 };
            if (now > fxNext) {
              fxNext = now + (job.act === 'knock' ? 340 : job.act === 'poke' ? 420 : 520);
              if (job.act === 'knock' || job.act === 'poke' || job.act === 'stomp' || job.act === 'hop') wiggle(job.el, job.kind, 0.8);
            }
            if (now > doUntil) { lastKind = job.kind; job = null; pauseUntil = now + rnd(120, 420); }
          }
        }
      }
    }

    if (!wantProf && profOn) {
      profOn = false;
      if (now - profSince > 3000 && zoomT < 0 && !react) { sayKey('profbye', true, 2600); pauseUntil = now + 400; }
    }

    // joy = dancing at the View projects button, or the celebration right after clicking it
    setJoy(zoomT >= 0 || act === 'dance');

    // depth eases toward its target, except mid-run where it follows the path
    if (!(job && phase === 'go' && zoomT < 0)) z += (zTarget - z) * Math.min(1, dt * 4.5);
    const s = sc(z);

    // keep him inside the window
    x = clamp(x, -200, innerWidth + 200);
    y = clamp(y, 0, innerHeight + 40);

    /* ---------- pose + face ---------- */
    if (act !== lastAct) { snap = { ...cur }; blendT = 0; lastAct = act; nextLook = 0; }
    blendT += dt;
    const tgt = poseFor(act, t, reach);
    cur = calm ? tgt : mixPose(snap, tgt, smooth(Math.min(1, blendT / 0.26)));
    apply(cur);

    let want = zoomT >= 0 || now < calmBeamUntil ? 'beam' : now < lockUntil ? lockLook : lookName;
    if (zoomT < 0 && now >= lockUntil && now >= calmBeamUntil) {
      const pool = POOL[act] ?? POOL.stand;
      if (now > nextLook || !EX[lookName]) {
        nextLook = now + pool[1] * 1000 * rnd(0.8, 1.25);
        let n = pick(pool[0]); if (n === lookName && pool[0].length > 1) n = pool[0][(pool[0].indexOf(n) + 1) % pool[0].length];
        want = n;
      }
    }
    setLook(want);

    puddleAmt = act === 'beg' ? Math.min(1, puddleAmt + dt / 9) : Math.max(0, puddleAmt - dt / 1.5);
    puddle.setAttribute('rx', (puddleAmt * 34).toFixed(1));

    /* ---------- on screen ---------- */
    let px = x, py = y, scale = s, blur = z > 0.12 ? z * 3.6 : 0, op = 1 - 0.18 * z;
    if (zoomT >= 0) {
      const tt = (now - zoomT) / 1000;
      if (tt < 0.6) zoomF = easeOutBack(tt / 0.6);
      else if (tt < 2.9) zoomF = 1;
      else if (tt < 3.55) zoomF = 1 - smooth((tt - 2.9) / 0.65);
      else { zoomF = 0; zoomT = -1; if (pending) { const p = pending; pending = null; enter(p); } else if (page === 'home') { mode = 'home'; } }
      face = 1;
      const sFull = (0.6 * Math.min(innerWidth, innerHeight)) / (50 * U);
      const lnS = Math.log(s) + (Math.log(sFull) - Math.log(s)) * zoomF;
      scale = Math.exp(lnS);
      const hx0 = x, hy0 = y - (FEET_Y - HEAD_Y) * s;
      const hx = hx0 + (innerWidth / 2 - hx0) * Math.min(1, zoomF), hy = hy0 + (innerHeight * 0.48 - hy0) * Math.min(1, zoomF);
      px = hx - (HEAD_X - FEET_X) * 0 - 0; py = hy;
      root.style.transform = `translate(${hx - HEAD_X * scale}px, ${hy - HEAD_Y * scale}px) scale(${scale})`;
      blur = 0; op = 1;
      root.classList.toggle('zoomed', zoomF > 0.3);
      dim.style.opacity = String(Math.min(1, Math.max(0, zoomF)));
      bubble.classList.remove('show');
    } else {
      if (zoomF !== 0) { zoomF = 0; dim.style.opacity = '0'; }
      root.classList.remove('zoomed');
      root.style.transform = `translate(${x - FEET_X * s}px, ${y - FEET_Y * s}px) scale(${s})`;
    }
    root.style.filter = blur > 0 ? `blur(${(Math.round(blur * 4) / 4).toFixed(2)}px)` : '';
    root.style.opacity = String(op);
    root.style.setProperty('--face', String(face));
    shadow.setAttribute('opacity', String(clamp(1 - z * 0.8, 0.2, 1)));

    // speech bubble rides above his head (hidden when he is far away)
    if (zoomT < 0 && bubble.classList.contains('show') && z < 0.6) {
      const headTop = y - (FEET_Y - HEAD_Y + 36 * U) * s + cur.hy * U * s;
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight, bx = x - bw / 2;
      const shift = Math.max(8 - bx, 0) - Math.max(bx + bw - (innerWidth - 8), 0);
      let ax = x + shift, ab = Math.max(bh + 8, headTop), sideCls = '';

      // Never cover the hero buttons: when he stands under them, the bubble moves beside his head instead of above it
      if (ctaEl && cta && cta.width > 0) {
        let l = cta.left, t = cta.top, r = cta.right, b = cta.bottom;
        ctaEl.parentElement?.querySelectorAll<HTMLElement>('a,button').forEach((el) => {
          const q = el.getBoundingClientRect();
          if (q.width > 0 && Math.abs(q.top - cta.top) < 80) { l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
        });
        const gap = 6;
        if (ax + bw / 2 > l - gap && ax - bw / 2 < r + gap && ab > t - gap && ab - bh < b + gap) {
          const off = 34 * U * s + 14;
          const headMid = y - (FEET_Y - HEAD_Y) * s;
          ab = Math.min(innerHeight - 8, Math.max(headMid + bh / 2, b + gap + bh));
          if (x + off + bw <= innerWidth - 8) { ax = x + off + bw / 2; sideCls = 'side-r'; }
          else { ax = x - off - bw / 2; sideCls = 'side-l'; }
        }
      }
      bubble.classList.toggle('side-r', sideCls === 'side-r');
      bubble.classList.toggle('side-l', sideCls === 'side-l');
      bubble.style.setProperty('--sx', `${sideCls ? 0 : shift}px`);
      bubble.style.translate = `${ax}px ${ab}px`;
    } else if (z >= 0.6) bubble.classList.remove('show');
    void px; void py; void danceSpin;
  }
  requestAnimationFrame(frame);

  return { setPage };
}
