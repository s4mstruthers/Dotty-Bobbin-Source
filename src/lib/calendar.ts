// "Add to calendar" for classes and events: a Google Calendar link, and an .ics file for Apple
// Calendar (and Outlook) served by /api/calendar.ics. Times are UTC instants throughout; a booking
// slot's local wall-clock time is converted with its zone first.
import { BUSINESS } from "../content/site";
import type { ServiceDetail, Slot } from "../wix/bookings/types";
import type { EventDetail } from "../wix/events/types";

export interface CalendarEvent {
  title: string;
  /** UTC instants (any string Date can parse). */
  startIso: string;
  endIso: string;
  location?: string;
}

export interface CalendarLinks {
  google: string;
  apple: string;
}

export const STUDIO_ADDRESS = BUSINESS.address.join(", ");

const DETAILS = `Booked with ${BUSINESS.name}. To change or cancel, log in to My account on the website or get in touch.`;

/** 2026-11-01T09:00:00.000Z → 20261101T090000Z, the form both Google and iCalendar take. */
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${stamp(e.startIso)}/${stamp(e.endIso)}`, details: DETAILS });
  if (e.location) p.set("location", e.location);
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function icsUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({ title: e.title, start: e.startIso, end: e.endIso });
  if (e.location) p.set("location", e.location);
  return `/api/calendar.ics?${p}`;
}

export const calendarLinks = (e: CalendarEvent): CalendarLinks => ({ google: googleCalendarUrl(e), apple: icsUrl(e) });

/** A retreat or event: Wix's own calendar links where it sent them, ours otherwise; null for a date still to be set. */
export function eventCalendarLinks(event: Pick<EventDetail, "title" | "startDateIso" | "endDateIso" | "address" | "locationName" | "addToCalendar">): CalendarLinks | null {
  if (!event.startDateIso) return null;
  const ours = calendarLinks({
    title: event.title,
    startIso: event.startDateIso,
    endIso: event.endDateIso || event.startDateIso,
    location: event.address || event.locationName,
  });
  return { google: event.addToCalendar?.google || ours.google, apple: event.addToCalendar?.ics || ours.apple };
}

// ---- the .ics file (RFC 5545) ----------------------------------------------------------------

const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 octets continue on the next line after a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** One VEVENT in a feed: its own UID (stable across refreshes) and notes. */
export interface FeedEvent extends CalendarEvent {
  uid: string;
  description: string;
}

function veventLines(e: FeedEvent, now: Date): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${stamp(now.toISOString())}`,
    `DTSTART:${stamp(e.startIso)}`,
    `DTEND:${stamp(e.endIso)}`,
    `SUMMARY:${escapeText(e.title)}`,
    ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
    `DESCRIPTION:${escapeText(e.description)}`,
    "END:VEVENT",
  ];
}

/** A whole calendar: `name` is what Apple Calendar calls a subscription until it's renamed. */
export function icsCalendar(events: FeedEvent[], { name, now = new Date() }: { name?: string; now?: Date } = {}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${BUSINESS.name}//Website//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(name ? [`X-WR-CALNAME:${escapeText(name)}`, "REFRESH-INTERVAL;VALUE=DURATION:PT15M", "X-PUBLISHED-TTL:PT15M"] : []),
    ...events.flatMap((e) => veventLines(e, now)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function icsText(e: CalendarEvent, now = new Date()): string {
  const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // Stable for the same class at the same time, so adding it twice updates rather than duplicates.
  const uid = `${stamp(e.startIso)}-${slug || "event"}@dottybobbin`;
  return icsCalendar([{ ...e, uid, description: DETAILS }], { now });
}

// ---- booking slots ---------------------------------------------------------------------------

/** "2026-11-01T09:00:00" wall-clock time in `timeZone` → the UTC instant, as ISO. */
export function zonedToUtcIso(local: string, timeZone: string): string {
  const asUtc = Date.parse(`${local}Z`);
  const offsetAt = (t: number) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
        .formatToParts(new Date(t))
        .map((p) => [p.type, p.value]),
    );
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - t;
  };
  // Twice, so a time just after a clock change picks up the offset in force at that time.
  let t = asUtc - offsetAt(asUtc);
  t = asUtc - offsetAt(t);
  return new Date(t).toISOString();
}

/** A booked class or appointment slot as a calendar event. */
export function slotCalendarEvent(service: Pick<ServiceDetail, "name">, slot: Slot, timeZone: string | null): CalendarEvent {
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const location = !slot.location || slot.location.type === "BUSINESS" ? STUDIO_ADDRESS : slot.location.name;
  return { title: service.name, startIso: zonedToUtcIso(slot.startLocal, zone), endIso: zonedToUtcIso(slot.endLocal, zone), location };
}

// ---- across the checkout redirect -------------------------------------------------------------

// A paid booking leaves for the Wix checkout and comes back to /order-confirmation, so the class
// is kept for that page in the visit's session storage.
const BOOKED_KEY = "booked-class";

export function rememberBookedEvent(e: CalendarEvent): void {
  try {
    sessionStorage.setItem(BOOKED_KEY, JSON.stringify({ ...e, savedAt: Date.now() }));
  } catch {}
}

/** Drop a class kept for a checkout that was left, so a later shop order doesn't offer it. */
export function forgetBookedEvent(): void {
  try {
    sessionStorage.removeItem(BOOKED_KEY);
  } catch {}
}

/**
 * The class booked just before the checkout that produced `orderId`; null when there isn't one.
 * The first read ties the kept class to that order, so every reader on the thank-you page (its
 * script and the Add to calendar island, which load separately) and a refresh all get it, while
 * a later, different order doesn't.
 */
export function bookedEventForOrder(orderId: string): CalendarEvent | null {
  try {
    const raw = sessionStorage.getItem(BOOKED_KEY);
    const e = raw ? JSON.parse(raw) : null;
    // A checkout takes minutes; anything older is from a checkout that was left.
    if (!e || !orderId || Date.now() - e.savedAt > 2 * 60 * 60 * 1000) return null;
    if (e.orderId && e.orderId !== orderId) return null;
    if (!e.orderId) sessionStorage.setItem(BOOKED_KEY, JSON.stringify({ ...e, orderId }));
    return { title: e.title, startIso: e.startIso, endIso: e.endIso, location: e.location };
  } catch {
    return null;
  }
}
