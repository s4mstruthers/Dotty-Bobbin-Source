// The whole booking state machine for one service as a framework-free store — the logic behind
// useBookingFlow, usable from React (useBookingFlow wraps it), from a static page's booking surface,
// from Vue/Svelte, or as the specification for a port: the display time zone (the site's setting),
// the availability window (day-grouped slots, week paging, optional staff filter, next availability),
// a course's seats and dates, a class's upcoming sessions, participants, deposit choice, add-on
// selection, the schema-driven form, the CTA state, and book(). All correctness (slot scheduleId vs
// eventId vs a course's schedule, ANY_RESOURCE, the slot's location, formSubmission, payment option,
// checkout-or-place) lives in the data layer; this store orchestrates. A late response from a
// superseded window is dropped. One store per booking surface: createBookingFlowStore(service).
import { requirePhone } from "./phone-required";
import {
  DateBookingError,
  bookServiceDates,
  fetchAddOnGroups,
  fetchBookingForm,
  fetchBookingsSettings,
  fetchCourseAvailability,
  fetchNextAvailableSlots,
  fetchOfferedDays,
  fetchSessions,
  fetchSlots,
  resolveDisplayTimeZone,
} from "./booking";
import { ctaStateOf } from "./services-core";
import { logoutMember } from "../members/auth";
import {
  addOnsDuration,
  addOnsTotal,
  bookedAddOnsOf,
  canSelectMore,
  friendlyBookingError,
  groupSlotsByDay,
  isRevokedSession,
  loginAgainPath,
  maxParticipants,
  normalizeFormValues,
  showsNextAvailability,
  startOfDay,
  timeZoneLabel,
  toLocalDateString,
  withAddOnQuantity,
  type AddOnSelection,
  type BookingDay,
} from "./booking-core";
import type { AddOnGroup, BookingFormField, BookingResult, BookingsSettings, CourseAvailability, CtaState, ServiceDetail, Session, Slot, Weekday } from "./types";
import { forgetBookedEvent, rememberBookedEvent, slotCalendarEvent } from "../../lib/calendar";
import { forgetCheckoutKinds, rememberClassCheckout } from "../storefront/checkout-kinds";

export type { BookingDay };

const WINDOW_DAYS = 7;
/** The first day of `d`'s month. A class is picked from a month calendar, one month loaded at a time. */
const monthStartOf = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
const RESOURCE_PARAM = "resource";

/** Everything a booking surface renders from. Read it with getState() or through a subscription. */
export interface BookingFlowState {
  /** Slots grouped by day, in order — [{ dayKey, dayLabel, slots }]. null while loading; [] for a COURSE (no slots). */
  days: BookingDay[] | null;
  /** The week's times couldn't be loaded (days is [] then) — offer retrySlots(), don't say "no times". */
  slotsFailed: boolean;
  /** The 7-day window start (a day boundary); page with nextWeek/prevWeek (prev clamps to today). */
  windowStart: Date;
  /** The next few bookable times beyond the window — what an empty week points at; null while loading, [] when none/not applicable. */
  nextAvailable: Slot[] | null;
  /** Staff filter — render a picker only when service.staff.length > 1. Seeded from `?resource=`. */
  staffId: string | undefined;
  /** The time last picked (the only one, except on a class with several dates picked). */
  selectedSlot: Slot | null;
  /** Every date picked, in date order. A CLASS takes several (one checkout for them all); anything else one at most. */
  selectedSlots: Slot[];
  /** True for a CLASS: tapping a time adds it to (or takes it off) the dates, and the picks stay when the week changes. */
  multiDate: boolean;
  /** CLASS: the month the calendar shows ("YYYY-MM-01"), and whether there's an earlier month to go back to. */
  calendarMonth: string;
  canGoToPrevMonth: boolean;
  /** CLASS: each picked date's own add-ons, by slot key. */
  slotAddOns: Record<string, AddOnSelection>;
  /** The IANA zone the shown times are in (the response's), and its label ("Eastern Time (EDT)"); null/"" until known. */
  timeZone: string | null;
  timeZoneLabel: string;
  /** Which zone is in use and whether the owner lets the visitor switch (setDisplayTimeZone). */
  displayTimeZone: "BUSINESS" | "CUSTOMER";
  customerCanChangeTimeZone: boolean;
  /** COURSE only: seats from its sessions (null while loading, once ended, or for other types). */
  course: CourseAvailability | null;
  /** Weekdays a class/course meets ("MONDAY"…), from its recurring sessions; [] for appointments or until loaded. */
  offeredDays: Weekday[];
  /** Upcoming sessions of a class (or a running course); null while loading, [] for appointments. */
  sessions: Session[] | null;
  hasMoreSessions: boolean;
  /** Seats in this booking and the most allowed (policy / capacity / seats left on the slot). */
  participants: number;
  maxParticipants: number;
  /** Deposit choice: true = pay the deposit now (the default when the service takes one); false = pay in full now. */
  payDeposit: boolean;
  /** Add-on groups (empty unless service.hasAddOns), the selection (quantity by add-on id), and its totals. */
  addOnGroups: AddOnGroup[];
  addOns: AddOnSelection;
  /** Formatted extra price of the selected add-ons ("" when none); booked with the session as `bookedAddOns`. */
  addOnsTotal: string;
  addOnsMinutes: number;
  /** Schema-driven form fields (never empty once loaded — contact basics fallback; [] until formLoaded). */
  formFields: BookingFormField[];
  /** The form's fields have arrived — nothing can be booked before then. */
  formLoaded: boolean;
  values: Record<string, string>;
  /** book / requestToBook / viewCourse — the CTA's label and the confirmed copy follow it. */
  ctaState: CtaState;
  /** True when a bookable slot is selected (or the service is a bookable course) and every required field has a value. */
  canBook: boolean;
  booking: boolean;
  /** Set after a free/offline booking completes — the only REAL success signal. */
  confirmed: BookingResult | null;
  error: string | null;
}

export interface BookingFlowStore {
  getState(): BookingFlowState;
  subscribe(listener: () => void): () => void;
  /** Load settings, the first window, next availability, sessions/seats, add-ons, and the form. Call once when mounted (a browser). */
  start(): void;
  /** Stop reacting; drop late responses. */
  stop(): void;
  nextWeek(): void;
  /** CLASS calendar: the next / previous month (never before this month). Picked dates stay picked. */
  nextMonth(): void;
  prevMonth(): void;
  /** CLASS: tick or untick an add-on for one picked date; set its quantity; whether that date's group takes another. */
  toggleSlotAddOn(slotKey: string, addOnId: string): void;
  setSlotAddOnQuantity(slotKey: string, addOnId: string, quantity: number): void;
  canSelectMoreFor(slotKey: string, groupId: string): boolean;
  prevWeek(): void;
  /** Load the same week again — after slotsFailed. */
  retrySlots(): void;
  /** Move the window to the week holding this day ("YYYY-MM-DD" — a nextAvailable slot's dayKey). */
  jumpTo(dayKey: string): void;
  setStaffId(id: string | undefined): void;
  /** Ignored for a non-bookable slot (full session, policy). On a CLASS this replaces every date with this one (or none). */
  setSelectedSlot(slot: Slot | null): void;
  /** CLASS: add this time to the dates, or take it off if it's there. Anything else: same as setSelectedSlot. */
  toggleSlot(slot: Slot): void;
  /** Only when customerCanChangeTimeZone; reloads the window in the other zone. */
  setDisplayTimeZone(zone: "BUSINESS" | "CUSTOMER"): void;
  setParticipants(n: number): void;
  /** Only meaningful when service.deposit?.fullUpfrontAllowed; otherwise the deposit is mandatory. */
  setPayDeposit(payDeposit: boolean): void;
  toggleAddOn(id: string): void;
  setAddOnQuantity(id: string, quantity: number): void;
  /** Whether `groupId` accepts another distinct add-on. */
  canSelectMore(groupId: string): boolean;
  loadMoreSessions(): Promise<void>;
  setValue(target: string, value: string): void;
  /** Books the selected slot(s) — every picked date of a class in one checkout (a course: the course). On "redirect" the browser is already navigating; otherwise `confirmed` is set. Rejects with the refusal (also in .error). */
  book(): Promise<BookingResult>;
}

/** "Thu 27 Nov at 12:30 PM" — a picked date in an error. */
function dateTimeLabel(slot: Slot): string {
  let day = slot.dayKey;
  try {
    day = new Date(`${slot.dayKey}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  } catch {}
  return `${day} at ${slot.label}`;
}

const readResourceParam = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    return new URL(window.location.href).searchParams.get(RESOURCE_PARAM) || undefined;
  } catch {
    return undefined;
  }
};

export function createBookingFlowStore(service: ServiceDetail): BookingFlowStore {
  const isCourse = service.type === "COURSE";
  let windowStart = startOfDay(new Date());
  let staffId: string | undefined = readResourceParam();
  let slots: Slot[] | null = isCourse ? [] : null;
  let slotsFailed = false;
  let nextAvailable: Slot[] | null = showsNextAvailability(service) ? null : [];
  const multiDate = service.type === "CLASS";
  let picked: Slot[] = []; // in date order
  let windowDays = WINDOW_DAYS;
  let calendarMonth = monthStartOf(new Date());
  let slotAddOns: Record<string, AddOnSelection> = {};
  // A class loads the calendar month on show: from today (or the 1st) to the month's end.
  const fitWindowToMonth = () => {
    const today = startOfDay(new Date());
    windowStart = calendarMonth < today ? today : calendarMonth;
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    windowDays = Math.max(1, Math.round((next.getTime() - windowStart.getTime()) / 86400000));
  };
  if (!isCourse) fitWindowToMonth(); // classes and 1-to-1s are picked from the month calendar
  let settings: BookingsSettings = { displayTimeZone: "BUSINESS", customerCanChange: false };
  let requestZone: string | undefined; // what the requests send; undefined = the business zone
  let timeZone: string | null = null; // what the response says the times are in
  let course: CourseAvailability | null = null;
  let offeredDays: Weekday[] = service.offeredDays;
  let sessions: Session[] | null = service.type === "APPOINTMENT" ? [] : null;
  let sessionsCursor: string | null = null;
  let participants = 1;
  let payDeposit = !!service.deposit;
  let addOnGroups: AddOnGroup[] = [];
  let addOns: AddOnSelection = {};
  let formFields: BookingFormField[] = [];
  let formLoaded = false;
  let values: Record<string, string> = {};
  let booking = false;
  let confirmed: BookingResult | null = null;
  let error: string | null = null;
  let started = false;
  let generation = 0;
  const listeners = new Set<() => void>();
  let snapshot: BookingFlowState | null = null;
  const emit = () => {
    snapshot = null;
    for (const fn of listeners) fn();
  };

  const ctaState = (): CtaState => ctaStateOf(service, course?.full ?? false);
  // Not before the form has loaded: an empty field list would pass `every` (a service may truly have none).
  const formComplete = () => formLoaded && formFields.every((f) => !f.required || (values[f.target] ?? "").trim().length > 0);
  const zoneForBooking = () => timeZone ?? requestZone ?? undefined;
  const lastPicked = (): Slot | null => picked[picked.length - 1] ?? null;
  // Seats allowed per date: the tightest of the picked dates.
  const seatsAllowed = (): number => (picked.length ? Math.min(...picked.map((s) => maxParticipants(service, s))) : maxParticipants(service, null));
  const byDate = (a: Slot, b: Slot) => a.startLocal.localeCompare(b.startLocal);

  function getState(): BookingFlowState {
    if (snapshot) return snapshot;
    const cta = ctaState();
    const selectedSlot = lastPicked();
    const target = isCourse ? !service.course?.ended && cta !== "viewCourse" && !!service.scheduleId : picked.length > 0 && picked.every((s) => s.bookable);
    snapshot = {
      days: slots === null ? null : groupSlotsByDay(slots),
      slotsFailed,
      windowStart,
      nextAvailable,
      staffId,
      selectedSlot,
      selectedSlots: picked,
      multiDate,
      calendarMonth: toLocalDateString(calendarMonth).slice(0, 10),
      canGoToPrevMonth: calendarMonth > monthStartOf(new Date()),
      slotAddOns,
      timeZone,
      timeZoneLabel: timeZoneLabel(timeZone, selectedSlot ? new Date(selectedSlot.startLocal) : windowStart),
      displayTimeZone: settings.displayTimeZone,
      customerCanChangeTimeZone: settings.customerCanChange,
      course,
      offeredDays,
      sessions,
      hasMoreSessions: !!sessionsCursor,
      participants,
      maxParticipants: seatsAllowed(),
      payDeposit,
      addOnGroups,
      addOns,
      addOnsTotal: addOnsTotal(addOnGroups, addOns),
      addOnsMinutes: addOnsDuration(addOnGroups, addOns),
      formFields,
      formLoaded,
      values,
      ctaState: cta,
      canBook: target && formComplete() && !booking,
      booking,
      confirmed,
      error,
    };
    return snapshot;
  }

  // The window, the staff filter, or the zone changed: clear the picker and load the slots for the new selection.
  function loadSlots(): void {
    if (!started || isCourse) return;
    const id = ++generation;
    slots = null;
    slotsFailed = false;
    emit();
    fetchSlots(service, { from: windowStart, days: windowDays, staffId, timeZone: requestZone })
      .then((page) => {
        if (!started || generation !== id) return; // superseded — drop it
        slots = page.slots;
        timeZone = page.timeZone ?? requestZone ?? null;
        error = null; // whatever went wrong before is past: the picker has fresh times
        emit();
      })
      .catch(() => {
        if (!started || generation !== id) return;
        // A failed load isn't an empty week: the picker says so and offers to try again.
        slots = [];
        slotsFailed = true;
        emit();
      });
  }

  // Next availability follows the staff filter and the zone, not the window.
  // Its own counter: paging the week mustn't drop this answer (the empty week waits on it).
  let nextAvailableGeneration = 0;
  function loadNextAvailable(): void {
    if (!started || !showsNextAvailability(service)) return;
    const id = ++nextAvailableGeneration;
    nextAvailable = null;
    fetchNextAvailableSlots(service, { staffId, timeZone: requestZone })
      .then((page) => {
        if (!started || nextAvailableGeneration !== id) return;
        nextAvailable = page.slots;
        emit();
      })
      .catch(() => {
        if (!started || nextAvailableGeneration !== id) return;
        nextAvailable = [];
        emit();
      });
  }

  // Sessions: a class always, a course while it still runs, never an appointment.
  function loadSessions(): void {
    const scheduleId = service.scheduleId;
    if (!started || !scheduleId || service.type === "APPOINTMENT" || (isCourse && service.course?.ended)) {
      sessions = sessions ?? [];
      return;
    }
    const id = generation;
    fetchSessions(scheduleId, { timeZone: requestZone }).then((page) => {
      if (!started || generation !== id) return;
      sessions = page.sessions;
      sessionsCursor = page.nextCursor;
      emit();
    });
  }

  // The recurring sessions: the weekdays a class/course meets, and a course's seats.
  function loadSchedule(): void {
    if (!started || service.type === "APPOINTMENT" || !service.scheduleId) return;
    const id = generation;
    const scheduleId = service.scheduleId;
    fetchOfferedDays([scheduleId], requestZone).then((days) => {
      if (!started || generation !== id) return;
      offeredDays = days[scheduleId] ?? offeredDays;
      emit();
    });
    if (!isCourse) return;
    fetchCourseAvailability(service, requestZone).then((c) => {
      if (!started || generation !== id) return;
      course = c;
      timeZone = timeZone ?? requestZone ?? null;
      emit();
    });
  }

  function loadForZone(): void {
    loadSlots();
    loadNextAvailable();
    loadSessions();
    loadSchedule();
    emit();
  }

  return {
    getState,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    start() {
      if (started) return;
      started = true;
      // The zone policy first: everything time-related is requested in the zone the owner chose.
      fetchBookingsSettings().then((s) => {
        if (!started) return;
        settings = s;
        requestZone = resolveDisplayTimeZone(s);
        loadForZone();
      });
      fetchBookingForm(service.formId).then((f) => { if (started) { formFields = requirePhone(f); formLoaded = true; emit(); } });
      if (service.hasAddOns) fetchAddOnGroups(service.id).then((g) => { if (started) { addOnGroups = g; emit(); } });
    },
    stop() {
      started = false;
      generation++;
    },
    nextWeek() {
      windowStart = new Date(windowStart.getFullYear(), windowStart.getMonth(), windowStart.getDate() + WINDOW_DAYS);
      loadSlots();
    },
    nextMonth() {
      if (isCourse) return;
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
      fitWindowToMonth();
      loadSlots();
    },
    prevMonth() {
      if (isCourse || calendarMonth <= monthStartOf(new Date())) return;
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
      fitWindowToMonth();
      loadSlots();
    },
    toggleSlotAddOn(slotKey, addOnId) {
      const current = slotAddOns[slotKey] ?? {};
      slotAddOns = { ...slotAddOns, [slotKey]: withAddOnQuantity(addOnGroups, current, addOnId, current[addOnId] > 0 ? 0 : 1) };
      emit();
    },
    setSlotAddOnQuantity(slotKey, addOnId, quantity) {
      slotAddOns = { ...slotAddOns, [slotKey]: withAddOnQuantity(addOnGroups, slotAddOns[slotKey] ?? {}, addOnId, quantity) };
      emit();
    },
    canSelectMoreFor(slotKey, groupId) {
      const group = addOnGroups.find((g) => g.id === groupId);
      return group ? canSelectMore(group, slotAddOns[slotKey] ?? {}) : false;
    },
    prevWeek() {
      const today = startOfDay(new Date());
      const prev = new Date(windowStart.getFullYear(), windowStart.getMonth(), windowStart.getDate() - WINDOW_DAYS);
      windowStart = prev < today ? today : prev;
      loadSlots();
    },
    retrySlots() {
      loadSlots();
    },
    jumpTo(dayKey) {
      const day = new Date(`${dayKey}T12:00:00`);
      if (Number.isNaN(day.getTime())) return;
      const today = startOfDay(new Date());
      const target = startOfDay(day);
      windowStart = target < today ? today : target;
      loadSlots();
    },
    setStaffId(id) {
      if (id === staffId) return;
      staffId = id;
      loadSlots();
      loadNextAvailable();
    },
    setSelectedSlot(slot) {
      if (slot && !slot.bookable) return;
      picked = slot ? [slot] : [];
      participants = Math.min(participants, seatsAllowed());
      emit();
    },
    toggleSlot(slot) {
      if (!multiDate) {
        if (!slot.bookable) return;
        picked = [slot];
      } else if (picked.some((s) => s.key === slot.key)) {
        picked = picked.filter((s) => s.key !== slot.key);
        const { [slot.key]: _dropped, ...rest } = slotAddOns;
        slotAddOns = rest;
      }
      else if (slot.bookable) picked = [...picked, slot].sort(byDate);
      else return;
      participants = Math.max(1, Math.min(participants, seatsAllowed()));
      error = null;
      emit();
    },
    setDisplayTimeZone(zone) {
      if (!settings.customerCanChange || zone === settings.displayTimeZone) return;
      settings = { ...settings, displayTimeZone: zone };
      requestZone = resolveDisplayTimeZone(settings);
      timeZone = null;
      generation++;
      loadForZone();
    },
    setParticipants(n) {
      participants = Math.max(1, Math.min(Math.floor(n) || 1, seatsAllowed()));
      emit();
    },
    setPayDeposit(v) {
      if (!service.deposit) return;
      payDeposit = service.deposit.fullUpfrontAllowed ? v : true;
      emit();
    },
    toggleAddOn(id) {
      addOns = withAddOnQuantity(addOnGroups, addOns, id, addOns[id] > 0 ? 0 : 1);
      emit();
    },
    setAddOnQuantity(id, quantity) {
      addOns = withAddOnQuantity(addOnGroups, addOns, id, quantity);
      emit();
    },
    canSelectMore(groupId) {
      const group = addOnGroups.find((g) => g.id === groupId);
      return group ? canSelectMore(group, addOns) : false;
    },
    async loadMoreSessions() {
      if (!started || !sessionsCursor || !service.scheduleId) return;
      const id = generation;
      const cursor = sessionsCursor;
      sessionsCursor = null;
      emit();
      const page = await fetchSessions(service.scheduleId, { cursor, timeZone: requestZone });
      if (!started || generation !== id) return;
      sessions = [...(sessions ?? []), ...page.sessions];
      sessionsCursor = page.nextCursor;
      emit();
    },
    setValue(target, value) {
      values = { ...values, [target]: value };
      emit();
    },
    async book() {
      if (!isCourse && !picked.length) throw new Error("Pick a time first.");
      if (isCourse && ctaState() === "viewCourse") throw new Error("This course can't be booked anymore.");
      booking = true;
      error = null;
      emit();
      try {
        const result = await bookServiceDates(service, isCourse ? [null] : picked, normalizeFormValues(formFields, values), {
          staffId,
          timeZone: zoneForBooking(),
          participants,
          depositSelected: service.deposit?.fullUpfrontAllowed ? payDeposit : undefined,
          addOns: bookedAddOnsOf(addOnGroups, addOns),
        }, multiDate ? Object.fromEntries(picked.map((p) => [p.key, bookedAddOnsOf(addOnGroups, slotAddOns[p.key] ?? {})])) : {});
        if (result.kind === "redirect") {
          forgetCheckoutKinds(); // a cart checkout left earlier mustn't add shop panels to this one
          rememberClassCheckout(); // the thank-you page shows the class panel only
          // Kept for the thank-you page the checkout returns to, which offers Add to calendar.
          // One date only: the page holds one class (several dates get their times in Wix's emails).
          forgetBookedEvent();
          if (!isCourse && picked.length === 1) rememberBookedEvent(slotCalendarEvent(service, picked[0], timeZone ?? requestZone ?? null));
          // Stay "Booking…" while the checkout loads, so a second tap can't hold another seat.
          // Coming back with the browser's Back button restores this page as it was: free it then
          // (and forget the class, as that checkout was left).
          window.addEventListener("pageshow", (e) => { if (e.persisted) { forgetBookedEvent(); booking = false; emit(); } }, { once: true });
          window.location.href = result.url;
          return result;
        }
        confirmed = result;
        booking = false;
        emit();
        return result;
      } catch (e) {
        // Several dates: say which one failed, so it can be taken off and the rest booked.
        error = e instanceof DateBookingError ? `${dateTimeLabel(e.slot)}: ${friendlyBookingError(e)} Untick that date and book the others.` : friendlyBookingError(e);
        booking = false;
        emit();
        // A revoked login fails every call until it is replaced: log out cleanly, then log in again.
        if (isRevokedSession(e)) void logoutMember(loginAgainPath());
        throw e;
      }
    },
  };
}
