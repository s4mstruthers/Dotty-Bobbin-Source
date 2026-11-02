# Dotty Bobbin website

The coded (Wix Headless) website for **Dotty Bobbin**: sewing classes, retreats, days out
and a small studio shop. Saskia Struthers, Felden, Hemel Hempstead.

Built with **Astro** and hosted by **Wix**. Everything business-related is **live from the
Wix dashboard**. Classes, retreats/events and shop products are never typed into the code.

## What lives where

| You want to change… | Where |
|---|---|
| A class, its times, price or capacity | Wix dashboard → **Bookings → Services / Calendar** |
| Portfolio Course 1 (the two groups): dates, price, capacity, the course agreement, hidden or shown | Wix dashboard → **Bookings → Services** (see *Portfolio Course 1* below). The pages are `/portfolio-course-1/morning` and `/portfolio-course-1/afternoon` |
| A retreat, day out or tickets | Wix dashboard → **Events**. New events: Wix's ticket service fee is **added at checkout** (customer pays it). The events already up in Oct 2026 have it included. |
| Shop products, prices, stock, categories | Wix dashboard → **Store Products / Categories** |
| Photos for any of the above | Add them to the item in the dashboard; the site shows them automatically (until then it shows a dotted placeholder) |
| A call for pattern testers, and the applications that come in | Wix dashboard → **CMS → Pattern tests** / **Tester applications** (see *Pattern testers* below) |
| Any wording on the site, the menu, email, address, About text, "Meet Saskia", reviews heading and Google place ID, policies | `src/content/site.ts` |
| Colours, fonts, rounded corners | `src/styles/global.css` (the `@theme` block) |
| Header, footer | `src/layouts/SiteLayout.astro` |
| Logo / favicon | `public/dotty-bobbin-logo.png`, `public/dotty-bobbin-icon.png`, `public/favicon.png` |

Dashboard: https://manage.wix.com/dashboard/ee8de818-a542-40d2-8da5-5fc6f251a2ff

Dashboard changes need **no release**: the site reads them live. Code or text changes in this
project need a **build and release** (below).

## How changes are made

There are two kinds of change, and only one of them touches this repository.

**1. Business changes: Saskia, in the Wix dashboard, no code.**
Classes, times, prices, retreats, events, tickets, products, stock and photos are all edited in
the Wix dashboard. The site reads them live, so they appear straight away with no release.

**2. Website changes: through Sam and this repository.**
Wording, Saskia's own text, policies, the reviews block, layout and design.
1. Sam starts a Claude chat (in the Dotty Bobbin project) and asks for the change.
2. Claude works from this repository (github.com/s4mstruthers/Dotty-Bobbin-Source), makes the
   edit, builds, and releases with the Wix CLI (see *Build and release*). The CLI login must be
   approved by a Wix account that owns or co-owns the site — currently Saskia's account.
3. Claude commits the change here; Sam pushes it to GitHub.

This repository is the master copy of the code. Wix's Code Store does not hold it, so never
start an edit from anywhere else, and never edit only the live site.

## Pages

| Address | File | Shows |
|---|---|---|
| `/` | `src/pages/index.astro` | Hero, live classes, next 3 retreats/events, 4 shop items, Meet Saskia, reviews spot, get in touch |
| `/services` (also `/classes`) | `src/pages/services.astro` | All classes (Wix Bookings) |
| `/services/<class>` | `src/pages/services/[slug].astro` | One class: details, dates/times and booking. The two Portfolio Course 1 slugs redirect to the course pages below |
| `/portfolio-course-1/morning`, `/portfolio-course-1/afternoon` | `src/pages/portfolio-course-1/[group].astro` → `src/wix/bookings/course.ts`, `src/components/bookings/CourseBooking.tsx` | One Portfolio Course 1 group: the 12 dates, places left, £45-a-month price, the course agreement and booking (works while the service is hidden) |
| `/events` (also `/retreats`) | `src/pages/events.astro` | Upcoming retreats & days out (past ones disappear automatically) |
| `/events/<event>` | `src/pages/events/[slug].astro` | One event with ticket booking |
| `/order-confirmation` | `src/pages/order-confirmation.astro` | Thank-you page after a shop or class-booking checkout (keep this address) |
| `/event-confirmation` | `src/pages/event-confirmation.astro` | Thank-you page after buying tickets (keep this address) |
| `/shop`, `/category/<cat>`, `/products/<item>` | `src/pages/shop.astro`, `category/[slug].astro`, `products/[slug].astro` | The studio shop; the cart opens as a drawer |
| `/pattern-testing` | `src/pages/pattern-testing.astro` | Every pattern test with "Open for applications" ticked (Wix CMS) |
| `/pattern-testing/<slug>` | `src/pages/pattern-testing/[slug].astro` | One pattern test: details, sizes, deadline and the apply form |
| `/api/pattern-testing/apply` | `src/pages/api/pattern-testing/apply.ts` → `src/wix/pattern-testing/server.ts` | Server-only: files an application into the private Tester applications collection |
| `/about`, `/contact`, `/policies` | `src/pages/*.astro` | Text from `src/content/site.ts` |
| `/login`, `/account` | `src/pages/login.astro`, `account.astro` | Customer accounts: my classes (cancel / change time where the booking policy allows), retreat & event tickets, shop orders |
| `/api/account/reset-password` | `src/pages/api/account/reset-password.ts` | "Forgot or never set a password?": Wix emails a link to its own password page, which returns to `/login` |
| `/api/account/overview`, `/api/account/booking` | `src/pages/api/account/*.ts` → `src/wix/account/server.ts` | Server-only: reads/changes the logged-in member's OWN data. Bookings made before signing up show only once the member's email is verified |

## Common edits (for Claude or a person)

- **Reword the home page**: edit `HOME` in `src/content/site.ts`.
- **Add Saskia's text**: paste it into `MEET_SASKIA` and `ABOUT` in `src/content/site.ts`,
  one string per paragraph, exactly as she wrote it. The dashed placeholders disappear by themselves.
- **Google reviews**: read live from Google (`/api/google-reviews`) with the place ID in `BUSINESS.googlePlaceId` and the `GOOGLE_PLACES_API_KEY` secret (`wix env set`). Google allows no caching, so each visitor who scrolls to them is one billed call; the key's daily quota in Google Cloud caps the cost. Never write reviews by hand.
- **Policies**: fill `POLICIES` in `src/content/site.ts`.
- **Show the phone number**: set `showPhone: true` in `BUSINESS`.
- **Add the Payhip "Patterns" link**: uncomment the `Patterns` line in `NAV` and paste the Payhip address.
- **Change which shop category shows on the home page**: `HOME.shopCategorySlug`.
- **Collection-only wording** on the shop and product pages: `SHOP_COLLECTION_NOTE`. The checkout itself
  offers only free collection (Wix dashboard → Settings → Shipping & fulfillment: region
  "UK - collection only"; the "International" region is switched off). Turn shipping back on there, not in code.
- **Colours**: the brand colours are tokens in `src/styles/global.css`. Hot pink (`--color-primary`) is
  for buttons only; sage is for headings and accents; pale sage for soft backgrounds.

## Portfolio Course 1

A 12-month course, booked as a whole and paid monthly. It is two Wix Bookings **course** services
(Morning group, Afternoon group) with **subscription** pricing (£45 a month, 12 payments, the first
at checkout, then on the 1st of each month from January 2027) and the **Portfolio Course 1
agreement** booking policy, whose custom description is the agreement text shown on the page.

- **The pages**: `/portfolio-course-1/morning` and `/portfolio-course-1/afternoon`. They read the
  two services **by id** (`PORTFOLIO_COURSE_1` in `src/wix/bookings/course.ts`), so they work while
  the services are **hidden**; hiding only keeps a course out of the `/services` list. To put a
  course in the classes list, untick "Hide from site" on the service in the dashboard — nothing to
  release. Its card then links to `/services/<slug>`, which sends visitors on to the course page.
- **What the page shows, and where it comes from**: name, tagline, description and photo (the
  service); the 12 dates and times (the schedule's calendar sessions); places left (the sessions'
  remaining capacity, so a booking lowers it straight away; "Full — ask Saskia about the other
  group" replaces the form when it reaches 0); the price (the service's subscription payment,
  worded "£45 a month for 12 months, first payment when you book"); the agreement (the booking
  policy's custom description). Edit any of these in the dashboard; nothing is typed into the code.
- **Booking**: one booking enrols the visitor in every session (a course booking on the schedule),
  then the Wix checkout takes the first £45 by card and sets up the remaining monthly payments.
  Online card payment only (the booking is sent as an online payment even though the service also
  allows in person). The £500 paid-in-full option is handled by Saskia with an invoice, not online.
- **The agreement checkbox**: the visitor must tick "I have read and agree to the Portfolio
  Course 1 Agreement shown above" before the Book button works. When a booking form with a
  **checkbox** field is connected to the services (Bookings → Settings → Booking form), the page
  shows that checkbox's own label and stores the tick with the booking's form submission; until
  then the services use the default booking form and the tick is checked on the page only.
- **Cancelling a course booking**: dashboard → Bookings list; cancelling the booking frees the
  place on every session. The monthly payments are a subscription on the booking's order
  (dashboard → Subscriptions); cancel it there too.

## Pattern testers

Saskia runs pattern tests from the Wix dashboard → **CMS** (https://manage.wix.com/dashboard/ee8de818-a542-40d2-8da5-5fc6f251a2ff/wix-cms); nothing here needs a release.

- **Open a call**: CMS → **Pattern tests** → Add item. Fill in the pattern name, a photo, a short
  description, "What testers need to know" (fabric, time, what feedback you want), the **Sizes
  offered** (one tag per size), skill level and **Feedback due by**. Tick **Open for applications**
  and it appears on `/pattern-testing` straight away. Give it a **slug** (e.g. `wrap-dress`) for a
  tidy address; without one the page still works, at a longer address.
- **Applications** land in CMS → **Tester applications**, one row each, with **Status** set to
  `New`. Work through them in the table: change Status (`New`, `Chosen`, `Pattern sent`,
  `Feedback received`, `Done`, `Not this time`), add **My notes**, filter by Pattern or Status, and
  save a view (e.g. "New applicants"). Export to CSV from More Actions if you want a spreadsheet.
- **Close a call**: un-tick **Open for applications**. Its page stays up with a "closed" note.
- **Being told about a new application**: the Wix automation **"Pattern tester application: add
  contact and show in Inbox"** (dashboard → Automations, active since 2 Nov 2026) runs on *Wix CMS
  → Item added* for **Tester applications**. It adds the applicant to Contacts (name and email) and
  posts the application into **Inbox** as a form message, so it shows in the Inbox badge, the Wix
  mobile app, and Inbox's own email notification (dashboard → Settings → Notifications). To email
  the applicant a thank-you as well, open the automation in the builder and add a **Send an email**
  step after "Show the application in Inbox": Wix only lets that step be set up in the builder, not
  by code. Edit link: https://manage.wix.com/dashboard/ee8de818-a542-40d2-8da5-5fc6f251a2ff/triggers/edit/4af28560-a62c-47c8-b24e-c6fef149998c
- The collections' schema is `seed/pattern-testing.plan.json`; re-running
  `node .agents/skills/wix-headless-kit/templates/cms/seed/seed-cms.mjs seed/pattern-testing.plan.json`
  recreates a missing collection and never touches existing rows. Applications are only ever
  written by the server (`src/wix/pattern-testing/server.ts`): the collection is private
  (every permission ADMIN), so nobody can read applicants from a browser.

## Rules this site follows

- No invented content: no made-up reviews, credentials, class types or addresses. Placeholders instead.
- Listings are live from Wix; a missing photo shows a dotted placeholder, never a stock photo.
- Booking, tickets, cart and checkout always go through the shipped Wix code and Wix's own checkout.
- The files under `src/wix/`, `src/hooks/` and the shipped components (`CartDrawer`, `FilterPanel`,
  `QuickAdd`, `OptionPicker`, `EventRegistrationView`, `LoginForm`, …) are Wix's tested code from the
  Wix Headless kit. Restyle around them; don't rewrite their logic.

## Build and release

**The release route that works for this site is the Wix CLI**, logged in as the site owner
(Saskia's Wix account). Node 24.18 or newer is required.

```bash
npm ci                                   # first time only
npx @wix/cli@latest login                # device code: approve it in a browser signed in as the owner
npx @wix/cli@latest env pull             # writes .env.local (never commit it)
npx @wix/cli@latest build
npx @wix/cli@latest release              # prints the live URL
```

Notes from the first release (24 Oct 2026):
- The Wix connector's UploadHeadlessWebsiteFiles tool uploads fine but its release step returned
  "Internal Server Error" for this migration preview, so use the CLI above.
- A CLI release does **not** store the source in Wix's Code Store. The source lives in this
  project folder / zip (keep a copy, e.g. a private GitHub repository) — a new chat starts from it.
- In Claude's sandbox the CLI needs these hosts allowed: `*.wix.com`, `*.wixapis.com`,
  `*.wixstatic.com`, `*.parastorage.com`, `*.s3.amazonaws.com`, `*.s3.us-east-1.amazonaws.com`.

The Wix Headless skills are installed with
`npx skills add wix/skills --skill wix-headless-kit --skill wix-docs --skill wix-manage`.

### Migration status

**Completed 24 Oct 2026.** This frontend is the live site on www.dottybobbin.com (site `ee8de818-…`,
which `wix.config.json` now names). Every `wix build` + `wix release` goes straight to the live site;
there is no separate preview any more. Wix's **Switch back** in the dashboard's Headless Settings
returns to the old editor site if ever needed.

SimplyBook's upcoming bookings and its client list were moved into Wix the same day (see
`migration/README.md`). SimplyBook's classes and products are hidden.
