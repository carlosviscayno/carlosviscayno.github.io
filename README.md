# Carlos Viscayno — Portfolio (Astro + Tailwind)

An album-style portfolio. Pages turn like an album (arrows, swipe, keyboard ← →, or the menu).

---

## ✏️ How to change a picture (no coding needed)

Every picture on the site comes from a folder inside **`src/images`**.

| Folder | What it controls |
|---|---|
| `src/images/profile` | Your photo on the cover |
| `src/images/logofolio` | The logo grid (add as many as you like) |
| `src/images/branding/cash-3-0` | Cash 3.0 pictures |
| `src/images/branding/elite-cafe` | Elite Café brand pictures |
| `src/images/print/cebcon-bch` | CEBCON BCH merchandise |
| `src/images/print/holidays` | Holidays posters |
| `src/images/print/events` | Event tickets and cups |
| `src/images/print/menu` | Menu |
| `src/images/print/brochures` | Brochures |
| `src/images/print/flyers` | Flyers |

**To swap pictures:**
1. Open the folder you want.
2. **Delete the grey/pastel placeholder files** (they're named `01-placeholder.svg`, etc.).
3. **Drag in your own pictures** (`.jpg`, `.png`, `.webp`).
4. Done. The site shows them in alphabetical order, so name them `01.jpg`, `02.jpg`, `03.jpg`… to control the order. The first picture in a print folder becomes the card's cover.

You can add or remove pictures freely — the page adjusts by itself.

Tips: pictures around 1600 px wide, under 500 KB each, keep the site fast. Logos look best as square images.

## ✏️ How to change text

All text (about, descriptions, job history, contact details) is in **`src/data/site.ts`**. Edit the words between the quote marks and save.

To add a **new print project**: copy one block inside `printProjects`, give it a new `id`, a `category` (must match one in `printCategories`) and a `folder` name in `imagesIn('print/your-folder')`, then create that folder under `src/images/print/` and drop pictures in.

---

## ▶️ Run it

You need [Node.js](https://nodejs.org) 18+ installed once. Then, in this folder:

```bash
npm install
npm run dev      # opens a live preview at http://localhost:4321
npm run build    # creates the final site in the "dist" folder
```

To publish on GitHub Pages (https://carlos-viscayno.github.io/), upload the contents of `dist` (or use the Astro GitHub Pages workflow).

## What's inside

- **Design system:** colours, pill buttons, 28px pastel cards, type scale and shadows follow `DESIGN-miro.md` (tokens in `src/styles/global.css`). The Miro yellow is kept for the monogram, badges and one contact card, as the guide says. Font: DM Sans (Google Fonts) stands in for Roobert PRO, which is a licensed font.
- **Interactive UI:** pill tabs (Branding), filter pills (Print), grid-size slider (Logofolio), dark-mode toggle switch, accordions (About), side drawer + image carousel (project details), lightbox modal, radio buttons, checkbox, text fields, dynamic form field (shows "What do you need?" only for project inquiries), toast messages, hover/press micro-interactions.
- **Accessibility:** keyboard navigation, focus rings, reduced-motion support.
