// Gift cards — pure mappers and the cart line, no transport. The Gift Card Products API
// describes the product; what a BUYER sends to the cart is not in the reference docs, so the
// line here is copied from Wix's own gift card page (the Gift Card app's deployed controller,
// static.parastorage.com/services/rise-client-gift-card-page-ooi/…/GiftCardController.bundle.min.js,
// `buildGiftCardCatalogOptions` + `addToCurrentCart`) and from Wix's published
// @wix/headless-gift-voucher package (`productToLineItems`), which build the identical line.
// docs: https://dev.wix.com/docs/api-reference/business-solutions/gift-cards/gift-card-products/query-gift-card-products.md
import type { GiftCardAmount, GiftCardProduct, GiftCardPurchase } from "./types";

type Raw = Record<string, any>;

/** The Wix Gift Cards app — the cart line's `catalogReference.appId`. */
export const GIFT_CARDS_APP_ID = "d80111c5-a0f4-47a8-b63a-65b54d774a27";

/** The `amountId` that means "the buyer typed their own amount" (Wix's own widget uses this id). */
export const CUSTOM_AMOUNT_ID = "custom";

const PERIOD_WORD: Record<string, string> = { DAYS: "day", WEEKS: "week", MONTHS: "month", YEARS: "year" };

function expiryLabel(raw: Raw): string {
  if (raw.expirationType === "RELATIVE" && raw.relativeExpirationDate?.value) {
    const { value, period } = raw.relativeExpirationDate;
    const word = PERIOD_WORD[period] ?? String(period ?? "").toLowerCase();
    return `Valid for ${value} ${word}${value === 1 ? "" : "s"}`;
  }
  if (raw.expirationType === "FIXED" && raw.fixedExpirationDate) {
    const d = new Date(raw.fixedExpirationDate);
    if (!Number.isNaN(d.getTime())) return `Expires ${d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  return "";
}

const money = (m: Raw | undefined): string => m?.formattedAmount ?? m?.formattedConvertedAmount ?? "";

export function toGiftCardProduct(raw: Raw): GiftCardProduct {
  const amounts: GiftCardAmount[] = ((raw.presetVariants ?? []) as Raw[])
    .filter((v) => v?.id && v.price?.amount)
    .map((v) => ({ id: v.id, price: money(v.price), value: money(v.value ?? v.price), priceAmount: String(v.price.amount) }));
  const cv: Raw | undefined = raw.customVariant;
  const min = Number(cv?.minValue?.amount);
  const max = Number(cv?.maxValue?.amount);
  return {
    id: raw.id ?? "",
    name: raw.name ?? "Gift Card",
    description: raw.description ?? "",
    imageUrl: raw.image?.url ?? "",
    amounts,
    custom: cv && min > 0 && max >= min ? { min, max, minLabel: money(cv.minValue), maxLabel: money(cv.maxValue) } : null,
    expiryLabel: expiryLabel(raw),
  };
}

/** "Please pick an amount" / "Enter an amount between £10 and £200" / … — null when the purchase is complete. */
export function purchaseProblem(product: GiftCardProduct, p: GiftCardPurchase): string | null {
  if (p.amountId === CUSTOM_AMOUNT_ID) {
    if (!product.custom) return "Please pick an amount.";
    if (p.customAmount === null || !Number.isFinite(p.customAmount)) return "Please enter an amount.";
    if (p.customAmount < product.custom.min || p.customAmount > product.custom.max) return `Enter an amount between ${product.custom.minLabel} and ${product.custom.maxLabel}.`;
  } else if (!product.amounts.some((a) => a.id === p.amountId)) {
    return "Please pick an amount.";
  }
  if (p.quantity < 1) return "Please choose how many.";
  if (p.recipient) {
    if (!p.recipient.name.trim()) return "Please enter the recipient's name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.recipient.email.trim())) return "Please enter a valid email address for the recipient.";
  }
  return null;
}

/**
 * The cart line for one gift card purchase — the entry of `catalogItems` in Add Line Items To
 * Current Cart. The option names are Wix's own (see the file comment): a preset amount goes as
 * `variantId`, a typed one as `customAmount`; the recipient only when it's a gift.
 */
export function giftCardCatalogItem(product: GiftCardProduct, p: GiftCardPurchase, currency: string): Raw {
  const options: Raw = { quantity: p.quantity, currency, wixGiftCardsAppNewCatalog: true };
  if (p.amountId === CUSTOM_AMOUNT_ID) options.customAmount = p.customAmount;
  else options.variantId = p.amountId;
  if (p.recipient) {
    const [first = "", ...rest] = p.recipient.name.trim().split(/\s+/).filter(Boolean);
    options.giftingInfo = { recipientInfo: { firstName: first, lastName: rest.join(" "), email: p.recipient.email.trim() } };
    const message = p.recipient.message.trim();
    if (message) options.giftingInfo.greetingMessage = message;
  }
  return { quantity: p.quantity, catalogReference: { appId: GIFT_CARDS_APP_ID, catalogItemId: product.id, options } };
}

/** True for a cart line that is a gift card (vs a shop product). */
export const isGiftCardLine = (line: Raw): boolean => line?.source?.catalogReference?.appId === GIFT_CARDS_APP_ID || line?.catalogReference?.appId === GIFT_CARDS_APP_ID;
