// What kinds of item went to the Wix checkout (shop products, gift cards), kept for the thank-you
// page in the visit's session storage: Wix sends only ?orderId= back, so /order-confirmation
// shows the panels that fit from this. Written by goToCheckout (./cart-store), read once there.
import { GIFT_CARDS_APP_ID } from "../gift-cards/gift-card-core";
import type { CartLine } from "./types";

export interface CheckoutKinds {
  shop: boolean;
  giftCard: boolean;
}

const KEY = "checkout-kinds";

export function rememberCheckoutKinds(lines: CartLine[]): void {
  const kinds: CheckoutKinds = {
    shop: lines.some((l) => l.appId !== GIFT_CARDS_APP_ID),
    giftCard: lines.some((l) => l.appId === GIFT_CARDS_APP_ID),
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...kinds, savedAt: Date.now() }));
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
    return { shop: k.shop === true, giftCard: k.giftCard === true };
  } catch {
    return null;
  }
}
