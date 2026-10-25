// Gift card DTOs — plain JSON, safe as Astro island props. Prices arrive formatted ("£17.50").

/** One fixed amount the buyer can pick (Gift Card Products `presetVariants[]`). */
export interface GiftCardAmount {
  id: string;
  /** What the buyer pays, formatted. */
  price: string;
  /** The balance loaded on the card, formatted — differs from `price` only for a promotion. */
  value: string;
  /** Raw decimal of `price` ("17.5") — for the custom-amount comparison only, never displayed. */
  priceAmount: string;
}

/** The site's one gift card product (Wix allows a single one per site). */
export interface GiftCardProduct {
  id: string;
  name: string;
  description: string;
  /** Resolved https URL ("" when none). */
  imageUrl: string;
  amounts: GiftCardAmount[];
  /** "Pick your own amount" bounds when the product allows it; null otherwise. */
  custom: { min: number; max: number; minLabel: string; maxLabel: string } | null;
  /** "Valid for 12 months" / "Expires 31 December 2026" / "" when the card never expires. */
  expiryLabel: string;
}

/** What the buyer chose on the gift card page. */
export interface GiftCardPurchase {
  /** A preset amount's id, or "custom" with `customAmount`. */
  amountId: string;
  customAmount: number | null;
  quantity: number;
  /** For someone else: recipient details; for themselves: null. */
  recipient: { name: string; email: string; message: string } | null;
}
