// ─── Dotty Bobbin: the policy pages ────────────────────────────────────────────────────────
// Saskia's own wording, from her final "Website policies" PDF (11 Nov 2026). One entry per page; each
// is shown at /<slug> and linked from the footer. Reword freely, then rebuild and release.
//
// A block is an optional heading, paragraphs, a bulleted list, then any paragraphs after it. The email
// address and phone number are turned into links wherever they appear.

/** `paragraphs` come before the list, `after` below it. */
export type PolicyBlock = { heading?: string; paragraphs?: string[]; bullets?: string[]; after?: string[] };
export type Policy = {
  slug: string;
  /** The page heading and the footer link text. */
  title: string;
  /** The footer link text when shorter than the title. */
  shortTitle?: string;
  /** Wording for the page's SEO description (entered in the dashboard; see SiteLayout). */
  description: string;
  lastUpdated: string;
  blocks: PolicyBlock[];
};

const UPDATED = "November 2026";

export const TERMS: Policy = {
  slug: "terms",
  title: "Terms & Conditions",
  description: "Dotty Bobbin's terms and conditions for sewing classes, retreats, events, shop orders, gift cards and digital patterns.",
  lastUpdated: UPDATED,
  blocks: [
    {
      heading: "1. Who we are",
      paragraphs: [
        "Dotty Bobbin is the trading name of Saskia Struthers, a sole trader. Address: Felcote, Felden Lane, Hemel Hempstead, Hertfordshire HP3 0BA. Email: dottybobbin@icloud.com. Phone: 07703 854647. In these terms “we”, “us” and “Dotty Bobbin” mean Saskia Struthers trading as Dotty Bobbin, and “you” means the person making the booking or purchase.",
      ],
    },
    {
      heading: "2. About these terms",
      paragraphs: [
        "These terms apply to everything you book or buy from dottybobbin.com, or arrange with us directly: sewing classes, private lessons, retreats, events and days out, shop items, gift cards and digital patterns. By booking or buying you agree to them. Please also read our Refund & Cancellation Policy, Delivery & Collection Policy and Privacy Policy, which form part of these terms. The Portfolio Course has its own course agreement, which applies alongside these terms; if the two differ, the course agreement wins.",
      ],
    },
    {
      heading: "3. Booking and payment",
      paragraphs: [
        "Prices are in pounds sterling. Full payment is due at the time of booking unless we have agreed otherwise in writing (for example paying in person, or by invoice). Places are limited and given on a first-come, first-served basis. Your booking or order is confirmed when payment has been received and we have emailed you a confirmation. Payments are taken securely through Wix Payments; we never see or store your full card details.",
      ],
    },
    {
      heading: "4. Classes and private lessons",
      paragraphs: [
        "Please arrive a few minutes early so you can settle in and get set up. If you are running late, please let us know. We will help you catch up where we can, but missed time can't be made up or refunded. You are welcome to bring your own sewing machine and your own shop-bought patterns. Sewing machine hire (£5 a session) and project packs can be added when you book, and follow the same cancellation rules as the class they are booked with.",
      ],
    },
    {
      heading: "5. Retreats, events and days out",
      paragraphs: [
        "Retreats take place at our home in Felden. Coffee, tea and biscuits are provided; nothing else is included in the retreat price. Please bring your own sewing machine, fabric and sewing kit. If you need a machine, you can ask to reserve one of ours, and you can ask to buy fabric from us; both are subject to availability and must be requested before the retreat. Days out and social events may involve other venues, transport or tickets bought from third parties on your behalf; where they do, those parts are subject to the third party's own terms.",
      ],
    },
    {
      heading: "6. Cancellations and changes",
      paragraphs: [
        "Our Refund & Cancellation Policy explains what happens if you need to cancel or change a booking or order, and what happens if we have to.",
      ],
    },
    {
      heading: "7. Shop orders",
      paragraphs: [
        "Shop items are for collection only; we do not post. See our Delivery & Collection Policy. Colours of fabric and notions may look slightly different on screen.",
      ],
    },
    {
      heading: "8. Gift cards",
      paragraphs: [
        "Gift cards can be used towards classes, retreats, events and shop items on dottybobbin.com. They can't be exchanged for cash. Gift cards are valid for 12 months from the date of purchase; any balance left after that expires. Please keep your gift card code safe; we can't replace a code that has been used by someone else.",
      ],
    },
    {
      heading: "9. Digital patterns",
      paragraphs: [
        "When you buy a digital pattern you receive a personal licence to download, print and use it to sew items for yourself and as gifts. You may not copy, share, resell or publish the pattern files or instructions, in whole or in part. You may also sell small numbers of finished items you have sewn yourself from the pattern, as long as you credit Dotty Bobbin as the pattern designer (for example “Made from a Dotty Bobbin pattern” on the listing or label). Factory or large-scale production is not allowed without our written permission. The design, instructions and images remain the property of Dotty Bobbin.",
      ],
    },
    {
      heading: "10. Equipment and machines",
      paragraphs: [
        "All sewing machines and equipment we provide remain the property of Dotty Bobbin. Please use them safely and with care. We may charge for repair or replacement if equipment is damaged deliberately or through misuse.",
      ],
    },
    {
      heading: "11. Health and safety",
      paragraphs: [
        "Please follow the safety instructions given in class, particularly when using sewing machines, irons and sharp tools. Please tell us before your session about anything we should know to keep you safe, such as access needs.",
      ],
    },
    {
      heading: "12. Personal belongings",
      paragraphs: [
        "Please look after your belongings while you are with us. We can't accept responsibility for items lost or damaged on the premises unless this is caused by our negligence.",
      ],
    },
    {
      heading: "13. Photographs",
      paragraphs: [
        "We sometimes take photos in class for social media and promotion. If you would prefer not to be included, just tell us at the start of your session. We only show photos of your own work with your permission.",
      ],
    },
    {
      heading: "14. Behaviour",
      paragraphs: [
        "Our classes and events are friendly, inclusive and supportive. We may refuse or cancel a booking for anyone whose behaviour disrupts or disrespects others in the group.",
      ],
    },
    {
      heading: "15. Our responsibility to you",
      paragraphs: [
        "Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot be limited by law, and nothing affects your statutory rights as a consumer. Otherwise, we are not responsible for losses that were not foreseeable, and our total liability to you for any booking or order is limited to the price you paid for it.",
      ],
    },
    {
      heading: "16. Your personal information",
      paragraphs: ["We use your personal information as described in our Privacy Policy."],
    },
    {
      heading: "17. Changes to these terms",
      paragraphs: [
        "We may update these terms from time to time. The version on the website when you book or buy is the one that applies to that booking or purchase.",
      ],
    },
    {
      heading: "18. Law",
      paragraphs: [
        "These terms are governed by the law of England and Wales, and the courts of England and Wales can deal with any dispute.",
      ],
    },
    {
      heading: "19. Contact",
      paragraphs: ["If you have any questions, please email dottybobbin@icloud.com or call 07703 854647."],
    },
  ],
};

export const REFUNDS: Policy = {
  slug: "refunds",
  title: "Refund & Cancellation Policy",
  shortTitle: "Refunds & Cancellations",
  description: "What happens if you need to cancel or change a Dotty Bobbin class, retreat, shop order, gift card or digital pattern, and what happens if we do.",
  lastUpdated: UPDATED,
  blocks: [
    {
      paragraphs: [
        "This policy explains what happens if you need to cancel or change something you've booked or bought from Dotty Bobbin (Saskia Struthers), and what happens if we need to. It doesn't affect your legal rights as a consumer.",
      ],
    },
    {
      heading: "Sewing classes and private lessons",
      paragraphs: [
        "Classes and lessons are booked for a specific date, so the 14-day cancellation period that applies to some online purchases does not apply to them.",
      ],
      bullets: [
        "All class bookings are non-refundable.",
        "If you need to change your booking, you can reschedule up to 24 hours before your class, subject to availability. You can do this from your account on the website or by contacting us.",
        "Changes made less than 24 hours before the start time, or not attending without notice, can't be rescheduled or refunded.",
        "Sewing machine hire and project packs booked with a class follow the same rules as the class.",
      ],
    },
    {
      heading: "Retreats, events and days out",
      paragraphs: [
        "Retreats are booked for specific dates and are non-refundable. Retreat bookings can't be rescheduled or moved to another date, whatever the notice given. If you can't attend, no refund or credit will be given. The same applies to events and days out, and to any tickets or transport we have bought from third parties on your behalf.",
      ],
    },
    {
      heading: "Portfolio Course",
      paragraphs: ["Cancellations and payments for the Portfolio Course are covered by the course agreement you accept when you book."],
    },
    {
      heading: "If we have to cancel",
      paragraphs: [
        "If we need to cancel or move a class, retreat or event, we will offer you a full refund or an alternative date, whichever you prefer.",
      ],
    },
    {
      heading: "Shop items",
      paragraphs: [
        "If you buy shop items online, you have 14 days from the day you collect them to tell us you want to cancel, for any reason. Please then return the items to us unused and in their original condition within 14 days of telling us. We will refund the price within 14 days of receiving them back. As items are collected and returned in person, there is no postage to pay. This does not apply to items cut or made to your order, or personalised for you (for example pattern folders with custom labels), unless they are faulty.",
      ],
    },
    {
      heading: "Faulty or incorrect items",
      paragraphs: [
        "If something you buy is faulty, damaged or not as described, please tell us. Within 30 days you can choose a full refund; after that we will repair or replace it, or refund you if that isn't possible. This is in line with the Consumer Rights Act 2015.",
      ],
    },
    {
      heading: "Gift cards",
      paragraphs: [
        "You can cancel a gift card purchase for a full refund within 14 days of buying it, as long as it hasn't been used. After that, gift cards can't be refunded or exchanged for cash.",
      ],
    },
    {
      heading: "Digital patterns",
      paragraphs: [
        "Digital patterns are available to download immediately. When you buy, you agree to the download starting straight away and accept that you lose your right to cancel once it has started. If a file is faulty or won't open, please contact us and we will send a replacement or give you a refund.",
      ],
    },
    {
      heading: "How to cancel or ask for a refund",
      paragraphs: [
        "Email dottybobbin@icloud.com or call 07703 854647, giving your name and what you booked or bought. Refunds are made to the original payment method within 14 days of us agreeing the refund (or, for returned shop items, of receiving them back).",
      ],
    },
  ],
};

export const DELIVERY: Policy = {
  slug: "delivery",
  title: "Delivery & Collection Policy",
  shortTitle: "Delivery & Collection",
  description: "How Dotty Bobbin shop orders are collected, and how gift cards, digital patterns and booking confirmations are delivered.",
  lastUpdated: UPDATED,
  blocks: [
    {
      heading: "Shop items: collection only",
      paragraphs: [
        "We don't post shop items, so there are no shipping charges. All orders are collected from Felcote, Felden Lane, Hemel Hempstead HP3 0BA. We will email you when your order is ready, normally within 7 days. You can collect at your next class, or at a time we arrange together. If an order hasn't been collected within 30 days, we will contact you to arrange collection or a refund.",
      ],
    },
    {
      heading: "Gift cards",
      paragraphs: [
        "Gift cards are delivered by email, to you or straight to the person you're giving it to, as soon as payment is made or on the date you choose at checkout.",
      ],
    },
    {
      heading: "Digital patterns",
      paragraphs: [
        "Digital patterns are delivered by download. You'll get a download link straight after payment, and a copy by email. Your download link can be used up to 5 times within 30 days of purchase. Please check your junk folder if the email doesn't arrive, and contact us if you have any trouble.",
      ],
    },
    {
      heading: "Classes, retreats and events",
      paragraphs: [
        "Your booking confirmation and reminders are sent by email. Classes and retreats take place at our home studio in Felden unless the event details say otherwise.",
      ],
    },
    {
      heading: "Problems with an order",
      paragraphs: ["If anything is missing or not right, please email dottybobbin@icloud.com or call 07703 854647."],
    },
  ],
};

export const PRIVACY: Policy = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  description: "How Dotty Bobbin collects, uses and looks after your personal information, and your rights over it.",
  lastUpdated: UPDATED,
  blocks: [
    {
      heading: "Who we are",
      paragraphs: [
        "Dotty Bobbin is the trading name of Saskia Struthers, Felcote, Felden Lane, Hemel Hempstead, Hertfordshire HP3 0BA. Saskia is the “data controller” responsible for your personal information. Contact: dottybobbin@icloud.com or 07703 854647.",
      ],
    },
    {
      heading: "What information we collect",
      bullets: [
        "Your name, email address, phone number and, where needed, postal address.",
        "Details of your bookings, orders, gift cards and payments (amounts and dates). Card payments are handled by Wix Payments; we never see or keep your full card details.",
        "Your website account details, if you create an account.",
        "Anything you choose to tell us, for example your sewing experience, the project you'd like to make, or access needs we should know about to keep you safe.",
        "If you apply to test a pattern: your size, measurements, sewing experience, Instagram name and message.",
        "If you sign up for our newsletter: your email address and that you've agreed to receive it.",
        "Photos taken in class, if you're happy to be included.",
        "Basic information about how you use our website, collected by cookies (see below).",
      ],
    },
    {
      heading: "Why we use it, and our legal basis",
      bullets: [
        "To manage your bookings and orders, take payment, send confirmations and reminders, and contact you about changes: because it is needed for our contract with you.",
        "To keep business and tax records: because the law requires it.",
        "To run pattern testing, keep the website secure and working, and improve our classes: because we have a legitimate interest in running the business well.",
        "To send you our newsletter and use photos you appear in: because you have agreed. You can withdraw your agreement at any time.",
      ],
      after: ["We will never sell your information or share it for other people's marketing."],
    },
    {
      heading: "Who we share it with",
      paragraphs: [
        "Only with the services that help us run Dotty Bobbin, and only as much as they need: Wix (our website, bookings, shop, payments and emails), our bank, and HMRC or an accountant for tax purposes. Wix may store data on servers outside the UK; when it does, it uses safeguards approved under UK data protection law. We may also share information if the law requires it.",
      ],
    },
    {
      heading: "How long we keep it",
      bullets: [
        "Booking, order and payment records: for at least 5 years after the 31 January Self Assessment deadline for the tax year they belong to, as HMRC requires.",
        "Your website account: until you ask us to close it.",
        "Newsletter details: until you unsubscribe.",
        "Pattern tester applications: deleted automatically 6 months after you apply.",
        "Photos: until you ask us to remove them.",
      ],
    },
    {
      heading: "Cookies",
      // Checked on the live site, 11 Nov 2026: the site's own code sets no tracking; Wix's hosting
      // adds its visitor statistics (cookie bSession), held back until a visitor accepts in the
      // Usercentrics cookie banner (dashboard › Settings › Compliance, Privacy & Cookies), which
      // leaves a round privacy button bottom-left to change the choice. Update this if a Google
      // or Facebook tag is ever added in the dashboard (Marketing Integrations).
      paragraphs: [
        "Our website is built on Wix. Wix places cookies that are needed to make the site work and keep it secure, such as keeping you signed in and remembering your basket. Wix also collects statistics about how visitors use the site, such as which pages are visited, which helps us see how the site is doing. We don't use advertising or social media tracking cookies. When you first visit, a cookie banner asks whether you're happy for these statistics cookies to be used; if you say no, only the cookies the site needs to work are used. You can change your choice at any time with the round privacy button in the bottom corner of the page. You can also block or delete cookies in your browser settings, although some parts of the site may not work without them.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can ask to see the information we hold about you, have it corrected or deleted, restrict or object to how we use it, or receive a copy to pass to someone else. Email dottybobbin@icloud.com and we'll reply within one month. Some information, such as tax records, we have to keep even if you ask us to delete it.",
      ],
    },
    {
      heading: "Complaints",
      paragraphs: [
        "If you're unhappy with how we've handled your information, please tell us first. You can also complain to the Information Commissioner's Office (ICO) at ico.org.uk or on 0303 123 1113.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: ["We may update this policy from time to time. The latest version will always be on this page."],
    },
  ],
};

/** In footer order. */
export const ALL_POLICIES: Policy[] = [TERMS, REFUNDS, DELIVERY, PRIVACY];
