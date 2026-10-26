// SERVER ONLY. Who is booked on each class: the private calendar feed the studio subscribes to in
// Apple Calendar (served by src/pages/api/bookings-feed/[token].ics.ts). Wix's own calendar sync
// shows the sessions but not the people, so this lists every confirmed or pending booking, grouped
// into one calendar event per session, with each person's name and places in the notes. No phone
// numbers: Apple Calendar turns the first number in the notes into the event's "Call" button, which
// then looks like the studio's own number.
//
// Group class sessions nobody has booked yet are in it too ("(0 booked)"), so Saskia can decide
// whether to run or cancel a class. One-to-ones aren't: an unbooked 1-1 isn't a session at all.
//
// The booking query is a business-level call that reads every customer's details, so it is
// elevated here and only ever reached through the token-checked route.
//
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-reader-v2/query-extended-bookings.md
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-reader-v2/supported-filters.md
// docs: https://dev.wix.com/docs/api-reference/business-management/calendar/events-v3/query-events.md
import { auth } from "@wix/essentials";
import { extendedBookings } from "@wix/bookings";
import { STUDIO_ADDRESS, type FeedEvent } from "../../lib/calendar";
import { wixFetch } from "../sdk";
import { BOOKINGS_APP_ID, nextEventsCursor, toLocalDateString } from "./booking-core";

type Raw = Record<string, any>;

const elevatedQueryBookings = auth.elevate(extendedBookings.queryExtendedBookings);

const DAY = 24 * 60 * 60 * 1000;
/** Recent past for looking back at who came; a year ahead covers anything bookable. */
const LOOK_BACK_DAYS = 60;
const LOOK_AHEAD_DAYS = 366;
const MAX_BOOKINGS = 2000;
const MAX_SESSIONS = 2000;
/** Calendar event types that are group sessions (a 1-1's event only exists once it's booked). */
const GROUP_TYPES = new Set(["CLASS", "COURSE"]);

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : typeof v === "string" ? v : "");

async function queryBookings(now: Date): Promise<Raw[]> {
  const out: Raw[] = [];
  let cursor: string | undefined;
  do {
    const query: Raw = cursor
      ? { cursorPaging: { limit: 100, cursor } }
      : {
          // Two limits on one field must be separate conditions (tested: `{ $gte, $lte }` together is
          // rejected as INVALID_FILTER).
          filter: {
            $and: [
              { startDate: { $gte: new Date(now.getTime() - LOOK_BACK_DAYS * DAY).toISOString() } },
              { startDate: { $lte: new Date(now.getTime() + LOOK_AHEAD_DAYS * DAY).toISOString() } },
              // CREATED is a checkout that wasn't finished; CANCELED and DECLINED aren't coming.
              { status: { $in: ["CONFIRMED", "PENDING"] } },
            ],
          },
          sort: [{ fieldName: "startDate", order: "ASC" }],
          cursorPaging: { limit: 100 },
        };
    const res = (await elevatedQueryBookings(query as any)) as Raw;
    out.push(...((res.extendedBookings ?? []) as Raw[]));
    cursor = res.pagingMetadata?.cursors?.next ?? undefined;
  } while (cursor && out.length < MAX_BOOKINGS);
  return out.map((eb) => eb.booking ?? {}).filter((b) => b.startDate && b.endDate);
}

const places = (b: Raw): number => {
  const choices = (b.participantsChoices?.serviceChoices ?? []) as Raw[];
  const fromChoices = choices.reduce((n, c) => n + (Number(c.numberOfParticipants) || 0), 0);
  return Number(b.totalParticipants) || fromChoices || 1;
};

function personLine(b: Raw): string {
  const c: Raw = b.contactDetails ?? {};
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || c.email || "Name not given";
  const n = places(b);
  const parts = [name, ...(n > 1 ? [`${n} places`] : [])];
  return `• ${parts.join(" · ")}${b.status === "PENDING" ? " (awaiting your confirmation)" : ""}`;
}

function locationOf(b: Raw): string {
  const loc: Raw = b.bookedEntity?.slot?.location ?? {};
  if (!loc.locationType || loc.locationType === "OWNER_BUSINESS" || loc.locationType === "UNDEFINED") return STUDIO_ADDRESS;
  return loc.formattedAddress ?? loc.name ?? "";
}

/**
 * Every group class/course session of the Bookings app in the same window, from the calendar
 * (Query Events: dates go in fromLocalDate/toLocalDate, never in the filter). Cancelled sessions
 * are left out. Each event's `id` is what a class booking's `slot.eventId` points at.
 */
async function querySessions(now: Date): Promise<Raw[]> {
  const out: Raw[] = [];
  let cursor: string | null = null;
  do {
    const body: Raw = cursor
      ? { query: { cursorPaging: { limit: 100, cursor } } }
      : {
          query: { filter: { appId: BOOKINGS_APP_ID }, cursorPaging: { limit: 100 } },
          fromLocalDate: toLocalDateString(new Date(now.getTime() - LOOK_BACK_DAYS * DAY)),
          toLocalDate: toLocalDateString(new Date(now.getTime() + LOOK_AHEAD_DAYS * DAY)),
        };
    const r = await wixFetch("/calendar/v3/events/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`Calendar events query failed (${r.status}).`);
    const res = (await r.json()) as Raw;
    out.push(...((res.events ?? []) as Raw[]));
    cursor = nextEventsCursor(res);
  } while (cursor && out.length < MAX_SESSIONS);
  return out.filter((e) => GROUP_TYPES.has(e.type) && e.status !== "CANCELLED" && e.id && e.start?.utcDate && e.end?.utcDate);
}

/** One event per session (a class session's event id; otherwise the service at that time). */
export async function rosterEvents(now = new Date()): Promise<FeedEvent[]> {
  const [bookings, classSessions] = await Promise.all([queryBookings(now), querySessions(now)]);
  const sessions = new Map<string, Raw[]>();
  for (const b of bookings) {
    const slot: Raw = b.bookedEntity?.slot ?? {};
    const key = slot.eventId || `${slot.serviceId ?? b.bookedEntity?.title}-${toIso(b.startDate)}`;
    sessions.set(key, [...(sessions.get(key) ?? []), b]);
  }
  const empty: FeedEvent[] = classSessions
    .filter((e) => !sessions.has(e.id))
    .map((e) => ({
      uid: `roster-${String(e.id).replace(/[^a-z0-9-]/gi, "")}@dottybobbin`,
      title: `${e.title || e.scheduleName || "Class"} (0 booked)`,
      startIso: e.start.utcDate,
      endIso: e.end.utcDate,
      location: !e.location?.type || e.location.type === "BUSINESS" ? STUDIO_ADDRESS : e.location.address ?? e.location.name ?? "",
      description: "Nobody booked yet.",
    }));
  const booked = [...sessions.entries()].map(([key, group]) => {
    const first = group[0];
    const total = group.reduce((n, b) => n + places(b), 0);
    const title = first.bookedEntity?.title || "Booking";
    const people = [...group].sort((a, b) => personLine(a).localeCompare(personLine(b))).map(personLine);
    return {
      uid: `roster-${key.replace(/[^a-z0-9-]/gi, "")}@dottybobbin`,
      title: `${title} (${total} booked)`,
      startIso: toIso(first.startDate),
      endIso: toIso(first.endDate),
      location: locationOf(first),
      description: [`${total} booked:`, ...people].join("\n"),
    };
  });
  return [...booked, ...empty].sort((a, b) => a.startIso.localeCompare(b.startIso));
}
