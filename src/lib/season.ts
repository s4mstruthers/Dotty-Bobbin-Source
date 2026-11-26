// Which seasonal look the site wears today: Christmas, winter, or none (the usual look). The pages
// are rendered on every visit (nothing is cached), so the look changes by itself at midnight UK
// time on the dates in src/content/site.ts (CHRISTMAS, WINTER).
//
// A preview: ?season=christmas or ?season=winter on any address shows that look whatever the date,
// and a cookie (set by the script in SiteLayout) keeps it while browsing in that browser.
// ?season=off turns any look off again, including during the season itself.
import type { AstroCookies } from "astro";
import { CHRISTMAS, WINTER } from "../content/site";

export const SEASONS = ["christmas", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_PARAM = "season";
export const SEASON_COOKIE = "db-season";

const DATES: Record<Season, { on: boolean; from: string; until: string }> = { christmas: CHRISTMAS, winter: WINTER };

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

/** The season for a date; Christmas wins if the two ranges are ever set to overlap. */
function fromDate(now: Date): Season | null {
  const md = ukMonthDay(now);
  return SEASONS.find((s) => DATES[s].on && within(md, DATES[s].from, DATES[s].until)) ?? null;
}

const isSeason = (v: string | undefined): v is Season => (SEASONS as readonly string[]).includes(v ?? "");

/** A preview choice from the address or the cookie: a season, "off", or undefined for none. */
function previewChoice(url: URL, cookies: AstroCookies): Season | "off" | undefined {
  const raw = url.searchParams.get(SEASON_PARAM) ?? cookies.get(SEASON_COOKIE)?.value;
  return raw === "off" || isSeason(raw) ? raw : undefined;
}

/** The season to show on this request, or null for the usual look. */
export function currentSeason(url: URL, cookies: AstroCookies, now = new Date()): Season | null {
  const preview = previewChoice(url, cookies);
  if (preview === "off") return null;
  return preview ?? fromDate(now);
}
