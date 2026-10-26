// The account page for a logged-in member: their details, their classes (with cancel / change
// time where Saskia's booking policy allows it), their retreat & event tickets, and their shop
// orders. Data comes from /api/account (server-side, the member's own only); see
// src/wix/account/server.ts. Mounted inside <RequireAuth> by AccountPage.
import { useCallback, useEffect, useState } from "react";
import { useMember } from "../../hooks/members/useMember";
import type { CurrentMember } from "../../wix/members/types";
import type { AccountBooking, AccountOverview, AccountShopOrder, AccountTicketOrder } from "../../wix/account/types";
import { SessionExpiredError, dateLabel, fetchAccountOverview, isPast, whenLabel } from "../../wix/account/client";
import RescheduleBooking from "./RescheduleBooking";
import CancelBooking from "./CancelBooking";
import AddToCalendar from "../ui/AddToCalendar";
import { STUDIO_ADDRESS, calendarLinks } from "../../lib/calendar";

export interface AccountViewProps {
  initialMember?: CurrentMember | null;
}

const card = "rounded-lg border border-border bg-background p-5 sm:p-6";
const pill = "inline-flex items-center rounded-control px-3 py-1 text-xs font-bold";

export default function AccountView({ initialMember }: AccountViewProps) {
  const { member, loggedIn, loading, error, logout } = useMember({ initialMember });
  const [data, setData] = useState<AccountOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  // "Cancelled…" / "Moved…": shown above the list, since the changed row drops out when it reloads.
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    fetchAccountOverview().then(setData, (e: Error) => {
      setExpired(e instanceof SessionExpiredError);
      setLoadError(e.message);
    });
  }, []);

  const changed = useCallback(
    (message: string) => {
      setNotice(message);
      load();
    },
    [load],
  );

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn, load]);

  if (loading) return <div className="h-40 animate-pulse rounded-lg bg-secondary" aria-busy="true" />;
  if (!loggedIn) return <p className="py-16 text-center text-muted-foreground">You're logged out.</p>;

  const upcoming = (data?.bookings ?? []).filter((b) => !isPast(b.endIso || b.startIso) && b.status !== "CANCELED" && b.status !== "DECLINED").reverse();
  const pastOrCancelled = (data?.bookings ?? []).filter((b) => !upcoming.includes(b));
  const ticketsUpcoming = (data?.tickets ?? []).filter((t) => !isPast(t.startIso)).reverse();
  const ticketsPast = (data?.tickets ?? []).filter((t) => isPast(t.startIso));

  return (
    <div className="space-y-10">
      {/* Profile */}
      <section className={`${card} flex flex-wrap items-center justify-between gap-4`} aria-label="Your details">
        <div className="flex min-w-0 items-center gap-4">
          {member?.photoUrl ? (
            <img src={member.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blush-soft text-xl font-bold text-sage-deep">
              {(member?.displayName ?? "M").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{member?.displayName ?? "Your account"}</p>
            {member?.loginEmail && <p className="truncate text-sm text-muted-foreground">{member.loginEmail}</p>}
          </div>
        </div>
        <button type="button" onClick={() => void logout()} className="link-pill">
          Log out
        </button>
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </section>

      {loadError &&
        (expired ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-blush-soft px-4 py-3 text-sm">
            <p>{loadError}</p>
            <a href="/login?returnTo=/account" className="btn">
              Log in again
            </a>
          </div>
        ) : (
          <p className="rounded-md bg-blush-soft px-4 py-3 text-sm">
            {loadError}{" "}
            <button type="button" onClick={load} className="font-semibold underline">
              Try again
            </button>
          </p>
        ))}
      {!data && !loadError && <div className="h-48 animate-pulse rounded-lg bg-secondary" aria-busy="true" />}

      {data && (
        <>
          {!data.emailVerified && (
            <p className="rounded-md bg-secondary px-4 py-3 text-sm">
              Showing what you've booked while logged in. Bookings you made before creating your account will appear here once your email address has
              been confirmed.
            </p>
          )}

          {/* Classes */}
          <section aria-labelledby="acc-classes">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 id="acc-classes" className="text-2xl text-sage">
                My classes
              </h2>
              <a href="/services" className="link-pill">
                Book a class
              </a>
            </div>
            <div role="status">
              {notice && <p className="mb-3 rounded-md bg-secondary px-4 py-3 text-sm font-semibold text-sage-deep">{notice}</p>}
            </div>
            {data.failed.includes("bookings") ? (
              <SectionError onRetry={load} />
            ) : upcoming.length === 0 ? (
              <Empty text="No upcoming classes." />
            ) : (
              <ul className="space-y-3">
                {upcoming.map((b) => (
                  <BookingRow key={b.id} booking={b} onChanged={changed} />
                ))}
              </ul>
            )}
            {pastOrCancelled.length > 0 && (
              <details className="mt-4 rounded-md bg-secondary px-5 py-3">
                <summary className="cursor-pointer text-sm font-semibold">Past and cancelled ({pastOrCancelled.length})</summary>
                <ul className="mt-3 divide-y divide-border text-sm">
                  {pastOrCancelled.map((b) => (
                    <li key={b.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
                      <span className="min-w-0 break-words font-medium">{b.serviceName}</span>
                      <span className="text-muted-foreground">
                        {whenLabel(b.startIso)}
                        {b.status === "CANCELED" ? " · cancelled" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* Retreats & events */}
          <section aria-labelledby="acc-events">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 id="acc-events" className="text-2xl text-sage">
                Retreats &amp; events
              </h2>
              <a href="/events" className="link-pill">
                See what's on
              </a>
            </div>
            {data.failed.includes("tickets") ? (
              <SectionError onRetry={load} />
            ) : ticketsUpcoming.length === 0 ? (
              <Empty text="No upcoming retreats or events." />
            ) : (
              <ul className="space-y-3">
                {ticketsUpcoming.map((t) => (
                  <TicketRow key={t.orderNumber} order={t} />
                ))}
              </ul>
            )}
            {ticketsPast.length > 0 && (
              <details className="mt-4 rounded-md bg-secondary px-5 py-3">
                <summary className="cursor-pointer text-sm font-semibold">Past ({ticketsPast.length})</summary>
                <ul className="mt-3 divide-y divide-border text-sm">
                  {ticketsPast.map((t) => (
                    <li key={t.orderNumber} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
                      <span className="min-w-0 break-words font-medium">{t.eventTitle}</span>
                      <span className="text-muted-foreground">{t.dateLabel}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* Shop orders */}
          <section aria-labelledby="acc-orders">
            <h2 id="acc-orders" className="mb-4 text-2xl text-sage">
              Shop orders
            </h2>
            {data.failed.includes("orders") ? (
              <SectionError onRetry={load} />
            ) : data.orders.length === 0 ? (
              <Empty text="No shop orders yet." />
            ) : (
              <ul className="space-y-3">
                {data.orders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </ul>
            )}
          </section>

          <p className="text-sm text-muted-foreground">
            Need to change something else? <a href="/contact" className="font-semibold underline decoration-blush decoration-2 underline-offset-4">Get in touch</a>.
            {" "}
            <a href="/policies" className="underline decoration-blush decoration-2 underline-offset-4">Terms &amp; Conditions</a>
          </p>
        </>
      )}
    </div>
  );
}

function BookingRow({ booking: b, onChanged }: { booking: AccountBooking; onChanged: (message: string) => void }) {
  const [mode, setMode] = useState<"idle" | "reschedule" | "cancel">("idle");
  const canMove = b.canReschedule && (b.serviceType === "CLASS" || b.serviceType === "APPOINTMENT");
  const finish = (message: string) => {
    setMode("idle");
    onChanged(message);
  };
  return (
    <li className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold">{b.serviceName}</p>
          <p className="mt-0.5 text-sm">{whenLabel(b.startIso, b.endIso)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {b.participants > 1 ? `${b.participants} places · ` : ""}
            {b.status === "PENDING" ? "Waiting for Saskia to confirm" : "Confirmed"}
          </p>
        </div>
        {mode === "idle" && (
          <div className="flex flex-wrap gap-2">
            {b.serviceType !== "COURSE" && b.startIso && b.endIso && (
              <AddToCalendar links={calendarLinks({ title: b.serviceName, startIso: b.startIso, endIso: b.endIso, location: STUDIO_ADDRESS })} />
            )}
            {canMove && (
              <button type="button" className="link-pill" onClick={() => setMode("reschedule")}>
                Change time
              </button>
            )}
            {b.canCancel && (
              <button type="button" className="link-pill" onClick={() => setMode("cancel")}>
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
      {mode === "reschedule" && <RescheduleBooking booking={b} onDone={() => finish("Moved. A confirmation email is on its way.")} onClose={() => setMode("idle")} />}
      {mode === "cancel" && <CancelBooking booking={b} onDone={() => finish("Cancelled. A confirmation email is on its way.")} onClose={() => setMode("idle")} />}
      {!b.canCancel && !canMove && (
        <p className="mt-3 text-xs text-muted-foreground">To change this booking, please <a href="/contact" className="underline">get in touch</a>.</p>
      )}
    </li>
  );
}

function TicketRow({ order: t }: { order: AccountTicketOrder }) {
  return (
    <li className={`${card} flex flex-wrap items-start justify-between gap-3`}>
      <div className="min-w-0">
        <p className="break-words font-semibold">
          {t.eventSlug ? (
            <a href={`/events/${encodeURIComponent(t.eventSlug)}`} className="no-underline hover:underline">
              {t.eventTitle}
            </a>
          ) : (
            t.eventTitle
          )}
        </p>
        <p className="mt-0.5 text-sm">{t.dateLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.tickets} {t.tickets === 1 ? "place" : "places"}
          {t.total ? ` · ${t.total}` : ""} · order {t.orderNumber}
          {t.status === "OFFLINE_PENDING" ? " · payment due" : ""}
        </p>
      </div>
      {t.pdfUrl && (
        <a href={t.pdfUrl} target="_blank" rel="noopener" className="link-pill">
          Tickets (PDF)
        </a>
      )}
    </li>
  );
}

function OrderRow({ order: o }: { order: AccountShopOrder }) {
  const state = o.cancelled ? "Cancelled" : o.collected ? "Collected" : "Ready to collect";
  return (
    <li className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">Order {o.number}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{dateLabel(o.createdIso)}</p>
        </div>
        <span className={`${pill} ${o.cancelled ? "bg-secondary" : o.collected ? "bg-secondary text-sage-deep" : "bg-blush-soft"}`}>{state}</span>
      </div>
      <ul className="mt-3 text-sm">
        {o.items.map((i, n) => (
          <li key={n} className="break-words">
            {i.quantity > 1 ? `${i.quantity} × ` : ""}
            {i.name}
          </li>
        ))}
      </ul>
      {o.total && <p className="mt-2 text-sm font-bold">{o.total}</p>}
      {!o.collected && !o.cancelled && <p className="mt-2 text-xs text-muted-foreground">Collect from Felcote, Felden Lane, or at your next class.</p>}
    </li>
  );
}

const Empty = ({ text }: { text: string }) => <p className="rounded-md bg-secondary px-4 py-4 text-sm text-muted-foreground">{text}</p>;

const SectionError = ({ onRetry }: { onRetry: () => void }) => (
  <p className="rounded-md bg-blush-soft px-4 py-3 text-sm">
    This part didn't load.{" "}
    <button type="button" onClick={onRetry} className="font-semibold underline">
      Try again
    </button>
  </p>
);
