// Browser side of the account page: the two calls to this site's own /api/account routes (which
// do the privileged Wix reads on the server) plus small display helpers. No Wix SDK here.
import type { AccountOverview, BookingActionRequest } from "./types";

export const BUSINESS_TIME_ZONE = "Europe/London";

/** The member's session has run out (the route answered 401): show "Log in again", not "Try again". */
export class SessionExpiredError extends Error {
  constructor() {
    super("You've been logged out. Please log in again.");
  }
}

export async function fetchAccountOverview(): Promise<AccountOverview> {
  const r = await fetch("/api/account/overview", { credentials: "same-origin", cache: "no-store" });
  if (r.status === 401) throw new SessionExpiredError();
  if (!r.ok) throw new Error("We couldn't load your account just now. Please try again.");
  return (await r.json()) as AccountOverview;
}

export async function changeBooking(req: BookingActionRequest): Promise<void> {
  const r = await fetch("/api/account/booking", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) {
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Sorry, that didn't work. Please try again.");
  }
}

/** "Mon 26 Oct, 10:00 – 12:00" in UK time (the classes happen in Hemel Hempstead). */
export function whenLabel(startIso: string, endIso?: string): string {
  if (!startIso) return "";
  const start = new Date(startIso);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: BUSINESS_TIME_ZONE, weekday: "short", day: "numeric", month: "short", year: start.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }).format(start);
  const time = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: BUSINESS_TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(d);
  return `${day}, ${time(start)}${endIso ? ` – ${time(new Date(endIso))}` : ""}`;
}

export function dateLabel(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: BUSINESS_TIME_ZONE, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export const isPast = (iso: string, now = Date.now()): boolean => Boolean(iso) && new Date(iso).getTime() < now;
