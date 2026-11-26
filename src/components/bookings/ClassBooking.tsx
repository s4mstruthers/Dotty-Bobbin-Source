// The booking panel on a class page — restyled from the kit's reference booking surface. All booking
// logic stays in the shipped useBookingFlow hook (slots, capacity, the form, checkout-or-place);
// this file only decides how it looks. Mount client:only="react" (availability is per visitor).
// One day at a time: a strip of days with times, then that day's times split into morning /
// afternoon / evening, then the booking form and one pink button. A class takes several dates at
// once (26 Nov 2026): every time tapped is added to "Your dates", across weeks, and they're all
// booked and paid for in one checkout.
import { useEffect, useState } from "react";
import { useBookingFlow } from "../../hooks/bookings/useBookingFlow";
import { useMember } from "../../hooks/members/useMember";
import type { BookingFormField, CtaState, ServiceDetail } from "../../wix/bookings/types";
import { priceForDates, priceWithAddOns } from "../../wix/bookings/booking-core";
import AddToCalendar from "../ui/AddToCalendar";
import { calendarLinks, forgetBookedEvent, slotCalendarEvent } from "../../lib/calendar";
import PolicyNote from "../ui/PolicyNote";
import ClassDatePicker from "./ClassDatePicker";

const chip = (selected: boolean, disabled = false) =>
  `rounded-control border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors ${
    disabled
      ? "cursor-not-allowed border-border text-muted-foreground line-through opacity-60"
      : selected
        ? "border-sage bg-secondary text-sage-deep ring-2 ring-sage/30"
        : "border-border text-foreground hover:border-sage hover:bg-secondary"
  }`;

const addOnCard = (selected: boolean, disabled: boolean) =>
  `max-w-md overflow-hidden rounded-md border-[1.5px] transition-colors ${
    disabled ? "border-border opacity-60" : selected ? "border-sage bg-secondary ring-2 ring-sage/30" : "border-border hover:border-sage hover:bg-secondary"
  }`;


const input = "w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25";
const headingText = "block text-xs font-bold uppercase tracking-wider text-sage-deep";
const heading = `mb-2 ${headingText}`;

const fmtDay = (dayKey: string, opts: Intl.DateTimeFormatOptions): string => {
  try {
    return new Date(`${dayKey}T12:00:00`).toLocaleDateString("en-GB", opts);
  } catch {
    return dayKey;
  }
};

/** What the browser fills in for a detail field (by its target, else its type). */
const autoCompleteOf = (f: BookingFormField): string | undefined => {
  if (f.target === "first_name") return "given-name";
  if (f.target === "last_name") return "family-name";
  if (f.target === "email" || f.type === "EMAIL") return "email";
  if (f.target === "phone" || f.type === "PHONE") return "tel";
  return undefined;
};

/** "your name and email" — the required details still empty, in plain words. */
const missingDetails = (fields: BookingFormField[], values: Record<string, string>): string => {
  const words: string[] = [];
  for (const f of fields) {
    if (!f.required || (values[f.target] ?? "").trim()) continue;
    const t = f.target;
    const word = t === "first_name" || t === "last_name" ? "name" : t === "email" || f.type === "EMAIL" ? "email" : t === "phone" || f.type === "PHONE" ? "phone number" : f.label.toLowerCase();
    if (!words.includes(word)) words.push(word);
  }
  if (!words.length) return "";
  const list = words.length === 1 ? words[0] : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
  return `Fill in your ${list}`;
};

const dateLabel = (iso: string | null): string => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
};

/** The CTA label follows ctaState, then the money: the deposit when one is being paid, else the price (with any add-ons picked). */
function ctaLabel(service: ServiceDetail, ctaState: CtaState, payDeposit: boolean, total: string, dates = 1): string {
  if (ctaState === "viewCourse") return "Not available";
  const verb = `${ctaState === "requestToBook" ? "Request to book" : "Book"}${dates > 1 ? ` ${dates} dates` : ""}`;
  if (dates > 1) {
    if (service.free) return `${verb} — free`;
    if (service.deposit && payDeposit && service.deposit.amount) return `${verb} · deposit ${service.deposit.amount} each`;
    return total ? `${verb} · ${total}` : verb;
  }
  if (service.free) return `${verb} — free`;
  if (service.deposit && payDeposit && service.deposit.amount) return `${verb} · deposit ${service.deposit.amount}`;
  if (total) return `${verb} · ${total}`;
  if (!service.price) return verb;
  return `${verb} · ${service.priceFrom ? "from " : ""}${service.price}`;
}

export default function ClassBooking({ service }: { service: ServiceDetail }) {
  const {
    days,
    slotsFailed,
    retrySlots,
    staffId,
    setStaffId,
    selectedSlot,
    selectedSlots,
    multiDate,
    toggleSlot,
    calendarMonth,
    canGoToPrevMonth,
    nextMonth,
    prevMonth,
    slotAddOns,
    toggleSlotAddOn,
    setSlotAddOnQuantity,
    canSelectMoreFor,
    timeZoneLabel,
    course,
    offeredDays,
    sessions,
    hasMoreSessions,
    loadMoreSessions,
    participants,
    maxParticipants,
    setParticipants,
    payDeposit,
    setPayDeposit,
    addOnGroups,
    addOns,
    toggleAddOn,
    setAddOnQuantity,
    canSelectMore,
    formFields,
    formLoaded,
    values,
    setValue,
    ctaState,
    canBook,
    book,
    booking,
    confirmed,
    error,
    timeZone,
  } = useBookingFlow(service);
  const [activeDay, setActiveDay] = useState<string | null>(null);

  // A class kept for a checkout that was left (they came back here) mustn't be offered as
  // "Add to calendar" after a later shop order.
  useEffect(() => forgetBookedEvent(), []);

  // Logged-in customers: fill in their name and email (only fields this booking form has, and
  // only while still empty, so nothing they typed is overwritten). The booking then belongs to
  // their account as well as their email.
  const { member, loggedIn, loading: memberLoading } = useMember();
  // Times are shown to everyone; at "Your details" a visitor who isn't logged in chooses: log in
  // (and come back here) or book as a guest. The guest choice lasts for the visit, so it isn't
  // asked again on every class page.
  // ?guest=1 comes from the login page's "Book as a guest" (for anyone stuck at the email code).
  const [asGuest, setAsGuest] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).get("guest") === "1") {
        sessionStorage.setItem("book-as-guest", "1");
        return true;
      }
      return sessionStorage.getItem("book-as-guest") === "1";
    } catch {
      return false;
    }
  });
  const continueAsGuest = () => {
    setAsGuest(true);
    try {
      sessionStorage.setItem("book-as-guest", "1");
    } catch {}
  };
  useEffect(() => {
    if (!member) return;
    const known: Record<string, string> = { first_name: member.firstName, last_name: member.lastName, email: member.loginEmail };
    for (const f of formFields) {
      const v = known[f.target];
      if (v && !(values[f.target] ?? "").trim()) setValue(f.target, v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, formFields]);

  // Follow the data: land on the first day with availability, and don't strand the view on a day
  // that left when the week moved.
  useEffect(() => {
    if (days && days.length && !days.some((d) => d.dayKey === activeDay)) setActiveDay(days[0].dayKey);
  }, [days, activeDay]);

  const isCourse = service.type === "COURSE";
  // The zone note only matters to a visitor whose own clock differs.
  const visitorZone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  })();
  const showZone = !!timeZoneLabel && !!timeZone && timeZone !== visitorZone;
  // Under a greyed-out Book button: what's still missing.
  const bookHint =
    canBook || booking || ctaState === "viewCourse" || !formLoaded
      ? ""
      : !isCourse && !selectedSlot
        ? "Pick a time first"
        : missingDetails(formFields, values);
  const dateCount = multiDate ? selectedSlots.length : 1;

  if (confirmed) {
    const several = multiDate && selectedSlots.length > 1;
    const when = isCourse ? (service.course?.startDate ? ` — starts ${dateLabel(service.course.startDate)}` : "") : several ? ` — ${selectedSlots.length} dates` : selectedSlot ? ` — ${fmtDay(selectedSlot.dayKey, { weekday: "long", day: "numeric", month: "long" })} at ${selectedSlot.label}` : "";
    return (
      <div className="rounded-lg bg-secondary p-8 text-center">
        <p className="font-display text-2xl font-bold text-sage">{ctaState === "requestToBook" ? "Request sent" : "You're booked!"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {service.name}
          {when}.{" "}
          {ctaState === "requestToBook" ? "You'll hear back once the request is approved." : "A confirmation email is on its way."}
        </p>
        {several ? (
          <ul className="mx-auto mt-5 max-w-sm space-y-3 text-left text-sm">
            {selectedSlots.map((s) => (
              <li key={s.key} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{fmtDay(s.dayKey, { weekday: "short", day: "numeric", month: "short" })} at {s.label}</span>
                <AddToCalendar links={calendarLinks(slotCalendarEvent(service, s, timeZone))} className="link-pill bg-background" />
              </li>
            ))}
          </ul>
        ) : (
          !isCourse &&
          selectedSlot && (
            <div className="mt-5">
              <AddToCalendar links={calendarLinks(slotCalendarEvent(service, selectedSlot, timeZone))} className="link-pill bg-background" />
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div>
      {isCourse && (
        <div className="mb-5 rounded-lg border border-border p-4 text-sm">
          <p className={heading}>Course</p>
          {service.course?.startDate && (
            <p>
              {dateLabel(service.course.startDate)}
              {service.course.endDate ? ` – ${dateLabel(service.course.endDate)}` : ""}
            </p>
          )}
          {offeredDays.length > 0 && <p className="mt-1 text-muted-foreground">{offeredDays.map((d) => d.slice(0, 3)).join(", ")}</p>}
          {course && course.spotsLeft != null && (
            <p className="mt-1 text-muted-foreground">{course.full ? "Full" : `${course.spotsLeft} spot${course.spotsLeft === 1 ? "" : "s"} left`}</p>
          )}
          {service.course?.ended && <p className="mt-1 text-muted-foreground">This course has ended.</p>}
        </div>
      )}

      {service.staff.length > 1 && !isCourse && (
        <div className="mb-5">
          <p className={heading}>Staff</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={staffId === undefined} className={chip(staffId === undefined)} onClick={() => setStaffId(undefined)}>
              Anyone
            </button>
            {service.staff.map((m) => (
              <button key={m.id} type="button" aria-pressed={staffId === m.id} className={`${chip(staffId === m.id)} inline-flex items-center gap-2`} onClick={() => setStaffId(m.id)}>
                {m.imageUrl && <img src={m.imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />}
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isCourse && (
        <ClassDatePicker
          multiDate={multiDate}
          service={service}
          days={days}
          slotsFailed={slotsFailed}
          retrySlots={retrySlots}
          calendarMonth={calendarMonth}
          canGoToPrevMonth={canGoToPrevMonth}
          nextMonth={nextMonth}
          prevMonth={prevMonth}
          selectedSlots={selectedSlots}
          toggleSlot={toggleSlot}
          addOnGroups={addOnGroups}
          slotAddOns={slotAddOns}
          toggleSlotAddOn={toggleSlotAddOn}
          setSlotAddOnQuantity={setSlotAddOnQuantity}
          canSelectMoreFor={canSelectMoreFor}
          zoneNote={showZone ? `Times are in ${timeZoneLabel}.` : ""}
          places={participants}
        />
      )}

      {/* A class's sessions are already the times in the picker above. */}
      {service.type !== "CLASS" && sessions && sessions.length > 0 && (
        <div className="mt-6">
          <p className={heading}>Upcoming sessions</p>
          <ul className="space-y-1 text-sm">
            {sessions.map((s) => (
              <li key={s.id} className={s.isCancelled ? "text-muted-foreground line-through" : ""}>
                {s.dayLabel} · {s.label}
                
                {s.isFullyBooked ? " · Full" : s.spotsLeft != null ? ` · ${s.spotsLeft} left` : ""}
              </li>
            ))}
          </ul>
          {hasMoreSessions && (
            <button type="button" className="mt-2 text-sm underline" onClick={() => void loadMoreSessions()}>
              More sessions
            </button>
          )}
        </div>
      )}

      {maxParticipants > 1 && (
        <label className="mt-6 block max-w-md">
          <span className={heading}>{dateCount > 1 ? "Places on each date" : "Participants"}</span>
          <select value={participants} onChange={(e) => setParticipants(Number(e.target.value))} className={input}>
            {Array.from({ length: maxParticipants }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      )}

      {/* A class picks extras per date, on each date's card above. */}
      {addOnGroups.length > 0 && !multiDate && (
        <div className="mt-6 space-y-5">
          {addOnGroups.map((g) => (
            <div key={g.id}>
              <p className={heading}>{g.addOns.length > 1 && g.prompt ? g.prompt : "Extras"}</p>
              <div className="space-y-2">
                {g.addOns.map((a) => {
                  const q = addOns[a.id] ?? 0;
                  const on = q > 0;
                  const blocked = !on && !canSelectMore(g.id);
                  const note = g.addOns.length === 1 && g.prompt ? g.prompt : a.durationMinutes ? `Adds ${a.durationMinutes} min to the session` : "";
                  return (
                    <div key={a.id} className={addOnCard(on, blocked)}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        disabled={blocked}
                        onClick={() => toggleAddOn(a.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed"
                      >
                        <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${on ? "border-sage bg-sage text-white" : "border-border bg-background"}`}>
                          {on && (
                            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3.5 8.5l3 3 6-7" />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-foreground">{a.name}</span>
                          {note && <span className="block text-sm text-muted-foreground">{note}</span>}
                        </span>
                        {a.price && <span className={`shrink-0 font-semibold ${on ? "text-sage-deep" : "text-foreground"}`}>+ {a.price}</span>}
                      </button>
                      {on && a.maxQuantity && a.maxQuantity > 1 && (
                        <label className="flex items-center justify-end gap-2 border-t border-sage/30 px-4 py-2 text-sm text-muted-foreground">
                          How many
                          <select value={q} onChange={(e) => setAddOnQuantity(a.id, Number(e.target.value))} className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground">
                            {Array.from({ length: a.maxQuantity }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {service.deposit?.fullUpfrontAllowed && (
        <div className="mt-6">
          <p className={heading}>Payment</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(payDeposit)} onClick={() => setPayDeposit(true)}>
              Pay deposit{service.deposit.amount ? ` · ${service.deposit.amount}` : ""}
            </button>
            <button type="button" className={chip(!payDeposit)} onClick={() => setPayDeposit(false)}>
              Pay in full{service.price ? ` · ${service.price}` : ""}
            </button>
          </div>
        </div>
      )}

      {memberLoading ? (
        <div className="mt-8 h-32 animate-pulse rounded-lg bg-secondary" aria-busy="true" />
      ) : !loggedIn && !asGuest ? (
        <div className="mt-8 rounded-lg bg-secondary p-5 sm:p-6">
          <p className="font-display text-xl font-bold text-sage">Already have an account?</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in to book — your details are filled in for you, and you can see, cancel or change your classes from your account.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={`/login?returnTo=${encodeURIComponent(window.location.pathname)}`} className="btn">
              Log in to book
            </a>
            <button type="button" onClick={continueAsGuest} className="link-pill justify-center bg-background">
              Continue as guest
            </button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            New here? You can <a href={`/login?returnTo=${encodeURIComponent(window.location.pathname)}`} className="underline">create an account</a> from the login page, or simply book as a guest.
          </p>
        </div>
      ) : (
        <>
          <p className={`${heading} mt-8`}>Your details</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {formFields.map((f) => (
              <label key={f.target} className="block">
                <span className={heading}>{f.label}{f.required ? " *" : ""}</span>
                {f.options?.length ? (
                  <select value={values[f.target] ?? ""} onChange={(e) => setValue(f.target, e.target.value)} className={input}>
                    <option value="">Choose…</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type === "EMAIL" ? "email" : f.type === "PHONE" ? "tel" : f.type === "NUMBER" ? "number" : f.type === "URL" ? "url" : "text"}
                    value={values[f.target] ?? ""}
                    autoComplete={autoCompleteOf(f)}
                    required={f.required}
                    onChange={(e) => setValue(f.target, e.target.value)}
                    className={input}
                  />
                )}
              </label>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <button
            type="button"
            disabled={!canBook || booking}
            onClick={() => book().catch(() => {})}
            className="btn mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none sm:w-auto"
          >
            {booking
              ? "Booking…"
              : ctaLabel(service, ctaState, payDeposit, multiDate ? priceForDates(service, addOnGroups, selectedSlots.map((s) => slotAddOns[s.key] ?? {}), participants) : priceWithAddOns(service, addOnGroups, addOns), dateCount)}
          </button>
          {bookHint && <p className="mt-2 text-sm text-muted-foreground">{bookHint}</p>}
          <PolicyNote />
        </>
      )}
    </div>
  );
}
