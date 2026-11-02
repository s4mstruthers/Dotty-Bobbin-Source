// Portfolio Course 1: the reads the two course pages need beyond the shipped services/booking
// layer. A course here is a Wix Bookings COURSE service that Saskia keeps HIDDEN until the pages
// are ready, so it is fetched BY ID (Get Service), never through the visible-services list; its
// 12 sessions are the schedule's calendar events; the price is the service's SUBSCRIPTION payment
// (£45 a month × 12); the course agreement is the booking policy's custom description; and the
// agreement checkbox is the booking form's BOOLEAN field when the form has one. Booking itself
// stays with the shipped bookService (a COURSE books the whole schedule, then Wix checkout).
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/services/services-v2/get-service.md
// docs: https://dev.wix.com/docs/api-reference/business-management/calendar/events-v3/query-events.md
// docs: https://dev.wix.com/docs/api-reference/business-solutions/bookings/services/services-v2/about-subscription-payments.md
// docs: https://dev.wix.com/docs/api-reference/crm/forms/form-schemas/get-form-summary.md
// docs: https://dev.wix.com/docs/api-reference/crm/forms/form-schemas/about-form-fields.md
import { services as servicesModule } from "@wix/bookings";
import { wixFetch, wixModule } from "../sdk";
import { imgSrc } from "../media";
import { SERVICES_CONDITIONAL_FIELDS, formatMoney, isKnownType, toDetail, type Raw } from "./services-core";
import { FALLBACK_FIELDS, nextEventsCursor, sessionsRequest, toFormFields, toSession } from "./booking-core";
import type { BookingFormField, ServiceDetail, Session } from "./types";

const services = wixModule(servicesModule);

/** The two groups and their pages. The ids are the services Saskia set up in the dashboard. */
export const PORTFOLIO_COURSE_1 = {
  morning: {
    serviceId: "275fefd6-1124-42bc-a0a4-653f3ed0a8f0",
    slug: "portfolio-course-1-morning-group",
    path: "/portfolio-course-1/morning",
    label: "Morning group",
  },
  afternoon: {
    serviceId: "3e2de776-ccda-4396-8f9e-21abbe79f2cf",
    slug: "portfolio-course-1-afternoon-group",
    path: "/portfolio-course-1/afternoon",
    label: "Afternoon group",
  },
} as const;

export type CourseGroup = keyof typeof PORTFOLIO_COURSE_1;

export const isCourseGroup = (s: string | undefined): s is CourseGroup => s === "morning" || s === "afternoon";

/** The course page a class slug belongs to, or null — so /services/<slug> can send visitors there. */
export function coursePathForSlug(slug: string): string | null {
  for (const g of Object.values(PORTFOLIO_COURSE_1)) if (g.slug === slug) return g.path;
  return null;
}

/** How a SUBSCRIPTION-priced course is paid: so many monthly payments of so much. */
export interface CourseSubscription {
  /** "£45" */
  amountPerCycle: string;
  totalPayments: number;
  /** True when the first payment is taken at checkout (else on the recurring start date). */
  firstPaymentAtCheckout: boolean;
  /** "£45 a month for 12 months, first payment when you book" */
  label: string;
}

export interface CourseDetail extends ServiceDetail {
  subscription: CourseSubscription | null;
  /** The booking policy's own wording (the course agreement), "" when the policy has none. */
  policyName: string;
  policyText: string;
}

function subscriptionOf(raw: Raw): CourseSubscription | null {
  const sub: Raw | undefined = raw.payment?.rateType === "SUBSCRIPTION" ? raw.payment?.subscription : undefined;
  if (!sub) return null;
  const amountPerCycle = formatMoney(sub.amountPerBillingCycle);
  const totalPayments = Number(sub.totalPayments ?? 0) || 0;
  const firstPaymentAtCheckout = sub.firstChargeDate !== "SCHEDULED";
  if (!amountPerCycle || !totalPayments) return null;
  const each = sub.frequency === "MONTHLY" ? "a month" : "per payment";
  const span = sub.frequency === "MONTHLY" ? `${totalPayments} months` : `${totalPayments} payments`;
  return {
    amountPerCycle,
    totalPayments,
    firstPaymentAtCheckout,
    label: `${amountPerCycle} ${each} for ${span}${firstPaymentAtCheckout ? ", first payment when you book" : ""}`,
  };
}

/**
 * One course service by id — hidden or not (`hidden` only decides whether it is in the classes
 * list). Null when the id isn't a known service type. Throws when Wix can't be reached.
 */
export async function fetchCourseById(serviceId: string): Promise<CourseDetail | null> {
  const raw = (await services.getService(serviceId, { conditionalFields: SERVICES_CONDITIONAL_FIELDS as any })) as Raw;
  if (!raw || !isKnownType(raw)) return null;
  const policy: Raw = raw.bookingPolicy ?? {};
  const custom: Raw = policy.customPolicyDescription ?? {};
  return {
    ...toDetail(raw, imgSrc),
    subscription: subscriptionOf(raw),
    policyName: policy.name ?? "",
    policyText: custom.enabled === true ? String(custom.description ?? "") : "",
  };
}

/** How many sessions one read asks for: the course has 12, so one page holds them all. */
const COURSE_SESSIONS_LIMIT = 50;

/**
 * Every upcoming session of the course's schedule, oldest first, in the business time zone (the
 * events say which). Non-fatal: [] when the calendar can't be read.
 */
export async function fetchCourseSessions(scheduleId: string): Promise<Session[]> {
  try {
    const out: Session[] = [];
    let cursor: string | undefined;
    do {
      const r = await wixFetch("/calendar/v3/events/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionsRequest(scheduleId, { limit: COURSE_SESSIONS_LIMIT, cursor })),
      });
      if (!r.ok) return out;
      const res = (await r.json()) as Raw;
      out.push(...((res.events ?? []) as Raw[]).map(toSession));
      cursor = nextEventsCursor(res) ?? undefined;
    } while (cursor);
    return out;
  } catch {
    return [];
  }
}

export interface CoursePlaces {
  /** Seats on the course (its sessions' capacity, else the service's default). */
  capacity: number | null;
  /** Capacity minus the places Wix has booked, from the sessions still to come; null when unknown. */
  left: number | null;
  full: boolean;
}

/**
 * Places left on the course: a course booking takes a seat on EVERY session, so the course has as
 * many places as its fullest upcoming session has left. Cancelled sessions don't count.
 */
export function coursePlaces(sessions: Session[], defaultCapacity: number | null): CoursePlaces {
  const live = sessions.filter((s) => !s.isCancelled);
  const capacity = live.find((s) => s.totalCapacity != null)?.totalCapacity ?? defaultCapacity ?? null;
  const lefts = live.map((s) => s.spotsLeft).filter((n): n is number => n != null);
  const left = lefts.length ? Math.min(...lefts) : null;
  return { capacity, left, full: left != null && left <= 0 };
}

/** A checkbox on the booking form (a BOOLEAN field): its submission key, label and whether it must be ticked. */
export interface AgreementField {
  target: string;
  label: string;
  required: boolean;
}

/** The text of a Ricos rich-content label (a checkbox's label is rich content so it can hold links). */
function richText(node: Raw | undefined | null): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  const own: string = node.textData?.text ?? "";
  const kids = ((node.nodes ?? []) as Raw[]).map(richText).join("");
  return `${own}${kids}`;
}

/**
 * The booking form's fields split the way the course page uses them: the text fields the shipped
 * form rules keep (name, email, phone…), and the first checkbox field, which carries the course
 * agreement when Saskia's "Portfolio Course 1" form is connected to the service (its value is
 * stored with the booking's form submission). Never throws: the contact basics and no checkbox
 * when the form can't be read.
 */
export async function fetchCourseForm(formId: string | null): Promise<{ fields: BookingFormField[]; agreement: AgreementField | null }> {
  if (!formId) return { fields: FALLBACK_FIELDS, agreement: null };
  try {
    const id = encodeURIComponent(formId);
    const json = async (path: string): Promise<Raw | null> => {
      const r = await wixFetch(path);
      return r.ok ? ((await r.json()) as Raw) : null;
    };
    const [res, full] = await Promise.all([json(`/form-schema-service/v4/forms/${id}/summary`), json(`/form-schema-service/v4/forms/${id}`).catch(() => null)]);
    if (!res) return { fields: FALLBACK_FIELDS, agreement: null };
    const fields = toFormFields(res.formSummary, full?.form);
    const summaryBox = ((res.formSummary?.fields ?? []) as Raw[]).find((f) => !f.deleted && f.type === "BOOLEAN" && f.target);
    let agreement: AgreementField | null = null;
    if (summaryBox) {
      const schemaField = ((full?.form?.formFields ?? []) as Raw[]).find((f) => f.inputOptions?.target === summaryBox.target);
      const legacyField = ((full?.form?.fields ?? []) as Raw[]).find((f) => f.target === summaryBox.target);
      const richLabel = richText(schemaField?.inputOptions?.booleanOptions?.checkboxOptions?.label);
      agreement = {
        target: summaryBox.target,
        label: (summaryBox.label as string) || richLabel || "I agree",
        required: schemaField?.inputOptions?.required === true || legacyField?.validation?.required === true,
      };
    }
    return { fields, agreement };
  } catch {
    return { fields: FALLBACK_FIELDS, agreement: null };
  }
}
