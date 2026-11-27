// The phone number is required on every booking form here, whatever the Wix form schema says.
// Wix's hosted checkout requires a phone (its customer details show "Phone*"), and on this site a
// booking made by a logged-in member WITHOUT a phone has never reached the checkout: the page
// answers "We couldn't load the checkout" every time (13 abandoned bookings, 2 Nov 2026), while
// every booking with a phone went through. Requiring it on the form stops the failing combination
// before the booking is created.
import type { BookingFormField } from "./types";
import { FALLBACK_FIELDS } from "./booking-core";

export const isPhoneField = (f: BookingFormField): boolean => f.target === "phone" || f.type === "PHONE";

/** A phone field as the site's booking forms have it (the default form the courses use carries one). */
const PHONE_FIELD: BookingFormField = { target: "phone", label: "Phone", type: "PHONE", required: true };

/**
 * The same fields, with the phone field marked required. A form read from Wix without a phone
 * field is left as it is (Wix would refuse a value for a field its form doesn't have). The stand-in
 * fields used when the form can't be read at all (no form id, or the read failed) get the phone
 * added: those bookings go to Wix's default form, which has it, and without it the form had no
 * phone at all.
 */
export function requirePhone(fields: BookingFormField[]): BookingFormField[] {
  const out = fields.map((f) => (isPhoneField(f) && !f.required ? { ...f, required: true } : f));
  return fields === FALLBACK_FIELDS && !out.some(isPhoneField) ? [...out, PHONE_FIELD] : out;
}
