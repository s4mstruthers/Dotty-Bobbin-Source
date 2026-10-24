// Pick a new time for one of the member's bookings: the same class (or 1-1), a week of times at a
// time via the shipped slot reader (fetchSlots), then the server moves the booking. Wix itself
// re-checks that the time is free and that the policy allows the move.
import { useEffect, useState } from "react";
import { fetchSlots } from "../../wix/bookings/booking";
import { changeBooking, BUSINESS_TIME_ZONE, whenLabel } from "../../wix/account/client";
import type { AccountBooking } from "../../wix/account/types";
import type { Slot } from "../../wix/bookings/types";

const DAYS = 7;

export default function RescheduleBooking({ booking, onDone, onClose }: { booking: AccountBooking; onDone: () => void; onClose: () => void }) {
  const [weekStart, setWeekStart] = useState(() => new Date());
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [zone, setZone] = useState<string>(BUSINESS_TIME_ZONE);
  const [chosen, setChosen] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setSlots(null);
    setChosen(null);
    fetchSlots({ id: booking.serviceId, type: booking.serviceType as "CLASS" | "APPOINTMENT" }, { from: weekStart, days: DAYS, timeZone: BUSINESS_TIME_ZONE })
      .then((page) => {
        if (!live) return;
        setZone(page.timeZone ?? BUSINESS_TIME_ZONE);
        // Only times that can be booked, and not the one already booked.
        const current = whenLabel(booking.startIso);
        setSlots(page.slots.filter((s) => s.bookable && whenLabel(localToIso(s.startLocal, page.timeZone ?? BUSINESS_TIME_ZONE)) !== current));
      })
      .catch(() => live && setSlots([]));
    return () => {
      live = false;
    };
  }, [booking.serviceId, booking.serviceType, booking.startIso, weekStart]);

  const save = async () => {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      await changeBooking({
        action: "reschedule",
        bookingId: booking.id,
        slot: { startLocal: chosen.startLocal, endLocal: chosen.endLocal, eventId: chosen.eventId, scheduleId: chosen.scheduleId, timeZone: zone },
      });
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const byDay = new Map<string, Slot[]>();
  for (const s of slots ?? []) byDay.set(s.dayKey, [...(byDay.get(s.dayKey) ?? []), s]);
  const today = new Date();
  const canGoBack = weekStart.toDateString() !== today.toDateString();

  return (
    <div className="mt-4 rounded-md bg-secondary p-4 text-sm" role="group" aria-label="Change time">
      <p className="font-semibold">Move to another time</p>
      <p className="mt-1 text-muted-foreground">Currently {whenLabel(booking.startIso, booking.endIso)}. Times shown in UK time.</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" className="link-pill" disabled={!canGoBack || busy} onClick={() => setWeekStart(addDays(weekStart, -DAYS) < today ? today : addDays(weekStart, -DAYS))}>
          ← Earlier
        </button>
        <span className="text-xs text-muted-foreground">
          {fmtDay(weekStart)} – {fmtDay(addDays(weekStart, DAYS - 1))}
        </span>
        <button type="button" className="link-pill" disabled={busy} onClick={() => setWeekStart(addDays(weekStart, DAYS))}>
          Later →
        </button>
      </div>

      {slots === null ? (
        <div className="mt-3 h-20 animate-pulse rounded-md bg-background" aria-busy="true" />
      ) : byDay.size === 0 ? (
        <p className="mt-3">No free times this week. Try later dates.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {[...byDay.entries()].map(([day, list]) => (
            <div key={day}>
              <p className="text-xs font-bold uppercase tracking-wide text-sage-deep">{fmtDayKey(day)}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {list.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={chosen?.key === s.key}
                    onClick={() => setChosen(s)}
                    className={`rounded-control border px-3.5 py-1.5 text-sm font-semibold ${chosen?.key === s.key ? "border-sage bg-background text-sage-deep" : "border-border bg-background"}`}
                  >
                    {s.label}
                    {s.remainingCapacity != null ? ` · ${s.remainingCapacity} left` : ""}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 font-semibold text-destructive">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn" disabled={!chosen || busy} onClick={() => void save()}>
          {busy ? "Moving…" : chosen ? `Move to ${fmtDayKey(chosen.dayKey)}, ${chosen.label}` : "Pick a time"}
        </button>
        <button type="button" className="link-pill" disabled={busy} onClick={onClose}>
          Keep current time
        </button>
      </div>
    </div>
  );
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtDay = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
const fmtDayKey = (key: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));

/** A wall-clock "YYYY-MM-DDThh:mm:ss" in `zone` → a UTC ISO instant (to compare with the booked time). */
function localToIso(local: string, zone: string): string {
  const asUtc = new Date(`${local.slice(0, 19)}Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(asUtc);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return new Date(asUtc.getTime() - (shown - asUtc.getTime())).toISOString();
}
