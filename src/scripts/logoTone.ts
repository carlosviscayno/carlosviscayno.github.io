// Logofolio: ONE solid backdrop colour behind every logo card, so the whole grid looks the same.
// No per-logo decisions: every card in #logo-grid gets the same colour.
//
// To change the look, edit this one value (darker = more contrast for white/pale logos, lighter = cleaner look).
const LOGO_BG = '#ffffff';

// Light-coloured logos (white, pale yellow...) would vanish on a white card, so every logo gets a soft shadow that
// follows its own shape (transparent PNG/SVG logos are lifted off the card). Make the numbers bigger for a stronger lift.
const LOGO_SHADOW = 'drop-shadow(0 0 1px rgba(0,0,0,.45)) drop-shadow(0 3px 5px rgba(0,0,0,.28))';
const CARD_SHADOW = '0 8px 20px -10px rgba(0,0,0,.28)';

// Outline colours, repeating in this order around the grid. They are the same pastel colours as the cards on the
// About timeline (yellow-soft, rose-light, orange-light, teal-light, coral-light). The site's own colour is used
// when it exists; the hex after it is the fallback. To change the outline thickness, edit OUTLINE_WIDTH.
const OUTLINE_WIDTH = '4px';
const OUTLINES = [
  'var(--color-yellow-soft, #fff4c4)',
  'var(--color-rose-light, #fde0f0)',
  'var(--color-orange-light, #ffe6cd)',
  'var(--color-teal-light, #c3faf5)',
  'var(--color-coral-light, #ffc6c6)',
];

export function initLogoTone() {
  const grid = document.getElementById('logo-grid');
  if (!grid || document.getElementById('logo-checker-style')) return;

  // One rule for every card (the direct children of #logo-grid). The id selector outranks the cards' own
  // background classes, so it wins without touching your markup.
  const style = document.createElement('style');
  style.id = 'logo-checker-style';
  const outlines = OUTLINES.map((c, i) => `#logo-grid > :nth-child(${OUTLINES.length}n + ${i + 1}) { border-color: ${c}; }`).join('\n');
  style.textContent =
    `#logo-grid > * { background: ${LOGO_BG}; border-style: solid; border-width: ${OUTLINE_WIDTH}; box-shadow: ${CARD_SHADOW}; }\n` +
    `#logo-grid img { filter: ${LOGO_SHADOW}; }\n${outlines}`;
  document.head.append(style);
}