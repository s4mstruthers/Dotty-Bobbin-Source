// What kinds of item went to the Wix checkout (shop products to collect, digital patterns, gift cards), kept for the thank-you
// page in the visit's session storage: Wix sends only ?orderId= back, so /order-confirmation
// shows the panels that fit from this. Written by goToCheckout (./cart-store), read once there.
import { GIFT_CARDS_APP_ID } from "../gift-cards/gift-card-core";
import type { CartLine } from "./types";

export interface CheckoutKinds {
  /** Shop items to collect. */
  shop: boolean;
  /** Digital downloads (patterns): emailed, nothing to collect. */
  digital: boolean;
  giftCard: boolean;
  /** Class bookings (several dates of a class have no single calendar event to show). */
  classes?: boolean;
}

const KEY = "checkout-kinds";

export function rememberCheckoutKinds(lines: CartLine[]): void {
  const kinds: CheckoutKinds = {
    shop: lines.some((l) => l.appId !== GIFT_CARDS_APP_ID && !l.digital),
    digital: lines.some((l) => l.digital),
    giftCard: lines.some((l) => l.appId === GIFT_CARDS_APP_ID),
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...kinds, savedAt: Date.now() }));
  } catch {}
}

/** A class booking is going to the checkout: the thank-you page shows the class panel, not the shop's. */
export function rememberClassCheckout(): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ shop: false, digital: false, giftCard: false, classes: true, savedAt: Date.now() }));
  } catch {}
}

/** Drop what an earlier cart checkout kept — a class booking's checkout calls this before leaving. */
export function forgetCheckoutKinds(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

/** The kinds sent to the last checkout (read once, then forgotten); null when none was kept. */
export function takeCheckoutKinds(): CheckoutKinds | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    const k = raw ? JSON.parse(raw) : null;
    // A checkout takes minutes; anything older is from a checkout that was left.
    if (!k || Date.now() - k.savedAt > 2 * 60 * 60 * 1000) return null;
    return { shop: k.shop === true, digital: k.digital === true, giftCard: k.giftCard === true, classes: k.classes === true };
  } catch {
    return null;
  }
}
