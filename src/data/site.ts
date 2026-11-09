// ─────────────────────────────────────────────────────────────
//  ALL TEXT ON THE WEBSITE LIVES HERE.
//  Pictures are NOT set here — they come from the folders in src/images
//  (see README.md). Each "folder" below is a folder inside src/images.
// ─────────────────────────────────────────────────────────────
import { imagesIn } from './images';

export const site = {
  name: 'Carlos Ray Felix Viscayno',
  shortName: 'Carlos Viscayno',
  monogram: 'CV',
  role: 'Graphic Artist',
  tagline: 'Graphic Designer · Brand Identity & Digital Marketing',
  intro:
    'I am a graphic artist who turns ideas into meaningful visuals, with a love for clean design, strong concepts and thoughtful details.',
  email: 'carlosrayfelixviscayno@gmail.com',
  phone: '+63 946-533-7659',
  location: 'Tacloban City, Philippines',
  profilePhoto: imagesIn('profile')[0],
};

// ─── About page ─────────────────────────────────────────────────
export const aboutHeadline = 'Designing with the finished piece in mind.';

export const story = [
  'I am a graphic designer from Tacloban City with a degree in Graphic Arts and Printing from Eastern Visayas State University. My training spanned digital layout, silk-screening and pre-press, so I design with the printed result in mind.',
  'As a design intern, I created event branding and print materials at ELITE Café & Lounge, then built a brand guideline and vector asset library for the International Bitcoin Cash Conference at SciBiz Informatics. I value clear concepts and consistent systems.',
];

export const status = {
  label: 'Currently',
  text: 'I graduated in June 2026 and am looking to join a growing creative team.',
};

// "count" animates from 0 when the About page opens
export const stats = [
  { count: 20, suffix: '%', label: 'Faster turnaround with a shared vector library', tint: 'bg-teal-light', icon: 'layers' },
  { count: 10, suffix: '+', label: 'Brand and marketing formats at ELITE Café', tint: 'bg-orange-light', icon: 'layout' },
  { count: 6, suffix: '', label: 'Banners silk-screened for the EVSU freshmen event', tint: 'bg-rose-light', icon: 'flag' },
  { count: 2, suffix: '', label: 'Seasonal events designed from start to finish', tint: 'bg-coral-light', icon: 'calendar' },
];

// The story timeline on the About page (left to right)
export const journey = [
  { when: 'Oct 2023', title: 'The first brand', text: 'Built the colour theme and a production-ready mock-up for a conceptual energy drink.', tint: 'bg-yellow-soft' },
  { when: 'Aug – Sep 2024', title: 'Ink on the banners', text: 'Led the layout and silk-screening of 6 banners for the USWAG & COT event.', tint: 'bg-rose-light' },
  { when: 'Oct 2025 – Feb 2026', title: 'ELITE Café & Lounge', text: 'Sole design intern for the Halloween and Christmas events, menus and promos.', tint: 'bg-orange-light' },
  { when: 'Feb – Jun 2026', title: 'SciBiz Informatics', text: 'Built the Cash 3.0 brand guideline and a vector library that cut turnaround by 20%.', tint: 'bg-teal-light' },
  { when: 'Jun 2026', title: 'Graduated. What’s next?', text: 'Finished at EVSU and now looking to join a growing creative team.', tint: 'bg-coral-light' },
];

export const experience = [
  {
    role: 'Graphic Design Intern',
    company: 'SciBiz Informatics, Inc.',
    dates: 'Feb 2026 – Jun 2026',
    tint: 'bg-teal-light',
    highlights: [
      'Built the brand guideline and vector asset library for the International Bitcoin Cash Conference.',
      'Cut project turnaround by 20% with a central vector library.',
      'Produced social graphics, web banners, holiday posters and flyers for the Paytaca app and other clients.',
    ],
  },
  {
    role: 'Graphic Design Intern',
    company: 'ELITE Café & Lounge',
    dates: 'Oct 2025 – Feb 2026',
    tint: 'bg-orange-light',
    highlights: [
      'Sole design intern for the Halloween and Christmas events, creating decor, signage and branding.',
      'Designed monthly promotional posters and event tickets.',
      'Redesigned the ingredient booklets, recipe books and table menus for clearer reading.',
    ],
  },
];

export const campusProjects = [
  {
    title: 'USWAG & COT Event',
    meta: 'EVSU Graphic Arts & Printing · Aug – Sep 2024',
    tint: 'bg-rose-light',
    text: 'Led the layout and silk-screening of 6 banners and helped paint the background props, including the central eagle wings.',
  },
  {
    title: 'Advertising Mockup Project',
    meta: 'EVSU Graphic Arts & Printing · Oct 2023',
    tint: 'bg-yellow-soft',
    text: 'Created the color theme and a production-ready brand mock-up for a conceptual energy drink, ahead of a strict deadline.',
  },
];

export const education = {
  school: 'Eastern Visayas State University',
  degree: 'Bachelor of Science in Industrial Technology',
  major: 'Major in Graphic Arts and Printing',
  detail: 'Main Campus, Tacloban City · June 2026',
};

// Tool badges: a coloured lettermark stands in for each app icon
export const tools = [
  { name: 'Adobe Photoshop', abbr: 'Ps', bg: '#001e36', fg: '#31a8ff' },
  { name: 'Adobe Illustrator', abbr: 'Ai', bg: '#330000', fg: '#ff9a00' },
  { name: 'CorelDRAW', abbr: 'Cd', bg: '#2e9e49', fg: '#ffffff' },
  { name: 'Canva', abbr: 'C', bg: 'linear-gradient(135deg,#00c4cc,#7d2ae8)', fg: '#ffffff' },
];

// icon names live in components/Icon.astro
export const craft = [
  { name: 'Vector Illustration', icon: 'pen' },
  { name: 'Typography & Lettering', icon: 'type' },
  { name: 'Layout & Logo Design', icon: 'layout' },
  { name: 'Photo Retouching', icon: 'image' },
  { name: 'Pre-Press Production', icon: 'printer' },
  { name: 'Brand Asset Management', icon: 'layers' },
];

export const beyondDesign = {
  items: [
    { name: 'Gaming', icon: 'gamepad' },
    { name: 'Music', icon: 'music' },
    { name: 'Film', icon: 'film' },
    { name: 'Baking', icon: 'cake' },
  ],
  story: [
    'Away from the screen, I recharge with the things that first taught me to love making. Games showed me how much story and mood can live inside colour, type and a carefully built world. Music sets the rhythm I work to, and films keep teaching me about framing, light and patience.',
    'Baking is where it all comes together. Like design, it rewards careful measuring, a little trust in the process, and the joy of sharing something warm with the people I care about.',
  ],
};

// ─── Chapters (Index page) ──────────────────────────────────────
export const chapters = [
  {
    id: 'logofolio',
    number: '01',
    title: 'Logofolio',
    blurb: 'Logos, wordmarks and lettermarks built around clear concepts and carefully set typography.',
    tags: 'Wordmarks · Lettermarks · Typography · Brandmarks',
    tint: 'bg-rose-light',
  },
  {
    id: 'branding',
    number: '02',
    title: 'Branding',
    blurb: 'Complete brand identities for Cash 3.0 and Elite Café & Lounge, from concept to visual system.',
    tags: 'Brand Identity · Visual Systems · Concept Development',
    tint: 'bg-teal-light',
  },
  {
    id: 'print-design',
    number: '03',
    title: 'Print Design',
    blurb: 'Merchandise, posters, menus, brochures and flyers designed to be handled, worn and noticed.',
    tags: 'Merchandise · Posters & Flyers · Menus · Brochures',
    tint: 'bg-coral-light',
  },
];

export const logofolio = {
  tags: 'Logo Design / Wordmarks / Lettermarks / Typography / Brandmarks',
  images: imagesIn('logofolio'),
};

export const brandingProjects = [
  {
    id: 'cash-3-0',
    tab: 'Cash 3.0',
    title: 'Cash 3.0',
    subtitle: 'International Bitcoin Cash Conference',
    meta: [
      ['Company', 'SciBiz Informatics'],
      ['Role', 'Graphic Design Intern'],
      ['Year', '2026'],
    ],
    tint: 'bg-teal-light',
    description: [
      'At the Cash 3 Conference in Cebu City, BCH moved beyond simple transactions into the “Cash 3.0” era: from a basic payment tool to a robust, non-custodial financial layer that values utility over speculation.',
      'The brand interprets Cyber-Tropical through Modern Doodle Art, creating a vibrant, youthful and techy bazaar atmosphere. I developed it into a complete brand guideline and vector asset library, which also shaped the conference merchandise.',
    ],
    images: imagesIn('branding/cash-3-0'),
  },
  {
    id: 'elite-cafe',
    tab: 'Elite Café & Lounge',
    title: 'Elite Café & Lounge',
    subtitle: 'Brand identity',
    meta: [
      ['Industry', 'Foods & Beverage (F&B)'],
      ['Role', 'Graphic Design Intern'],
      ['Year', '2025'],
    ],
    tint: 'bg-orange-light',
    description: [
      'Elite Café is a modern dining spot in Tacloban City with a chic atmosphere and a welcoming neighborhood feel. It suits both casual hangouts and productive work sessions, and has become a favorite of locals, students and professionals.',
      'Its identity is built on a balanced palette of vibrant orange and sophisticated gray, carried across the menu, brochures, flyers and event materials.',
    ],
    images: imagesIn('branding/elite-cafe'),
  },
];

// ─── Print Design ───────────────────────────────────────────────
export const printCategories = [
  'Merchandise',
  'Posters',
  'Brand Collateral',
  'Menu',
  'Brochures',
  'Flyers',
];

export const printProjects = [
  {
    id: 'cebcon-bch',
    category: 'Merchandise',
    title: 'CEBCON BCH',
    tint: 'bg-teal-light',
    description: [
      'A cohesive merchandise line for the International Bitcoin Cash Conference in Cebu, including polo shirts, pens, notebooks, mugs, pins and lanyards.',
      'Cyber-Tropical styling, Modern Doodle Art and typography come together in a BCH green and purple palette, making blockchain technology feel approachable and interesting.',
    ],
    images: imagesIn('print/cebcon-bch'),
  },
  {
    id: 'holidays',
    category: 'Posters',
    title: 'Holidays',
    tint: 'bg-yellow-soft',
    description: [
      'A poster series for the Philippine holidays: Araw ng Kagitingan (April 9), Labor Day (May 1), Mother’s Day (second Sunday of May) and Independence Day (June 12).',
      'Each poster honors wartime heroism, national sovereignty, the local workforce, or the role of mothers in family and society.',
    ],
    images: imagesIn('print/holidays'),
  },
  {
    id: 'events',
    category: 'Brand Collateral',
    title: 'Elite Café & Lounge Events',
    tint: 'bg-orange-light',
    description: [
      'A matching set of event tickets and café cups that enrich the in-store experience and strengthen the bond with the café community.',
      'The design is clear, warm, vibrant and approachable, and stays consistent across every material so each event feels curated and memorable.',
    ],
    images: imagesIn('print/events'),
  },
  {
    id: 'menu',
    category: 'Menu',
    title: 'Elite Café & Lounge Menu',
    tint: 'bg-coral-light',
    description: [
      'A menu layout for the café and bar at Elite, bringing together cozy comfort food, hearty Filipino favorites, and a wide range of artisanal coffee and refreshing drinks.',
      'It is designed for casual diners and coffee lovers alike, from morning until late evening.',
    ],
    images: imagesIn('print/menu'),
  },
  {
    id: 'brochures',
    category: 'Brochures',
    title: 'Elite Café & Lounge Brochures',
    tint: 'bg-rose-light',
    description: [
      'Printed and digital brochures that guide guests through the café’s culinary, coffee and lounge offerings.',
      'Built on the signature orange and gray palette, they use a sleek, modern and industrial look.',
    ],
    images: imagesIn('print/brochures'),
  },
  {
    id: 'flyers',
    category: 'Flyers',
    title: 'Elite Café & Lounge Flyers',
    tint: 'bg-teal-light',
    description: [
      'Promotional flyers in vibrant orange and sophisticated gray, designed to catch attention on busy city streets.',
      'Handed out near business districts or displayed at partner spots, they act as pocket-sized invitations to the café’s modern ambiance.',
    ],
    images: imagesIn('print/flyers'),
  },
];
