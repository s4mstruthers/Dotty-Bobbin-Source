// Picking the dates of a class (26 Nov 2026), made for customers who aren't used to booking sites:
// a month calendar like a paper one (days with classes marked, arrows between months, no long
// scrolling), the chosen day's times as large buttons with "Add", then "Your classes": one card per
// class with ITS OWN extras (machine hire, a project pack…), its price and Remove — so it's always
// clear which class an extra belongs to. Everything picked is booked and paid for in one checkout.
import { useEffect, useRef, useState } from "react";
import type { AddOnGroup, ServiceDetail, Slot } from "../../wix/bookings/types";
import type { AddOnSelection, BookingDay } from "../../wix/bookings/booking-core";
import { dateAmount, formatServiceAmount } from "../../wix/bookings/booking-core";

export interface ClassDatePickerProps {
  service: ServiceDetail;
  /** A group class: several dates, each with its own extras. Otherwise (a 1-to-1) one time; its extras are below. */
  multiDate: boolean;
  days: BookingDay[] | null;
  slotsFailed: boolean;
  retrySlots: () => void;
  calendarMonth: string; // "YYYY-MM-01"
  canGoToPrevMonth: boolean;
  nextMonth: () => void;
  prevMonth: () => void;
  selectedSlots: Slot[];
  toggleSlot: (slot: Slot) => void;
  addOnGroups: AddOnGroup[];
  slotAddOns: Record<string, AddOnSelection>;
  toggleSlotAddOn: (slotKey: string, addOnId: string) => void;
  setSlotAddOnQuantity: (slotKey: string, addOnId: string, quantity: number) => void;
  canSelectMoreFor: (slotKey: string, groupId: string) => boolean;
  zoneNote: string; // "" when the visitor's clock matches
  /** Places booked on each date — the card's price is for all of them. */
  places: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (dayKey: string) => new Date(`${dayKey}T12:00:00`);
const fmt = (dayKey: string, opts: Intl.DateTimeFormatOptions) => {
  try {
    return at(dayKey).toLocaleDateString("en-GB", opts);
  } catch {
    return dayKey;
  }
};
const timeRange = (s: Slot) => `${s.label}${s.endLocal ? ` – ${s.endLocal.slice(11, 16)}` : ""}`;
const placesLeft = (s: Slot) =>
  !s.bookable ? "Full" : s.remainingCapacity != null ? `${s.remainingCapacity} ${s.remainingCapacity === 1 ? "place" : "places"} left` : "";

const checkbox = (on: boolean) =>
  `flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${on ? "border-sage bg-sage text-white" : "border-border bg-background"}`;
const Tick = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

export default function ClassDatePicker(p: ClassDatePickerProps) {
  const { service, days, selectedSlots } = p;
  const byDay = new Map((days ?? []).map((d) => [d.dayKey, d.slots]));
  const pickedKeys = new Set(selectedSlots.map((s) => s.key));
  const pickedDays = new Set(selectedSlots.map((s) => s.dayKey));
  const firstOpenDay = (days ?? []).find((d) => d.slots.some((s) => s.bookable))?.dayKey ?? null;
  const [activeDay, setActiveDay] = useState<string | null>(null);

  // On arrival, skip ahead (up to six months) to the first month with a free place, so nobody
  // lands on an empty calendar. Once they use the arrows themselves, it stays where they put it.
  const touched = useRef(false);
  const skipped = useRef(0);
  useEffect(() => {
    if (days && !p.slotsFailed && !firstOpenDay && !touched.current && skipped.current < 6) {
      skipped.current++;
      p.nextMonth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);
  const goNext = () => {
    touched.current = true;
    p.nextMonth();
  };
  const goPrev = () => {
    touched.current = true;
    p.prevMonth();
  };

  // A new month: open its first day with a free place.
  useEffect(() => {
    if (days && (!activeDay || !byDay.has(activeDay))) setActiveDay(firstOpenDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // The month grid: Monday-first weeks, blanks before the 1st.
  const month = at(p.calendarMonth);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => keyOf(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  while (cells.length % 7) cells.push(null);
  const monthName = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const daySlots = activeDay ? byDay.get(activeDay) ?? [] : [];

  const arrow =
    "flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-border text-xl text-foreground transition-colors hover:border-sage hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div>
      <p className="text-base font-semibold text-foreground">1. Choose a day</p>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        {p.multiDate ? "Days with a class are marked. You can add as many classes as you like." : "Days with free times are marked."}
      </p>

      <div className="rounded-lg border border-border p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" className={arrow} onClick={goPrev} disabled={!p.canGoToPrevMonth} aria-label="Previous month">
            ‹
          </button>
          <p className="text-lg font-semibold text-foreground" aria-live="polite">
            {monthName}
          </p>
          <button type="button" className={arrow} onClick={goNext} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`Class days in ${monthName}`}>
          {WEEKDAYS.map((w) => (
            <span key={w} className="pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {w}
            </span>
          ))}
          {cells.map((dayKey, i) => {
            if (!dayKey) return <span key={`blank-${i}`} />;
            const slots = byDay.get(dayKey);
            const n = Number(dayKey.slice(8));
            if (days === null || !slots?.length) {
              return (
                <span key={dayKey} className="flex h-11 items-center justify-center text-base text-muted-foreground/50 sm:h-12">
                  {n}
                </span>
              );
            }
            const open = slots.some((s) => s.bookable);
            const active = dayKey === activeDay;
            const picked = pickedDays.has(dayKey);
            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setActiveDay(dayKey)}
                aria-pressed={active}
                aria-label={`${fmt(dayKey, { weekday: "long", day: "numeric", month: "long" })}${open ? "" : ", full"}${picked ? ", added" : ""}`}
                className={`relative flex h-11 flex-col items-center justify-center rounded-md text-base font-semibold transition-colors sm:h-12 ${
                  picked ? "border-2 border-sage bg-sage text-white" : open ? "border-2 border-sage bg-background text-sage-deep hover:bg-secondary" : "border-2 border-transparent text-muted-foreground line-through"
                } ${active ? "ring-2 ring-sage ring-offset-2 ring-offset-background" : ""}`}
              >
                {n}
              </button>
            );
          })}
        </div>
        {days === null && <p className="mt-3 text-center text-sm text-muted-foreground">Loading the dates…</p>}
        {p.slotsFailed && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Couldn't load the dates just now.{" "}
            <button type="button" className="font-semibold underline" onClick={p.retrySlots}>
              Try again
            </button>
          </p>
        )}
        {days !== null && !p.slotsFailed && !firstOpenDay && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {p.multiDate ? "No places left" : "No free times"} in {month.toLocaleDateString("en-GB", { month: "long" })}.{" "}
            <button type="button" className="font-semibold underline" onClick={goNext}>
              See next month
            </button>
          </p>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-sm border-2 border-sage" aria-hidden /> {p.multiDate ? "Class on" : "Free times"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-sm bg-sage" aria-hidden /> Added
          </span>
        </div>
      </div>

      {activeDay && daySlots.length > 0 && (
        <div className="mt-6">
          <p className="text-base font-semibold text-foreground">2. Choose a time on {fmt(activeDay, { weekday: "long", day: "numeric", month: "long" })}</p>
          {p.zoneNote && <p className="mt-1 text-xs text-muted-foreground">{p.zoneNote}</p>}
          <ul className="mt-3 space-y-2">
            {daySlots.map((s) => {
              const on = pickedKeys.has(s.key);
              const full = !s.bookable && !on;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => p.toggleSlot(s)}
                    disabled={full}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-3 rounded-md border-[1.5px] px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                      on ? "border-sage bg-secondary" : full ? "border-border opacity-60" : "border-border hover:border-sage hover:bg-secondary"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`block text-lg font-semibold ${full ? "line-through" : "text-foreground"}`}>{timeRange(s)}</span>
                      {(p.multiDate || !s.bookable) && <span className="block text-sm text-muted-foreground">{placesLeft(s)}</span>}
                    </span>
                    {!full && (
                      <span className={`shrink-0 rounded-control px-4 py-2 text-sm font-semibold ${on ? "bg-sage text-white" : "border-[1.5px] border-sage text-sage-deep"}`}>
                        {on ? "✓ Added" : "Add"}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {selectedSlots.length > 0 && (
        <div className="mt-8">
          <p className="text-base font-semibold text-foreground">
            {activeDay && daySlots.length > 0 ? "3. " : ""}
            {p.multiDate ? `Your classes (${selectedSlots.length})` : "Your time"}
          </p>
          {p.multiDate && p.addOnGroups.length > 0 && <p className="mt-1 text-sm text-muted-foreground">Tick any extras you'd like for each class.</p>}
          <ul className="mt-3 space-y-3">
            {selectedSlots.map((s) => {
              const sel = p.slotAddOns[s.key] ?? {};
              const amount = dateAmount(service, p.addOnGroups, sel) * Math.max(1, p.places);
              return (
                <li key={s.key} className="rounded-lg border-[1.5px] border-sage/50 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{fmt(s.dayKey, { weekday: "long", day: "numeric", month: "long" })}</p>
                      <p className="text-sm text-muted-foreground">{timeRange(s)}</p>
                    </div>
                    <div className="text-right">
                      {p.multiDate && amount > 0 && <p className="text-base font-semibold text-foreground">{formatServiceAmount(service, amount)}</p>}
                      <button
                        type="button"
                        onClick={() => p.toggleSlot(s)}
                        className="mt-1 text-sm font-semibold text-muted-foreground underline decoration-blush decoration-2 underline-offset-4 hover:text-foreground"
                        aria-label={`Remove the class on ${fmt(s.dayKey, { weekday: "long", day: "numeric", month: "long" })} at ${s.label}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {p.multiDate && p.addOnGroups.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-border pt-3">
                      {p.addOnGroups.flatMap((g) =>
                        g.addOns.map((a) => {
                          const q = sel[a.id] ?? 0;
                          const on = q > 0;
                          const blocked = !on && !p.canSelectMoreFor(s.key, g.id);
                          return (
                            <div key={a.id} className="flex items-center gap-3">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={on}
                                disabled={blocked}
                                onClick={() => p.toggleSlotAddOn(s.key, a.id)}
                                className="flex min-h-[44px] flex-1 items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <span aria-hidden className={checkbox(on)}>
                                  {on && <Tick />}
                                </span>
                                <span className="flex-1 text-sm text-foreground">{a.name}</span>
                                {a.price && <span className="shrink-0 text-sm font-semibold text-foreground">+ {a.price}</span>}
                              </button>
                              {on && a.maxQuantity && a.maxQuantity > 1 && (
                                <select
                                  aria-label={`How many: ${a.name}`}
                                  value={q}
                                  onChange={(e) => p.setSlotAddOnQuantity(s.key, a.id, Number(e.target.value))}
                                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                                >
                                  {Array.from({ length: a.maxQuantity }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>
                                      {n}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        }),
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
