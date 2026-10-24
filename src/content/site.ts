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
  facebook: "https://www.facebook.com/dottybobbin1/",
  // Used for the small map on the Contact page.
  mapQuery: "Felden Lane, Hemel Hempstead HP3 0BA",
};

/** The main menu, in order. `href` is the page address. */
export const NAV = [
  { label: "Classes", href: "/services" },
  { label: "Retreats & Events", href: "/events" },
  { label: "Shop", href: "/shop" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  // Later: digital patterns sold on Payhip. Uncomment and paste the Payhip link.
  // { label: "Patterns", href: "https://payhip.com/..." },
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

  contactTitle: "Get in Touch",
  contactText: "Questions about a class or retreat? Send me a message and I'll get back to you.",
  contactButton: "Email me",
};

/** Shown on the shop and every product page. Shop orders are collected, never posted. */
export const SHOP_COLLECTION_NOTE =
  "Collection only: there's no postage. Orders are collected from Felcote, Felden Lane, Hemel Hempstead HP3 0BA.";

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
// Saskia's terms & conditions, from her SimplyBook site (24 Oct 2026). Verbatim except two
// mentions of SimplyBook.me, reworded for this site: section intro and 9. Data and Privacy.
export const POLICIES: { title: string; paragraphs: string[] }[] = [
  {
    title: "Dotty Bobbin – Additional Terms & Conditions for Sewing Classes",
    paragraphs: [
      "These additional terms apply to all sewing classes, workshops, and private lessons booked through the Dotty Bobbin website. By making a booking, you agree to these terms.",
    ],
  },
  {
    title: "1. Booking and Payment",
    paragraphs: [
      "Full payment is required at the time of booking to secure your place. Spaces are limited and allocated on a first-come, first-served basis. Your booking is confirmed once payment has been received and you have been sent an email confirmation.",
    ],
  },
  {
    title: "2. Cancellations and Rescheduling",
    paragraphs: [
      "All bookings are non-refundable. If you need to change your booking, rescheduling requests made at least 24 hours before your class will be accommodated where possible, subject to availability. Cancellations or rescheduling requests made less than 24 hours before the start time, or non-attendance without notice, cannot be rescheduled and no refund will be given.",
      "If Dotty Bobbin needs to cancel or reschedule a class, you will be offered a full refund or an alternative date.",
    ],
  },
  {
    title: "3. Arriving for Class",
    paragraphs: [
      "Please arrive a few minutes early so you can settle in and get set up. If you are running late, please let us know — we will do our best to help you catch up, but missed time cannot be made up or refunded.",
    ],
  },
  {
    title: "4. Use of Equipment and Machines",
    paragraphs: [
      "All sewing equipment and machines provided remain the property of Dotty Bobbin. You are responsible for using any equipment safely and with care. Any deliberate damage or misuse may result in a charge to cover the cost of repair or replacement.",
    ],
  },
  {
    title: "5. Health and Safety",
    paragraphs: [
      "Please follow all safety instructions given during your session, particularly when using sewing machines, irons, or sharp tools. Dotty Bobbin cannot accept liability for injuries resulting from failure to follow safety guidance.",
    ],
  },
  {
    title: "6. Personal Belongings",
    paragraphs: [
      "Please keep personal belongings safe during your class. Dotty Bobbin cannot accept responsibility for any items that are lost or damaged on the premises.",
    ],
  },
  {
    title: "7. Photography and Social Media",
    paragraphs: [
      "We occasionally photograph classes for use on social media and promotional materials. If you would prefer not to be included, please let us know at the start of your session.",
    ],
  },
  {
    title: "8. Behaviour and Conduct",
    paragraphs: [
      "Our classes are designed to be friendly, inclusive, and supportive. We reserve the right to refuse or cancel a booking for anyone whose behaviour disrupts or disrespects others in the group.",
    ],
  },
  {
    title: "9. Data and Privacy",
    paragraphs: [
      "Your personal details are used solely for managing your bookings and communicating with you about Dotty Bobbin services. Your information will never be shared with third parties, except as required by law or as part of the website's booking and payment systems.",
    ],
  },
  {
    title: "10. Contact",
    paragraphs: [
      "If you have any questions about your booking, please get in touch:",
      "Email: dottybobbin@icloud.com Facebook: facebook.com/dottybobbin1",
    ],
  },
];
