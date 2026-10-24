// SERVER ONLY. The logged-in member's own bookings, event tickets and shop orders, and the two
// booking changes a customer may make (cancel, move to another time).
//
// Why a server module: the Wix calls that list bookings and orders are business-level calls (they
// can read every customer's data), so they must never run in the browser. Following the kit's
// CUSTOM_OPERATIONS.md pattern, the API routes in src/pages/api/account/ read the caller's own
// session here, decide WHOSE data to read on the server, and only then elevate the one SDK call.
// The browser never chooses a contact, email or member id.
//
// Who counts as "the same person":
//   - Always: things done while logged in (bookings created by this member, orders with this memberId).
//   - Only when the login email is VERIFIED: things booked under that email before signing up
//     (matched by the Wix contact the email belongs to). Without verification anyone could sign up
//     with somebody else's email and read their bookings.
//
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-reader-v2/query-extended-bookings.md
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-writer-v2/cancel-booking.md
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-writer-v2/reschedule-booking.md
// docs: https://dev.wix.com/docs/api-reference/business-solutions/events/registration/ticketing/orders/list-orders.md
// docs: https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/orders/search-orders.md
import { auth } from "@wix/essentials";
import { members } from "@wix/members";
import { bookings, extendedBookings } from "@wix/bookings";
import { orders as eventOrders } from "@wix/events";
import { orders as ecomOrders } from "@wix/ecom";
import { fetchServices } from "../bookings/services";
import { fetchEventById } from "../events/events";
import { WIX_STORES_APP_ID } from "../storefront/cart-core";
import type { AccountBooking, AccountOverview, AccountShopOrder, AccountTicketOrder, BookingActionRequest } from "./types";

type Raw = Record<string, any>;

const elevatedQueryBookings = auth.elevate(extendedBookings.queryExtendedBookings);
const elevatedCancelBooking = auth.elevate(bookings.cancelBooking);
const elevatedRescheduleBooking = auth.elevate(bookings.rescheduleBooking);
const elevatedListEventOrders = auth.elevate(eventOrders.listOrders);
const elevatedSearchShopOrders = auth.elevate(ecomOrders.searchOrders);

export interface Caller {
  memberId: string;
  contactId: string;
  email: string;
  emailVerified: boolean;
}

/** The logged-in member making this request (read from their own session), or null. */
export async function currentCaller(): Promise<Caller | null> {
  try {
    const { member } = (await members.getCurrentMember({ fieldsets: ["FULL"] as any })) as { member?: Raw };
    const memberId = member?._id ?? member?.id ?? "";
    if (!memberId) return null;
    return {
      memberId,
      contactId: member?.contactId ?? "",
      email: String(member?.loginEmail ?? "").trim().toLowerCase(),
      emailVerified: member?.loginEmailVerified === true,
    };
  } catch {
    return null;
  }
}

// ─── Bookings ───────────────────────────────────────────────────────────────────────────

/**
 * The caller's bookings. Wix's booking query filters by contact but not by creator (tested: a
 * `createdBy.id.memberId` filter is rejected), so: query by the member's contact, then, unless the
 * login email is verified, keep only bookings this member made while logged in (`createdBy`).
 * A member's contact is the one their email belongs to, so without that second step an
 * unverified sign-up with someone else's email would see that person's bookings.
 */
async function queryCallerBookings(caller: Caller, extra: Raw = {}): Promise<Raw[]> {
  if (!caller.contactId) return [];
  const out: Raw[] = [];
  let cursor: string | undefined;
  do {
    const query: Raw = cursor
      ? { cursorPaging: { limit: 100, cursor } }
      : { filter: { "contactDetails.contactId": caller.contactId, ...extra }, sort: [{ fieldName: "startDate", order: "DESC" }], cursorPaging: { limit: 100 } };
    const res = (await elevatedQueryBookings(query as any, { withBookingAllowedActions: true })) as Raw;
    out.push(...((res.extendedBookings ?? []) as Raw[]));
    cursor = res.pagingMetadata?.cursors?.next ?? undefined;
  } while (cursor && out.length < 500);
  return caller.emailVerified ? out : out.filter((eb) => eb.booking?.createdBy?.memberId === caller.memberId);
}

async function serviceIndex(): Promise<Map<string, { slug: string; type: AccountBooking["serviceType"] }>> {
  const map = new Map<string, { slug: string; type: AccountBooking["serviceType"] }>();
  try {
    const page = await fetchServices({ limit: 100 });
    for (const s of page.items) map.set(s.id, { slug: s.slug, type: s.type });
  } catch {
    /* names still come from the booking itself */
  }
  return map;
}

function toAccountBooking(eb: Raw, services: Map<string, { slug: string; type: AccountBooking["serviceType"] }>): AccountBooking {
  const b: Raw = eb.booking ?? {};
  const slot: Raw = b.bookedEntity?.slot ?? b.bookedEntity?.schedule ?? {};
  const serviceId: string = slot.serviceId ?? "";
  const svc = services.get(serviceId);
  return {
    id: b._id ?? b.id ?? "",
    serviceId,
    serviceName: b.bookedEntity?.title ?? "Booking",
    serviceSlug: svc?.slug ?? "",
    serviceType: svc?.type ?? "",
    startIso: toIso(b.startDate ?? slot.startDate),
    endIso: toIso(b.endDate ?? slot.endDate),
    status: b.status ?? "",
    participants: Number(b.totalParticipants ?? b.numberOfParticipants ?? 1) || 1,
    canCancel: eb.allowedActions?.cancel === true,
    canReschedule: eb.allowedActions?.reschedule === true,
  };
}

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : typeof v === "string" ? v : "");

export async function listBookings(caller: Caller): Promise<AccountBooking[]> {
  const [raws, services] = await Promise.all([queryCallerBookings(caller), serviceIndex()]);
  return raws.map((eb) => toAccountBooking(eb, services)).filter((b) => b.id);
}

// ─── Event tickets ──────────────────────────────────────────────────────────────────────

export async function listTicketOrders(caller: Caller): Promise<AccountTicketOrder[]> {
  const fieldset = ["DETAILS", "TICKETS"] as any;
  const byMember = (await elevatedListEventOrders({ memberId: [caller.memberId], fieldset, limit: 100 } as any)) as Raw;
  const found: Raw[] = [...((byMember.orders ?? []) as Raw[])];
  if (caller.emailVerified && caller.email) {
    // Search matches name/email/order number loosely; keep only this exact verified email.
    const byEmail = (await elevatedListEventOrders({ searchPhrase: caller.email, fieldset, limit: 100 } as any)) as Raw;
    for (const o of (byEmail.orders ?? []) as Raw[]) {
      if (String(o.email ?? "").trim().toLowerCase() === caller.email) found.push(o);
    }
  }
  const unique = new Map<string, Raw>();
  for (const o of found) if (o.orderNumber && !unique.has(o.orderNumber)) unique.set(o.orderNumber, o);
  const paidLike = new Set(["PAID", "FREE", "OFFLINE_PENDING", "PENDING", "AUTHORIZED", "PARTIALLY_PAID"]);
  const kept = [...unique.values()].filter((o) => paidLike.has(o.status));

  const events = new Map<string, Raw | null>();
  await Promise.all(
    [...new Set(kept.map((o) => o.eventId as string))].map(async (id) => {
      try {
        events.set(id, (await fetchEventById(id)) as Raw | null);
      } catch {
        events.set(id, null);
      }
    }),
  );

  return kept
    .map((o): AccountTicketOrder => {
      const ev = events.get(o.eventId) ?? null;
      const f: Raw = ev?.formatted ?? {};
      return {
        orderNumber: o.orderNumber,
        eventTitle: ev?.title ?? "Event",
        eventSlug: ev?.slug ?? "",
        dateLabel: [f.startDate, f.startTime].filter(Boolean).join(", ") + (f.endDate && f.endDate !== f.startDate ? ` – ${f.endDate}` : ""),
        startIso: ev?.startDateIso ?? "",
        tickets: Number(o.ticketsQuantity ?? (o.tickets ?? []).length) || 0,
        status: o.status ?? "",
        total: o.totalPrice?.value ? formatGbp(o.totalPrice.value, o.totalPrice.currency) : "",
        pdfUrl: typeof o.ticketsPdf === "string" ? o.ticketsPdf : "",
      };
    })
    .sort((a, b) => b.startIso.localeCompare(a.startIso));
}

function formatGbp(value: string, currency = "GBP"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);
  } catch {
    return `${value} ${currency}`;
  }
}

// ─── Shop orders ────────────────────────────────────────────────────────────────────────

export async function listShopOrders(caller: Caller): Promise<AccountShopOrder[]> {
  const mine: Raw[] = [{ "buyerInfo.memberId": { $eq: caller.memberId } }];
  if (caller.emailVerified && caller.contactId) mine.push({ "buyerInfo.contactId": { $eq: caller.contactId } });
  const res = (await elevatedSearchShopOrders({
    filter: mine.length === 1 ? mine[0] : { $or: mine },
    sort: [{ fieldName: "createdDate", order: "DESC" }],
    cursorPaging: { limit: 100 },
  } as any)) as Raw;
  return ((res.orders ?? []) as Raw[])
    .map((o): AccountShopOrder | null => {
      // Bookings and event tickets paid at checkout also make eCommerce orders; they are listed in
      // their own sections, so keep only shop (Wix Stores) items here.
      const items = ((o.lineItems ?? []) as Raw[]).filter((li) => li.catalogReference?.appId === WIX_STORES_APP_ID);
      if (!items.length) return null;
      return {
        id: o._id ?? o.id ?? "",
        number: String(o.number ?? ""),
        createdIso: toIso(o._createdDate ?? o.createdDate),
        items: items.map((li) => ({ name: li.productName?.translated ?? li.productName?.original ?? "Item", quantity: Number(li.quantity ?? 1) || 1 })),
        total: o.priceSummary?.total?.formattedAmount ?? "",
        paymentStatus: o.paymentStatus ?? "",
        collected: o.fulfillmentStatus === "FULFILLED",
        cancelled: o.status === "CANCELED",
      };
    })
    .filter((o): o is AccountShopOrder => o !== null);
}

// ─── Overview ───────────────────────────────────────────────────────────────────────────

export async function accountOverview(caller: Caller): Promise<AccountOverview> {
  const failed: AccountOverview["failed"] = [];
  const guard = async <T>(name: AccountOverview["failed"][number], fn: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await fn();
    } catch (e) {
      console.error(`[account] ${name} failed`, e);
      failed.push(name);
      return [];
    }
  };
  const [b, t, o] = await Promise.all([
    guard("bookings", () => listBookings(caller)),
    guard("tickets", () => listTicketOrders(caller)),
    guard("orders", () => listShopOrders(caller)),
  ]);
  return { emailVerified: caller.emailVerified, bookings: b, tickets: t, orders: o, failed };
}

// ─── Booking changes ────────────────────────────────────────────────────────────────────

export class AccountError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

function isTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Cancel or move one of the caller's own bookings. The booking is re-read on the server with the
 * caller's scope, so a booking id that isn't theirs is simply "not found"; Wix's own allowed
 * actions (the service's cancellation / reschedule policy) must allow the change; the policy is
 * never overridden. The customer gets Wix's usual email about the change.
 */
export async function changeBooking(caller: Caller, req: BookingActionRequest): Promise<void> {
  if (!req || typeof req.bookingId !== "string" || !/^[0-9a-f-]{36}$/i.test(req.bookingId)) throw new AccountError("Unknown booking.", 400);
  const [eb] = await queryCallerBookings(caller, { id: req.bookingId });
  const booking: Raw | undefined = eb?.booking;
  if (!booking) throw new AccountError("We couldn't find that booking on your account.", 404);
  const revision = String(booking.revision ?? "");
  const notify = { notifyParticipants: true };

  if (req.action === "cancel") {
    if (eb.allowedActions?.cancel !== true) throw new AccountError("This booking can no longer be cancelled online. Please get in touch.", 409);
    await elevatedCancelBooking(req.bookingId, { revision, participantNotification: notify } as any);
    return;
  }

  if (req.action === "reschedule") {
    if (eb.allowedActions?.reschedule !== true) throw new AccountError("This booking can no longer be moved online. Please get in touch.", 409);
    const s = req.slot;
    if (!s || !LOCAL_DATETIME.test(s.startLocal) || !LOCAL_DATETIME.test(s.endLocal) || !isTimeZone(s.timeZone)) throw new AccountError("Pick a new time.", 400);
    const current: Raw = booking.bookedEntity?.slot ?? {};
    if (!current.serviceId) throw new AccountError("This booking can't be moved online. Please get in touch.", 409);
    // Same service, same place and (for 1-1s) the same teacher; only the time changes. Wix checks
    // that the new time is free and allowed by the policy.
    const slot: Raw = {
      serviceId: current.serviceId,
      startDate: s.startLocal,
      endDate: s.endLocal,
      // The local times are in the zone the slot list was computed in, not necessarily the booking's.
      timezone: s.timeZone,
      ...(s.eventId ? { eventId: s.eventId } : {}),
      ...(s.scheduleId ? { scheduleId: s.scheduleId } : current.scheduleId ? { scheduleId: current.scheduleId } : {}),
      ...(current.location ? { location: current.location } : {}),
      ...(current.resource ? { resource: current.resource } : {}),
    };
    await elevatedRescheduleBooking(req.bookingId, slot as any, {
      revision,
      totalParticipants: Number(booking.totalParticipants ?? 1) || 1,
      participantNotification: notify,
    } as any);
    return;
  }

  throw new AccountError("Unknown action.", 400);
}
