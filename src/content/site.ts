// ─── Dotty Bobbin: the words on the site ───────────────────────────────────────────────
// Everything you might want to reword lives in THIS file: business details, the menu, the
// home-page copy, the About text and the placeholders. Classes, retreats, events and
// products are NOT here — they come live from the Wix dashboard.
//
// To change a sentence: edit it below, then rebuild and release (see README.md).

export const BUSINESS = {
  name: "Dotty Bobbin",
  owner: "Saskia Struthers",
  email: "dottybobbin@icloud.com",
  // Left off the site on purpose. To show it, put the number here and set showPhone to true.
  phone: "07703 854647",
  showPhone: false,
  address: ["Felcote", "Felden Lane", "Hemel Hempstead", "HP3 0BA"],
  hours: "Monday to Friday, 9am – 10pm",
  // Used for the small map on the Contact page.
  mapQuery: "Felden Lane, Hemel Hempstead HP3 0BA",
};

/** The main menu, in order. `href` is the page address. */
export const NAV = [
  { label: "Classes", href: "/services" },
  { label: "Retreats & Events", href: "/events" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  // Later: digital patterns sold on Payhip. Uncomment and paste the Payhip link.
  // { label: "Patterns", href: "https://payhip.com/..." },
];

export const HOME = {
  kicker: "Sewing classes & retreats · Felden, Hemel Hempstead",
  heroTitleBefore: "Sewing ",
  heroTitleEmphasis: "is",
  heroTitleAfter: " for all.",
  heroText:
    "Friendly sewing classes and retreats at my home in Felden, Hemel Hempstead. Small groups, all abilities, and the kettle's always on.",
  heroButton: "Book a class",

  classesTitle: "Sewing classes",
  classesText: "Weekly small-group classes for all abilities, or a private one-to-one.",

  retreatsTitle: "Retreats & Days Out",
  retreatsText:
    "Two-day sewing retreats at my home, and the occasional day out – like a tour of Savile Row's tailoring houses.",

  shopTitle: "From the Studio Shop",
  // The shop category whose products appear on the home page (its address on /category/...).
  shopCategorySlug: "haberdashery",
  shopText: "A small selection of the notions and kits I use in class, so you can carry on sewing at home.",

  meetTitle: "Meet Saskia",

  contactTitle: "Get in Touch",
  contactText: "Questions about a class or retreat? Send me a message and I'll get back to you.",
  contactButton: "Email me",
};

// ─── Saskia's own words ─────────────────────────────────────────────────────────────────
// Paste her text exactly as she wrote it. One string per paragraph.
// While a list is empty the site shows a clearly marked placeholder instead.
export const MEET_SASKIA: string[] = [];
export const ABOUT: string[] = [];

// ─── Reviews ────────────────────────────────────────────────────────────────────────────
// The Google reviews widget goes here later. Paste the widget's embed code as one string.
// While empty, the home page shows a placeholder box (only real reviews, never invented ones).
export const REVIEWS_EMBED_HTML = `<!-- Elfsight Google Reviews -->
<script src="https://elfsightcdn.com/platform.js" async></script>
<div class="elfsight-app-b6ecb023-1545-4c68-a8f6-fe6fb833e140" data-elfsight-app-lazy></div>`;

// ─── Policies ───────────────────────────────────────────────────────────────────────────
// The footer links to /policies. One entry per policy; while empty the page says they're coming.
export const POLICIES: { title: string; paragraphs: string[] }[] = [];
