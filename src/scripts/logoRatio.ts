// Logofolio: every logo card is a 1:1 square, whatever shape the logo itself is.
// The logo is shown whole inside its square (never cropped, never stretched).
//
// This is the ONLY place on the site that uses a fixed shape. Branding and Print Design show their
// pictures at full ratio instead (see fullRatio.ts).
//
// The grid-size slider keeps working: it only changes the column count, and the squares follow.

export function initLogoRatio() {
  const grid = document.getElementById('logo-grid');
  if (!grid) return;

  Array.from(grid.children).forEach((el) => {
    const card = el as HTMLElement;
    card.style.aspectRatio = '1 / 1';
    card.style.alignSelf = 'stretch';

    const img = card.querySelector('img');
    if (!img) return;
    img.style.objectFit = 'contain';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
  });
}
