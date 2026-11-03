// Every hosted Wix checkout (bookings, shop, events, payment forms) is entered through
// /api/checkout, which clears a stale copy of Wix's member-login cookie first: without it a
// returning member's checkout can fail with "We couldn't load the checkout". The why is in
// src/pages/api/checkout.ts.
//
// CHECKOUT-DOOR WORKAROUND: keep (added and decided 3 Nov 2026). The stale copy can form again
// whenever a member logs in twice, so this is not a one-off clean-up of old cookies. Remove it only
// if Wix's checkout stops keeping its own login copy; to check, on an iPhone log in as a member,
// book (stop at the checkout), log out and in again, and book again WITHOUT the door. If that loads,
// delete this file and src/pages/api/checkout.ts and drop viaCheckoutDoor() from its callers
// (`grep -rn viaCheckoutDoor src` lists them).

/** The address to send the browser to for a Wix redirect session's `fullUrl`. Unchanged on the server. */
export function viaCheckoutDoor(url: string): string {
  if (typeof window === "undefined") return url;
  return `/api/checkout?to=${encodeURIComponent(url)}`;
}
