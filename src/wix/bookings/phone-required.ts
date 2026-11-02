// The phone number is required on every booking form here, whatever the Wix form schema says.
// Wix's hosted checkout requires a phone (its customer details show "Phone*"), and on this site a
// booking made by a logged-in member WITHOUT a phone has never reached the checkout: the page
// answers "We couldn't load the checkout" every time (13 abandoned bookings, 2 Nov 2026), while
// every booking with a phone went through. Requiring it on the form stops the failing combination
// before the booking is created.
import type { BookingFormField } from "./types";

export const isPhoneField = (f: BookingFormField): boolean => f.target === "phone" || f.type === "PHONE";

/** The same fields, with the phone field marked required (unchanged when the form has none). */
export function requirePhone(fields: BookingFormField[]): BookingFormField[] {
  return fields.map((f) => (isPhoneField(f) && !f.required ? { ...f, required: true } : f));
}
