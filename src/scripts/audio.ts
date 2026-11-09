// Background music with two tracks that crossfade:
//   calm  -> Pufino, "Sentimental"  (plays all the time)
//   joy   -> Aylex, "Trendy"        (takes over while the mascot is dancing / celebrating)
//
// The mascot announces his mood with a window event ("mascot:mood", detail: { joy: boolean }), which keeps this file and
// mascot.ts independent. When the joy ends, Aylex lingers for a moment (so the music does not flicker when the cursor
// slips off the button for a second) and then Pufino fades back in. Each track remembers where it was, like a game
// soundtrack, so coming back to Pufino continues the song instead of restarting it.
//
// Browsers never allow sound before the visitor does something, so the music starts on the first tap / click / key press
// anywhere on the page (unless they muted it last time). The speaker button in the nav switches it on and off and the
// choice is remembered. Music pauses by itself when the tab is hidden.
//
// Files live in src/audio (128 kbps, loudness-matched so switching tracks never jumps in volume).
import calmUrl from '../audio/pufino-sentimental.mp3?url';
import joyUrl from '../audio/aylex-trendy.mp3?url';

const AC: typeof AudioContext | undefined =
  typeof window !== 'undefined' ? window.AudioContext ?? (window as any).webkitAudioContext : undefined;

const VOLUME = 0.85;        // overall loudness, 0 to 1 (the files are already mastered quietly for background use)
const EDGE_FADE = 3;        // seconds: each track fades out at its end and fades in at its start, so the loop is smooth
const JOY_HOLD = 1800;      // ms the joyful track lingers after the mascot calms down
const STORE = 'portfolio-sound'; // localStorage key, holds "on" or "off"

type Mode = 'calm' | 'joy';
interface Track { el: HTMLAudioElement; gain: GainNode; offAt: number }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (w: number) => w * w * (3 - 2 * w);

export interface Soundtrack { start(): Promise<boolean>; stop(): void; readonly playing: boolean }

export function createSoundtrack(btn: HTMLElement): Soundtrack {
  const dead: Soundtrack = { start: async () => false, stop() {}, playing: false };
  if (!AC) { btn.hidden = true; return dead; }

  let ctx: AudioContext | null = null;
  let tracks: Record<Mode, Track> | null = null;
  let timer = 0, playing = false, mode: Mode = 'calm', holdTimer = 0;

  const saved = () => { try { return localStorage.getItem(STORE); } catch { return null; } };
  const save = (v: 'on' | 'off') => { try { localStorage.setItem(STORE, v); } catch { /* private mode: fine */ } };

  // built once, on the first user gesture
  function build() {
    const c = (ctx = new AC!());
    const make = (url: string): Track => {
      const el = new Audio();
      el.src = url; el.loop = true; el.preload = 'auto';
      el.setAttribute('playsinline', '');
      const gain = c.createGain();
      gain.gain.value = 0;
      c.createMediaElementSource(el).connect(gain);   // going through Web Audio is what makes volume fades work on iPhones too
      gain.connect(c.destination);
      return { el, gain, offAt: 0 };
    };
    tracks = { calm: make(calmUrl), joy: make(joyUrl) };
  }

  // runs ten times a second: blends the volumes, plays/pauses the right element
  function tick() {
    if (!ctx || !tracks || document.hidden) return;
    const now = ctx.currentTime, wall = performance.now();
    let allQuiet = true;
    for (const name of ['calm', 'joy'] as Mode[]) {
      const t = tracks[name], el = t.el;
      const want = playing && mode === name;

      // fade at the very start and end of the song so the loop point is never a hard cut
      let edge = 1;
      const d = el.duration;
      if (Number.isFinite(d) && d > EDGE_FADE * 2) edge = smooth(clamp(Math.min(el.currentTime, d - el.currentTime) / EDGE_FADE, 0, 1));

      t.gain.gain.setTargetAtTime(want ? VOLUME * edge : 0, now, want ? 0.5 : playing ? 0.55 : 0.2);

      if (want) {
        t.offAt = 0;
        if (el.paused) el.play().catch(() => { /* not allowed yet: the next gesture will do it */ });
      } else if (!el.paused) {
        if (!t.offAt) t.offAt = wall;
        if (wall - t.offAt > 3000) { el.pause(); t.offAt = 0; }   // fully faded: stop it (it keeps its place)
      }
      if (!el.paused) allQuiet = false;
    }
    if (!playing && allQuiet) { clearInterval(timer); timer = 0; void ctx.suspend(); }
  }

  /* ───────── controls ───────── */
  function paint(state: 'idle' | 'on' | 'off') {
    btn.classList.toggle('is-playing', state === 'on');
    btn.classList.toggle('is-muted', state === 'off');
    btn.setAttribute('aria-pressed', String(state === 'on'));
    btn.setAttribute('aria-label', state === 'on' ? 'Mute background music' : 'Play background music');
    btn.title = state === 'on' ? 'Music on. Click to mute' : 'Play calming music';
  }

  async function start(): Promise<boolean> {
    if (playing) return true;
    try {
      if (!ctx) build();
      const c = ctx!, tr = tracks!;
      await c.resume();
      if (c.state !== 'running') return false;         // the browser still says no: wait for a better gesture
      // Both elements get "unlocked" inside this gesture (iOS insists), the unwanted one is paused straight away.
      const first = tr[mode].el.play();
      const other = tr[mode === 'calm' ? 'joy' : 'calm'].el;
      other.play().then(() => { if (other !== tr[mode].el) other.pause(); }).catch(() => {});
      await first;
      playing = true;
      if (!timer) timer = window.setInterval(tick, 100);
      tick();
      paint('on');
      return true;
    } catch { return false; }
  }

  function stop() {
    if (!playing) return;
    playing = false;       // tick() fades everything out, pauses the elements and suspends the audio engine
    paint('off');
  }

  // the nav button
  btn.addEventListener('click', async () => {
    if (playing) { stop(); save('off'); }
    else if (await start()) save('on');
  });

  // the mascot's mood: joy swaps the track at once, calm waits a moment
  window.addEventListener('mascot:mood', (e) => {
    const joy = !!(e as CustomEvent<{ joy: boolean }>).detail?.joy;
    clearTimeout(holdTimer);
    if (joy) mode = 'joy';
    else holdTimer = window.setTimeout(() => { mode = 'calm'; }, JOY_HOLD);
  });

  // start on the first gesture, unless they muted it last time
  if (saved() === 'off') paint('off');
  else {
    paint('idle');
    const events = ['click', 'touchend', 'keydown'] as const;
    const first = async (e: Event) => {
      if (btn.contains(e.target as Node)) return;      // the button handles its own clicks
      if (await start()) events.forEach((n) => document.removeEventListener(n, first, true));
    };
    events.forEach((n) => document.addEventListener(n, first, true));
  }

  // be polite: no music while the tab is in the background
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !tracks || !playing) return;
    if (document.hidden) { tracks.calm.el.pause(); tracks.joy.el.pause(); void ctx.suspend(); }
    else void ctx.resume();                            // tick() starts the right track again
  });

  return { start, stop, get playing() { return playing; } };
}
