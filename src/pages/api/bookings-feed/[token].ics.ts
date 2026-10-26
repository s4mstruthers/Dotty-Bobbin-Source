// GET /api/bookings-feed/<token>.ics — the studio's private calendar of who is booked on each class,
// for "Add Subscribed Calendar" in Apple Calendar (see src/wix/bookings/roster-feed.ts). Calendar
// apps can't log in, so the link itself is the password: the token is BOOKINGS_FEED_TOKEN, set on
// Wix's servers (`wix env set`). A wrong or missing token gets the same 404 as any unknown page.
import type { APIRoute } from "astro";
import { BOOKINGS_FEED_TOKEN } from "astro:env/server";
import { icsCalendar } from "../../../lib/calendar";
import { BUSINESS } from "../../../content/site";
import { rosterEvents } from "../../../wix/bookings/roster-feed";

export const prerender = false;

/** Compares every character, so the time taken doesn't hint at how much of a guess was right. */
function sameToken(given: string, expected: string): boolean {
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  return diff === 0;
}

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export const GET: APIRoute = async ({ params }) => {
  const expected = BOOKINGS_FEED_TOKEN ?? "";
  // A short token would be guessable; treat it as not set.
  if (expected.length < 24 || !sameToken(params.token ?? "", expected)) return notFound();

  try {
    const body = icsCalendar(await rosterEvents(), { name: `${BUSINESS.name} bookings` });
    return new Response(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (e) {
    console.error("[bookings-feed] failed", (e as any)?.details?.applicationError ?? e);
    // 503 rather than an empty calendar, so a subscribed calendar keeps what it had.
    return new Response("Bookings are unavailable right now.", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "300" } });
  }
};
