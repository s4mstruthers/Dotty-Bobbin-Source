// GET /api/checkout?to=<Wix hosted checkout URL>: one stop on this site before Wix's checkout, which
// clears a stale copy of Wix's member-login cookie and sends the visitor straight on.
//
// Why (3 Nov 2026): Wix's checkout runs on this domain under /__ecom and keeps its own copy of the
// member-login cookie (smSession) on that path. After the member logs in again, the site-wide copy
// is renewed but the /__ecom one is not, and being on the more specific path it is the one the
// checkout reads: its Forms call gets 401 and the page says "We couldn't load the checkout". Seen on
// real iPhones of returning members (never guests); deleting that cookie in Safari's Web Inspector
// made the same checkout load. Expiring it here lets the checkout fall back to the current login.
// The exact path was cut off in the inspector ("/__…"), so both likely spellings are expired;
// expiring a cookie that isn't there does nothing.
//
// Only Wix checkout addresses are followed (this domain or wix.com), so this is no open redirect.
//
// CHECKOUT-DOOR WORKAROUND: keep. Why it stays, and how to tell if it ever can go, is in
// src/wix/checkout-door.ts.
import type { APIRoute } from "astro";

export const prerender = false;

const STALE_COOKIE = "smSession";
const STALE_PATHS = ["/__ecom", "/__ecom/checkout"];

/** The site's own domain without "www." (the cookie's Domain), or null on a dotless host like localhost. */
const cookieDomain = (host: string): string | null => (host.includes(".") ? host.replace(/^www\./, "") : null);

function isCheckoutAddress(target: URL, here: URL): boolean {
  if (target.protocol !== "https:") return import.meta.env.DEV && target.protocol === "http:";
  if (import.meta.env.DEV) return true; // the dev server is localhost; the checkout is the live domain
  const site = cookieDomain(here.hostname);
  const host = target.hostname;
  return host === here.hostname || (site !== null && (host === site || host.endsWith(`.${site}`))) || host === "wix.com" || host.endsWith(".wix.com");
}

function expiredCookies(host: string): string[] {
  const domain = cookieDomain(host);
  const gone = "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None";
  return STALE_PATHS.flatMap((path) => [
    `${STALE_COOKIE}=; Path=${path}; ${gone}`,
    ...(domain ? [`${STALE_COOKIE}=; Path=${path}; Domain=${domain}; ${gone}`] : []),
  ]);
}

export const GET: APIRoute = ({ url }) => {
  let target: URL;
  try {
    target = new URL(url.searchParams.get("to") ?? "");
  } catch {
    return new Response("Missing checkout address", { status: 400 });
  }
  if (!isCheckoutAddress(target, url)) return new Response("Not a checkout address", { status: 400 });

  const headers = new Headers({ Location: target.toString(), "Cache-Control": "no-store" });
  for (const cookie of expiredCookies(url.hostname)) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
};
