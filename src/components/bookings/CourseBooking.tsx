// The booking panel on a Portfolio Course page. A course has no time to pick: the visitor books
// the whole course (all 12 sessions) in one go, so this panel is places left, the details form,
// the course-agreement checkbox and one pink button. The booking itself goes through the shipped
// bookService (createBooking for the schedule → cart → Wix checkout, where the monthly payments
// are set up); this file only decides what is shown and gathers the form. Mount
// client:only="react": places left and the form are read per visitor.
import { useEffect, useMemo, useState } from "react";
import { useMember } from "../../hooks/members/useMember";
import type { BookingFormField, Session } from "../../wix/bookings/types";
import { bookService, openCheckout } from "../../wix/bookings/booking";
import { friendlyBookingError, normalizeFormValues } from "../../wix/bookings/booking-core";
import { coursePlaces, fetchCourseForm, fetchCourseSessions, type AgreementField, type CourseDetail } from "../../wix/bookings/course";
import { requirePhone } from "../../wix/bookings/phone-required";
import { BUSINESS_TIME_ZONE } from "../../wix/account/client";
import { forgetBookedEvent, rememberBookedEvent, STUDIO_ADDRESS, zonedToUtcIso } from "../../lib/calendar";
import { forgetCheckoutKinds } from "../../wix/storefront/checkout-kinds";

const input = "w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25";
const heading = "mb-2 block text-xs font-bold uppercase tracking-wider text-sage-deep";

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

/** The agreement wording Saskia asked for; a connected form's own checkbox label wins. */
const AGREEMENT_LABEL = "I have read and agree to the Portfolio Course 1 Agreement shown above";

export interface CourseBookingProps {
  service: CourseDetail;
  /** The sessions the page rendered (server-side); refreshed here for live places left. */
  initialSessions: Session[];
  /** The other group's page, for the "Full" state. */
  otherGroup: { path: string; label: string };
}

export default function CourseBooking({ service, initialSessions, otherGroup }: CourseBookingProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [fields, setFields] = useState<BookingFormField[]>([]);
  const [agreementField, setAgreementField] = useState<AgreementField | null>(null);
  const [formLoaded, setFormLoaded] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A course kept for a checkout that was left (they came back here) mustn't be offered as
  // "Add to calendar" after a later shop order.
  useEffect(() => forgetBookedEvent(), []);

  // Live places left and the booking form, per visitor.
  useEffect(() => {
    let on = true;
    if (service.scheduleId) {
      fetchCourseSessions(service.scheduleId).then((s) => {
        if (on && s.length) setSessions(s);
      });
    }
    fetchCourseForm(service.formId).then((f) => {
      if (!on) return;
      setFields(requirePhone(f.fields));
      setAgreementField(f.agreement);
      setFormLoaded(true);
    });
    return () => {
      on = false;
    };
  }, [service.scheduleId, service.formId]);

  // Logged-in customers: fill in their name and email (only fields this booking form has, and
  // only while still empty, so nothing they typed is overwritten).
  const { member, loggedIn, loading: memberLoading } = useMember();
  const [asGuest, setAsGuest] = useState(() => {
    try {
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
    setValues((v) => {
      const next = { ...v };
      for (const f of fields) {
        const k = known[f.target];
        if (k && !(next[f.target] ?? "").trim()) next[f.target] = k;
      }
      return next;
    });
  }, [member, fields]);

  const places = useMemo(() => coursePlaces(sessions, service.defaultCapacity), [sessions, service.defaultCapacity]);
  const ended = service.course?.ended ?? false;
  const started = !!service.course?.startDate && new Date(service.course.startDate).getTime() <= Date.now();
  const closed = ended || started || service.tooLateToBook || !service.scheduleId;
  const formComplete = formLoaded && fields.every((f) => !f.required || (values[f.target] ?? "").trim().length > 0);
  const canBook = !closed && !places.full && formComplete && agreed && !booking;
  const bookHint = canBook || booking || closed || places.full || !formLoaded ? "" : !formComplete ? missingDetails(fields, values) : !agreed ? "Tick the agreement to book" : "";
  const price = service.subscription;
  const ctaLabel = booking ? "Booking…" : price ? `Book my place · ${price.amountPerCycle} a month` : "Book my place";

  const setValue = (target: string, value: string) => setValues((v) => ({ ...v, [target]: value }));

  async function book() {
    if (!canBook) return;
    setBooking(true);
    setError(null);
    try {
      // The agreement rides in the form submission only when the connected form has a checkbox
      // for it (then Wix stores it with the booking); otherwise it is a gate on this page.
      const submission: Record<string, unknown> = { ...normalizeFormValues(fields, values) };
      if (agreementField) submission[agreementField.target] = true;
      const result = await bookService(service, null, submission, { timeZone: BUSINESS_TIME_ZONE, participants: 1 });
      if (result.kind === "redirect") {
        forgetCheckoutKinds(); // a cart checkout left earlier mustn't add shop panels to this one
        // Kept for the thank-you page the checkout returns to: the first session, for Add to calendar.
        const first = sessions.find((s) => !s.isCancelled);
        if (first) rememberBookedEvent({ title: service.name, startIso: zonedToUtcIso(first.startLocal, BUSINESS_TIME_ZONE), endIso: zonedToUtcIso(first.endLocal, BUSINESS_TIME_ZONE), location: STUDIO_ADDRESS });
        // Stay "Booking…" while the checkout loads, so a second tap can't hold another place.
        // Coming back with the browser's Back button restores this page as it was: free it then.
        window.addEventListener("pageshow", (e) => { if (e.persisted) { forgetBookedEvent(); setBooking(false); } }, { once: true });
        // A Home Screen app keeps this page under a Safari sheet: free the button when the sheet closes.
        if (openCheckout(result.url)) {
          const back = () => { if (document.visibilityState === "visible") { document.removeEventListener("visibilitychange", back); forgetBookedEvent(); setBooking(false); } };
          document.addEventListener("visibilitychange", back);
        }
        return;
      }
      setConfirmed(true);
      setBooking(false);
    } catch (e) {
      setError(friendlyBookingError(e));
      setBooking(false);
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-lg bg-secondary p-8 text-center">
        <p className="font-display text-2xl font-bold text-sage">You're booked!</p>
        <p className="mt-2 text-sm text-muted-foreground">{service.name}. A confirmation email is on its way.</p>
      </div>
    );
  }

  const placesLine =
    places.left == null
      ? service.defaultCapacity
        ? `Up to ${service.defaultCapacity} people`
        : ""
      : places.full
        ? "Full"
        : `${places.left} of ${places.capacity ?? places.left} places left`;

  return (
    <div>
      <div className="rounded-lg border border-border p-4 text-sm">
        <p className={heading}>Places</p>
        {placesLine && <p className={places.full ? "font-semibold" : places.left != null && places.left <= 2 ? "font-semibold text-sage-deep" : ""}>{placesLine}</p>}
        {price && <p className="mt-1 text-muted-foreground">{price.label}</p>}
      </div>

      {closed ? (
        <p className="mt-6 rounded-lg bg-secondary p-5 text-sm">
          {ended ? "This course has ended." : "This course has started, so bookings are closed."}{" "}
          <a href="/contact" className="underline">Get in touch</a> to hear about the next one.
        </p>
      ) : places.full ? (
        <div className="mt-6 rounded-lg bg-secondary p-5 sm:p-6">
          <p className="font-display text-xl font-bold text-sage">Full — ask Saskia about the other group</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This group is fully booked. The <a href={otherGroup.path} className="underline">{otherGroup.label.toLowerCase()}</a> may have places, or{" "}
            <a href="/contact" className="underline">get in touch</a> and Saskia will help.
          </p>
        </div>
      ) : memberLoading ? (
        <div className="mt-6 h-32 animate-pulse rounded-lg bg-secondary" aria-busy="true" />
      ) : !loggedIn && !asGuest ? (
        <div className="mt-6 rounded-lg bg-secondary p-5 sm:p-6">
          <p className="font-display text-xl font-bold text-sage">Already have an account?</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in to book — your details are filled in for you, and you can see your course from your account.
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
          <p className={`${heading} mt-6`}>Your details</p>
          {!formLoaded ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-sm bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
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
          )}

          <label className="mt-6 flex max-w-xl cursor-pointer items-start gap-3 rounded-md border-[1.5px] border-border p-4 transition-colors hover:border-sage has-[:checked]:border-sage has-[:checked]:bg-secondary">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required className="mt-1 h-5 w-5 shrink-0 accent-sage" />
            <span className="text-sm font-semibold text-foreground">{agreementField?.label || AGREEMENT_LABEL} *</span>
          </label>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <button
            type="button"
            disabled={!canBook}
            onClick={() => void book()}
            className="btn mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none sm:w-auto"
          >
            {ctaLabel}
          </button>
          {bookHint && <p className="mt-2 text-sm text-muted-foreground">{bookHint}</p>}
          <p className="mt-3 text-xs text-muted-foreground">
            Paid by card online{price ? `: ${price.amountPerCycle} now, then ${price.amountPerCycle} on the 1st of each month until all ${price.totalPayments} payments are made` : ""}. You'll be taken to a secure Wix checkout.
          </p>
        </>
      )}
    </div>
  );
}
