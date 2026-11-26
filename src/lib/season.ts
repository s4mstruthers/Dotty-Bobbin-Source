// Which seasonal look the site wears today. The pages are rendered on every visit (nothing is
// cached), so the look changes by itself at midnight UK time on the dates in src/content/site.ts.
//
// A preview: ?season=christmas on any address shows the look whatever the date, and a cookie
// (set by the script in SiteLayout) keeps it on while browsing in that browser. ?season=off turns it
// off again, including during Christmas itself.
import type { AstroCookies } from "astro";
import { CHRISTMAS } from "../content/site";

export type Season = "christmas";

export const SEASON_PARAM = "season";
export const SEASON_COOKIE = "db-season";

/** "MM-DD" for today in the UK, whatever zone the server runs in. */
function ukMonthDay(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("month")}-${get("day")}`;
}

/** Whether `md` falls between `from` and `until` (both "MM-DD", inclusive); the range may cross New Year. */
function within(md: string, from: string, until: string): boolean {
  return from <= until ? md >= from && md <= until : md >= from || md <= until;
}

function fromDate(now: Date): Season | null {
  return CHRISTMAS.on && within(ukMonthDay(now), CHRISTMAS.from, CHRISTMAS.until) ? "christmas" : null;
}

/** A preview choice from the address or the cookie: a season, "off", or undefined for none. */
function previewChoice(url: URL, cookies: AstroCookies): Season | "off" | undefined {
  const raw = url.searchParams.get(SEASON_PARAM) ?? cookies.get(SEASON_COOKIE)?.value;
  return raw === "christmas" || raw === "off" ? raw : undefined;
}

/** The season to show on this request. */
export function currentSeason(url: URL, cookies: AstroCookies, now = new Date()): Season | null {
  const preview = previewChoice(url, cookies);
  if (preview === "off") return null;
  return preview ?? fromDate(now);
}
