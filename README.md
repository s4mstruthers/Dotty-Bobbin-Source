# Dotty Bobbin website

The coded (Wix Headless) website for **Dotty Bobbin**: sewing classes, retreats, days out
and a small studio shop. Saskia Struthers, Felden, Hemel Hempstead.

Built with **Astro** and hosted by **Wix**. Everything business-related is **live from the
Wix dashboard**. Classes, retreats/events and shop products are never typed into the code.

## What lives where

| You want to change… | Where |
|---|---|
| A class, its times, price or capacity | Wix dashboard → **Bookings → Services / Calendar** |
| A retreat, day out or tickets | Wix dashboard → **Events** |
| Shop products, prices, stock, categories | Wix dashboard → **Store Products / Categories** |
| Photos for any of the above | Add them to the item in the dashboard; the site shows them automatically (until then it shows a dotted placeholder) |
| Any wording on the site, the menu, email, address, About text, "Meet Saskia", reviews widget, policies | `src/content/site.ts` |
| Colours, fonts, rounded corners | `src/styles/global.css` (the `@theme` block) |
| Header, footer | `src/layouts/SiteLayout.astro` |
| Logo / favicon | `public/dotty-bobbin-logo.png`, `public/dotty-bobbin-icon.png`, `public/favicon.png` |

Dashboard: https://manage.wix.com/dashboard/ee8de818-a542-40d2-8da5-5fc6f251a2ff

Dashboard changes need **no release**: the site reads them live. Code or text changes in this
project need a **build and release** (below).

## Pages

| Address | File | Shows |
|---|---|---|
| `/` | `src/pages/index.astro` | Hero, live classes, next 3 retreats/events, 4 shop items, Meet Saskia, reviews spot, get in touch |
| `/services` (also `/classes`) | `src/pages/services.astro` | All classes (Wix Bookings) |
| `/services/<class>` | `src/pages/services/[slug].astro` | One class: details, dates/times and booking |
| `/events` (also `/retreats`) | `src/pages/events.astro` | Upcoming retreats & days out (past ones disappear automatically) |
| `/events/<event>` | `src/pages/events/[slug].astro` | One event with ticket booking |
| `/event-confirmation` | `src/pages/event-confirmation.astro` | Thank-you page after buying tickets (keep this address) |
| `/shop`, `/category/<cat>`, `/products/<item>` | `src/pages/shop.astro`, `category/[slug].astro`, `products/[slug].astro` | The studio shop; the cart opens as a drawer |
| `/about`, `/contact`, `/policies` | `src/pages/*.astro` | Text from `src/content/site.ts` |
| `/login`, `/account` | `src/pages/login.astro`, `account.astro` | Customer accounts |

## Common edits (for Claude or a person)

- **Reword the home page**: edit `HOME` in `src/content/site.ts`.
- **Add Saskia's text**: paste it into `MEET_SASKIA` and `ABOUT` in `src/content/site.ts`,
  one string per paragraph, exactly as she wrote it. The dashed placeholders disappear by themselves.
- **Google reviews**: paste the widget's embed code into `REVIEWS_EMBED_HTML`. Never write reviews by hand.
- **Policies**: fill `POLICIES` in `src/content/site.ts`.
- **Show the phone number**: set `showPhone: true` in `BUSINESS`.
- **Add the Payhip "Patterns" link**: uncomment the `Patterns` line in `NAV` and paste the Payhip address.
- **Change which shop category shows on the home page**: `HOME.shopCategorySlug`.
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

This site was moved from the Wix editor with Wix's **Headless Migration**:
- the business data and dashboard belong to site `ee8de818-…` (Dotty Bobbin);
- the code is released to the deploy site in `wix.config.json` as a **preview**;
- clicking **Complete Migration** in the dashboard's Headless Settings puts this frontend live on
  www.dottybobbin.com. **Switch back** there undoes it.
