// What the account page shows: plain DTOs built on the server (src/wix/account/server.ts) from the
// logged-in member's own bookings, event tickets and shop orders. Nothing here is a raw Wix entity.

export interface AccountBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  /** For the "Book again" link and the reschedule slot list; "" when the service is gone. */
  serviceSlug: string;
  serviceType: "APPOINTMENT" | "CLASS" | "COURSE" | "";
  /** UTC instants. */
  startIso: string;
  endIso: string;
  /** "CONFIRMED", "PENDING", "CANCELED", … (Wix booking status). */
  status: string;
  participants: number;
  /** Wix's own answer for this booking under the service's policy. */
  canCancel: boolean;
  canReschedule: boolean;
}

export interface AccountTicketOrder {
  orderNumber: string;
  eventTitle: string;
  eventSlug: string;
  /** The event's own display date ("November 21, 2026 at 9:00 AM – …"). */
  dateLabel: string;
  startIso: string;
  tickets: number;
  /** "PAID", "FREE", "OFFLINE_PENDING", … (Wix event order status). */
  status: string;
  total: string;
  /** Wix's PDF of the tickets, when there is one. */
  pdfUrl: string;
}

export interface AccountShopOrder {
  id: string;
  number: string;
  createdIso: string;
  items: { name: string; quantity: number }[];
  total: string;
  /** Wix payment status: "PAID", "NOT_PAID", "PARTIALLY_REFUNDED", … */
  paymentStatus: string;
  /** True once Saskia marks it fulfilled (collected) in the dashboard. */
  collected: boolean;
  cancelled: boolean;
}

export interface AccountOverview {
  /**
   * Whether the login email is verified. Only then are bookings made under that email before
   * signing up included; otherwise only what was booked while logged in.
   */
  emailVerified: boolean;
  bookings: AccountBooking[];
  tickets: AccountTicketOrder[];
  orders: AccountShopOrder[];
  /** Sections that failed to load (each loads on its own; one failure never hides the rest). */
  failed: ("bookings" | "tickets" | "orders")[];
}

/** What the browser sends to change a booking. The server re-checks ownership and Wix's allowed actions. */
export type BookingActionRequest =
  | { action: "cancel"; bookingId: string }
  | { action: "reschedule"; bookingId: string; slot: { startLocal: string; endLocal: string; eventId: string | null; scheduleId: string | null; /** IANA zone the local times are in (the slots page's). */ timeZone: string } };
