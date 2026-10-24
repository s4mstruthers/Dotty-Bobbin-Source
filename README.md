# Dotty Bobbin website

The coded (Wix Headless) website for **Dotty Bobbin**: sewing classes, retreats, days out
and a small studio shop. Saskia Struthers, Felden, Hemel Hempstead.

Built with **Astro** and hosted by **Wix**. Everything business-related is **live from the
Wix dashboard**. Classes, retreats/events and shop products are never typed into the code.

## What lives where

| You want to change… | Where |
|---|---|
| A class, its times, price or capacity | Wix dashboard → **Bookings → Services / Calendar** |
| A retreat, day out or tickets | Wix dashboard → **Events**. New events: Wix's ticket service fee is **added at checkout** (customer pays it). The events already up in Oct 2026 have it included. |
| Shop products, prices, stock, categories | Wix dashboard → **Store Products / Categories** |
| Photos for any of the above | Add them to the item in the dashboard; the site shows them automatically (until then it shows a dotted placeholder) |
| Any wording on the site, the menu, email, address, About text, "Meet Saskia", reviews widget, policies | `src/content/site.ts` |
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
| `/services/<class>` | `src/pages/services/[slug].astro` | One class: details, dates/times and booking |
| `/events` (also `/retreats`) | `src/pages/events.astro` | Upcoming retreats & days out (past ones disappear automatically) |
| `/events/<event>` | `src/pages/events/[slug].astro` | One event with ticket booking |
| `/order-confirmation` | `src/pages/order-confirmation.astro` | Thank-you page after a shop or class-booking checkout (keep this address) |
| `/event-confirmation` | `src/pages/event-confirmation.astro` | Thank-you page after buying tickets (keep this address) |
| `/shop`, `/category/<cat>`, `/products/<item>` | `src/pages/shop.astro`, `category/[slug].astro`, `products/[slug].astro` | The studio shop; the cart opens as a drawer |
| `/about`, `/contact`, `/policies` | `src/pages/*.astro` | Text from `src/content/site.ts` |
| `/login`, `/account` | `src/pages/login.astro`, `account.astro` | Customer accounts: my classes (cancel / change time where the booking policy allows), retreat & event tickets, shop orders |
| `/api/account/reset-password` | `src/pages/api/account/reset-password.ts` | "Forgot or never set a password?": Wix emails a link to its own password page, which returns to `/login` |
| `/api/account/overview`, `/api/account/booking` | `src/pages/api/account/*.ts` → `src/wix/account/server.ts` | Server-only: reads/changes the logged-in member's OWN data. Bookings made before signing up show only once the member's email is verified |

## Common edits (for Claude or a person)

- **Reword the home page**: edit `HOME` in `src/content/site.ts`.
- **Add Saskia's text**: paste it into `MEET_SASKIA` and `ABOUT` in `src/content/site.ts`,
  one string per paragraph, exactly as she wrote it. The dashed placeholders disappear by themselves.
- **Google reviews**: paste the widget's embed code into `REVIEWS_EMBED_HTML`. Never write reviews by hand.
- **Policies**: fill `POLICIES` in `src/content/site.ts`.
- **Show the phone number**: set `showPhone: true` in `BUSINESS`.
- **Add the Payhip "Patterns" link**: uncomment the `Patterns` line in `NAV` and paste the Payhip address.
- **Change which shop category shows on the home page**: `HOME.shopCategorySlug`.
- **Collection-only wording** on the shop and product pages: `SHOP_COLLECTION_NOTE`. The checkout itself
  offers only free collection (Wix dashboard → Settings → Shipping & fulfillment: region
  "UK - collection only"; the "International" region is switched off). Turn shipping back on there, not in code.
- **Colours**: the brand colours are tokens in `src/styles/global.css`. Hot pink (`--color-primary`) is
  for buttons only; sage is for headings and accents; pale sage for soft backgrounds.

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
