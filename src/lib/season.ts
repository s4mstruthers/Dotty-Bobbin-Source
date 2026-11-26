// Which holiday look the site wears today: Christmas, Easter, Halloween, or none (the usual look).
// The pages are rendered on every visit (nothing is cached), so the look changes by itself at
// midnight UK time on the dates in src/content/site.ts (CHRISTMAS, EASTER, HALLOWEEN). Easter's
// dates are counted from Easter Sunday, worked out here for each year.
//
// A preview: ?season=christmas, ?season=easter or ?season=halloween on any address shows that look
// whatever the date, and a cookie (set by the script in SiteLayout) keeps it while browsing in that
// browser. ?season=off turns any look off again, including during the holiday itself.
import type { AstroCookies } from "astro";
import { CHRISTMAS, EASTER, HALLOWEEN } from "../content/site";

export const SEASONS = ["christmas", "easter", "halloween"] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_PARAM = "season";
export const SEASON_COOKIE = "db-season";

/** Today in the UK, whatever zone the server runs in: its year and "MM-DD". */
function ukToday(now: Date): { year: number; md: string } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: Number(get("year")), md: `${get("month")}-${get("day")}` };
}

/** Easter Sunday for a year (Gregorian calendar; the "anonymous" algorithm), as [month, day]. */
export function easterSunday(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return [Math.floor(n / 31), (n % 31) + 1];
}

/** "MM-DD" of the day `offset` days from Easter Sunday in `year`. */
function fromEaster(year: number, offset: number): string {
  const [month, day] = easterSunday(year);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Each holiday's dates in a given year, both "MM-DD" and inclusive. */
function range(season: Season, year: number): { on: boolean; from: string; until: string } {
  if (season === "easter") return { on: EASTER.on, from: fromEaster(year, -EASTER.daysBefore), until: fromEaster(year, EASTER.daysAfter) };
  return season === "christmas" ? CHRISTMAS : HALLOWEEN;
}

/** Whether `md` falls between `from` and `until` (both "MM-DD", inclusive); the range may cross New Year. */
function within(md: string, from: string, until: string): boolean {
  return from <= until ? md >= from && md <= until : md >= from || md <= until;
}

/** The holiday for a date; if two are ever set to overlap, the earlier in SEASONS wins. */
export function seasonOn(now: Date): Season | null {
  const { year, md } = ukToday(now);
  return (
    SEASONS.find((s) => {
      const r = range(s, year);
      return r.on && within(md, r.from, r.until);
    }) ?? null
  );
}

const isSeason = (v: string | undefined): v is Season => (SEASONS as readonly string[]).includes(v ?? "");

/** A preview choice from the address or the cookie: a holiday, "off", or undefined for none. */
function previewChoice(url: URL, cookies: AstroCookies): Season | "off" | undefined {
  const raw = url.searchParams.get(SEASON_PARAM) ?? cookies.get(SEASON_COOKIE)?.value;
  return raw === "off" || isSeason(raw) ? raw : undefined;
}

/** The holiday look to show on this request, or null for the usual look. */
export function currentSeason(url: URL, cookies: AstroCookies, now = new Date()): Season | null {
  const preview = previewChoice(url, cookies);
  if (preview === "off") return null;
  return preview ?? seasonOn(now);
}
