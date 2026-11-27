// GET /sitemap-index.xml — the site's own sitemap: every page worth finding in a search engine,
// with the classes, retreats & events, products, shop categories and open pattern-test calls read
// live from Wix, so it follows the dashboard with no release.
//
// Why our own (27 Nov 2026): the /sitemap.xml Wix serves for this headless site lists no pages at
// all (only an empty member-profiles sitemap), and Wix's List Sitemap Pages answers 0 products,
// classes and events. Wix reserves /sitemap.xml and every *-sitemap.xml path, and its docs name
// /sitemap-index.xml as a path a site may use for a sitemap of its own:
// docs: https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/about-sitemaps-in-the-astro-integration
// Search engines find it through the Sitemap line in robots.txt (Wix dashboard › SEO › Robots.txt
// editor) and Google Search Console.
//
// Left out on purpose: log in, account, the two thank-you pages, the 404 page and the addresses
// that only redirect (/classes, /retreats, /policies, /product-page/…, the patterns category and
// the course groups' /services/… slugs).
import type { APIRoute } from "astro";
import { ALL_POLICIES } from "../content/policies";
import { SHOP } from "../content/site";
import { PORTFOLIO_COURSE_1, coursePathForSlug } from "../wix/bookings/course";
import { fetchServices } from "../wix/bookings/services";
import { fetchEventsPage } from "../wix/events/events";
import { listOpenPatternTests } from "../wix/pattern-testing/pattern-tests";
import { fetchCategories, searchCatalog } from "../wix/storefront/catalog";

export const prerender = false;

const MAIN_PAGES = ["/", "/services", "/events", "/shop", "/patterns", "/gift-card", "/about", "/contact", "/gallery", "/pattern-testing"];

/** At most this many pages of any one list (100 items each): far more than the business holds. */
const MAX_PAGES = 10;

const item = (base: string, slug: string) => `${base}/${encodeURIComponent(slug)}`;

async function classPaths(): Promise<string[]> {
  const out: string[] = [];
  for (let page = 0, offset = 0; page < MAX_PAGES; page++) {
    const res = await fetchServices({ limit: 100, offset });
    // A course group's own /services/<slug> address only redirects to its course page (listed below).
    out.push(...res.items.filter((s) => s.slug && !coursePathForSlug(s.slug)).map((s) => item("/services", s.slug)));
    if (!res.hasMore || !res.items.length) break;
    offset += res.items.length;
  }
  return out;
}

async function eventPaths(): Promise<string[]> {
  const out: string[] = [];
  for (let page = 0, offset = 0; page < MAX_PAGES; page++) {
    const res = await fetchEventsPage({ limit: 100, offset });
    out.push(...res.events.filter((e) => e.slug).map((e) => item("/events", e.slug)));
    if (!res.hasMore || !res.events.length) break;
    offset += res.events.length;
  }
  return out;
}

async function productPaths(): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await searchCatalog({ limit: 100, cursor });
    out.push(...res.products.filter((p) => p.slug).map((p) => item("/products", p.slug)));
    if (!res.hasMore || !res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return out;
}

async function categoryPaths(): Promise<string[]> {
  // The patterns category redirects to /patterns, which is listed as a main page.
  return (await fetchCategories()).filter((c) => c.slug && c.slug !== SHOP.patternsCategorySlug).map((c) => item("/category", c.slug));
}

async function patternTestPaths(): Promise<string[]> {
  return (await listOpenPatternTests()).map((t) => item("/pattern-testing", t.slug));
}

const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export const GET: APIRoute = async ({ request, url }) => {
  // Behind Wix's proxy the request URL is internal; the public address arrives on x-wix-forwarded-url.
  const forwarded = request.headers.get("x-wix-forwarded-url");
  const origin = forwarded && URL.canParse(forwarded) && /^https?:$/.test(new URL(forwarded).protocol) ? new URL(forwarded).origin : url.origin;

  // Each list on its own: one that fails is left out this time rather than failing the whole file.
  const lists = await Promise.allSettled([classPaths(), eventPaths(), productPaths(), categoryPaths(), patternTestPaths()]);
  const live: string[] = [];
  for (const r of lists) {
    if (r.status === "fulfilled") live.push(...r.value);
    else console.error("[sitemap] a list failed", (r.reason as any)?.details?.applicationError ?? r.reason);
  }

  const paths = [...new Set([...MAIN_PAGES, ...Object.values(PORTFOLIO_COURSE_1).map((g) => g.path), ...ALL_POLICIES.map((p) => `/${p.slug}`), ...live])];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url><loc>${xmlEscape(origin + p)}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // An hour: new classes and products appear within the hour, and search engines read it rarely.
      "Cache-Control": "public, max-age=3600",
    },
  });
};
