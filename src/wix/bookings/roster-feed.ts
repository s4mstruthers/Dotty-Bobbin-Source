// SERVER ONLY. Who is booked on each class: the private calendar feed the studio subscribes to in
// Apple Calendar (served by src/pages/api/bookings-feed/[token].ics.ts). Wix's own calendar sync
// shows the sessions but not the people, so this lists every confirmed or pending booking, grouped
// into one calendar event per session, with each person's name, places and phone in the notes.
//
// The booking query is a business-level call that reads every customer's details, so it is
// elevated here and only ever reached through the token-checked route.
//
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-reader-v2/query-extended-bookings.md
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-reader-v2/supported-filters.md
import { auth } from "@wix/essentials";
import { extendedBookings } from "@wix/bookings";
import { STUDIO_ADDRESS, type FeedEvent } from "../../lib/calendar";

type Raw = Record<string, any>;

const elevatedQueryBookings = auth.elevate(extendedBookings.queryExtendedBookings);

const DAY = 24 * 60 * 60 * 1000;
/** Recent past for looking back at who came; a year ahead covers anything bookable. */
const LOOK_BACK_DAYS = 60;
const LOOK_AHEAD_DAYS = 366;
const MAX_BOOKINGS = 2000;

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
  const parts = [name, ...(n > 1 ? [`${n} places`] : []), ...(c.phone ? [c.phone] : [])];
  return `• ${parts.join(" · ")}${b.status === "PENDING" ? " (awaiting your confirmation)" : ""}`;
}

function locationOf(b: Raw): string {
  const loc: Raw = b.bookedEntity?.slot?.location ?? {};
  if (!loc.locationType || loc.locationType === "OWNER_BUSINESS" || loc.locationType === "UNDEFINED") return STUDIO_ADDRESS;
  return loc.formattedAddress ?? loc.name ?? "";
}

/** One event per session (a class session's event id; otherwise the service at that time). */
export async function rosterEvents(now = new Date()): Promise<FeedEvent[]> {
  const sessions = new Map<string, Raw[]>();
  for (const b of await queryBookings(now)) {
    const slot: Raw = b.bookedEntity?.slot ?? {};
    const key = slot.eventId || `${slot.serviceId ?? b.bookedEntity?.title}-${toIso(b.startDate)}`;
    sessions.set(key, [...(sessions.get(key) ?? []), b]);
  }
  return [...sessions.entries()].map(([key, group]) => {
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
}
