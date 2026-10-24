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
export const MEET_SASKIA: string[] = [
  "Dotty Bobbin is everyday sewing, taught the way it actually works. I learnt at my mother’s machine at five and have been picking up the tricks ever since: no formal training, just years of making things. Small classes at my home in Hemel Hempstead, with a soft spot for vintage machines and fabrics, today’s tools and fabrics too, and no fear of the overlocker.",
];

/** Heading of the About page (Saskia's own). */
export const ABOUT_TITLE = "The story behind Dotty Bobbin";
export const ABOUT: string[] = [
  "The Dotty is for spots. I have never been able to walk past a spotty fabric, and I’m not going to start now.",
  "The sewing came from my mother, Oma, who sat me at her machine when I was five. Everything since has been learnt the way most sewing is really learnt: by making things, getting them wrong, and working out the trick that makes them go right next time. I have no formal training and I’m not sorry about that. What I have is years of everyday sewing, and a very clear memory of what it was like not to know.",
  "That’s what I teach: everyday sewing, the way it actually works. Not every rule from the old books, but the methods I use myself at my own table, because they’re quick, they hold up, and they look good. Some of them are as old as Oma’s machine; some I worked out last year.",
  "I have a soft spot for the old things. A vintage machine that still purrs, a length of fabric with a bit of history to it: bring them along, they’re very welcome here. But we work with today’s tools and today’s fabrics too. Patterns can go up on a projector, or be traced, or printed, whichever suits you; I offer the options and you choose. Overlockers are there to be used, not feared. The patterns I draft are built in Ellwand, pattern-drafting software my son built from the way I teach. Sewing is an old craft, and I love it for that; it’s also very much alive, and I teach it that way.",
  "Classes run from my home in Felden, Hemel Hempstead, in small groups, with the kettle on. Beginners leave their first session with something finished and a reason to come back. If you’ve got an Oma of your own in your past, or wish you had, you’re very welcome here.",
];

// ─── Reviews ────────────────────────────────────────────────────────────────────────────
// The Google reviews widget goes here later. Paste the widget's embed code as one string.
// While empty, the home page shows a placeholder box (only real reviews, never invented ones).
export const REVIEWS_EMBED_HTML = `<!-- Elfsight Google Reviews -->
<script src="https://elfsightcdn.com/platform.js" async></script>
<div class="elfsight-app-b6ecb023-1545-4c68-a8f6-fe6fb833e140" data-elfsight-app-lazy></div>`;

// ─── Policies ───────────────────────────────────────────────────────────────────────────
// The footer links to /policies. One entry per policy; while empty the page says they're coming.
export const POLICIES: { title: string; paragraphs: string[] }[] = [];
