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
  // Shown on the Contact page (call / text). `phoneIntl` is what the phone dials: +44 and the
  // number without its leading 0. showPhone also puts it in the footer's Find me column (the trading-name line at the very bottom always shows it).
  phone: "07703 854647",
  phoneIntl: "+447703854647",
  showPhone: false,
  address: ["Felcote", "Felden Lane", "Hemel Hempstead", "Hertfordshire HP3 0BA"],
  // Shown under the address on the Contact page. Not opening hours: Saskia isn't always in, and
  // classes run daytime and evening. (Google's hours come from her Google Business listing, not here.)
  hours: "By appointment: come at your class time, or get in touch first.",
  // The site's currency (Wix dashboard › Settings › Language & region). A gift card line sends it.
  currency: "GBP",
  facebook: "https://www.facebook.com/dottybobbin",
  // Used for the small map on the Contact page and its Get directions button.
  mapQuery: "Felden Lane, Hemel Hempstead HP3 0BA",
  // The house itself, from Google Maps (press and hold on the house, copy the two numbers). Google
  // doesn't know the name Felcote, so the map centres here; null falls back to mapQuery.
  mapPin: { lat: 51.7414768, lng: -0.4955415 } as { lat: number; lng: number } | null,
  // Google's own "Dotty Bobbin" place at the house (the ftid in its share link), so the map marks
  // it by name. "" leaves the map unmarked, centred on mapPin.
  mapPlace: { id: "0x487643ab7d141aa9:0x400371f84544235d", name: "Dotty Bobbin" },
  // The same place's Google place ID (starts "ChIJ"), which the home page's Google reviews are read
  // with. "" hides the reviews and leaves just the link to them on Google.
  googlePlaceId: "ChIJqRoUfatDdkgRXSNERfhxA0A",
};

/** The main menu, in order. `href` is the page address. */
export const NAV = [
  { label: "Classes", href: "/services" },
  { label: "Retreats & Events", href: "/events" },
  { label: "Shop", href: "/shop" },
  // The Patterns shop category (SHOP.patternsCategorySlug). Pattern testing is reached from it.
  { label: "Patterns", href: "/category/patterns" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const HOME = {
  kicker: "Sewing classes & retreats · Felden, Hemel Hempstead",
  heroTitleBefore: "Sewing ",
  heroTitleEmphasis: "is",
  heroTitleAfter: " for everyone.",
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

  reviewsTitle: "What people say",

  contactTitle: "Get in Touch",
  contactText: "Questions about a class or retreat? Send me a message and I'll get back to you.",
  contactButton: "Email me",
};

/** Shown on the shop and every product page. Shop orders are collected, never posted. */
/**
 * The pattern-testing pages (/pattern-testing). The calls for testers themselves live in the Wix
 * dashboard › CMS › Pattern tests; applications land in CMS › Tester applications.
 */
export const PATTERN_TESTING = {
  kicker: "Help shape the next pattern",
  title: "Pattern testing",
  intro:
    "Before a new pattern goes on sale I ask a few sewists to make it up first and tell me how it went: the instructions, the fit, anything that puzzled you. Testers get the pattern free and a credit when it launches. Pick a pattern below and apply.",
  emptyTitle: "Nothing to test just now",
  emptyText: "The next call for testers will appear here. Follow along on Facebook or get in touch and I'll let you know.",
  applyTitle: "Apply to test this pattern",
  applyText: "Tell me a little about you and which size you'd sew. I read every application and reply by email.",
  closedText: "Applications for this pattern have closed. Thank you to everyone who applied.",
  successText: "Thanks, your application is in. I'll be in touch by email.",
};

export const SHOP_COLLECTION_NOTE =
  "Collection only: there's no postage. Orders are collected from Felden, Hemel Hempstead.";

/**
 * The patterns part of the shop. The patterns themselves are the products in the Wix Stores
 * category with this slug (dashboard → Store Products → Categories); the words around them are here.
 */
export const SHOP = {
  // The category's address on /category/... . Also the "Patterns" link in NAV above.
  patternsCategorySlug: "patterns",
  // The door to the patterns on the Shop page.
  patternsTitle: "Sewing patterns",
  patternsText: "My own patterns as PDF downloads, sent by email. Nothing to collect.",
  patternsButton: "Browse patterns",
  // Shown at the top of the Patterns page.
  patternsNote: "Digital download: after you pay, you'll get a download link by email. Nothing is posted.",
  // The link to pattern testing at the foot of the Patterns page.
  testingTitle: "Fancy testing a pattern?",
  testingText: "Before a new pattern goes on sale I ask a few sewists to make it up first. Testers get the pattern free.",
  testingButton: "Pattern testing",
  // The link back from the Pattern testing page.
  shopLinkText: "Looking for a finished pattern? Browse the pattern shop",
};

/**
 * What each gift card amount buys, shown beside the amount on the gift card page ("£17.50 · 1 class").
 * Keyed by the amount as Wix sends it ("17.5", not "17.50"). An amount not listed shows its price only.
 */
export const GIFT_CARD_AMOUNT_LABELS: Record<string, string> = {
  "17.5": "1 class",
  "35": "2 classes",
  "70": "4 classes",
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

// The policy pages (/terms, /refunds, /delivery, /privacy-policy) are in src/content/policies.ts.
