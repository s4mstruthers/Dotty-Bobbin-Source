// Gift cards over the SDK/REST — the transport only; mappers and the cart line live in
// ./gift-card-core. The product read is the documented Query Gift Card Products call (its SDK
// module isn't bundled, so it goes through wixFetch like the Calendar events read in bookings);
// the add is the same Add Line Items To Current Cart call the shop uses, with the gift card line.
// docs: https://dev.wix.com/docs/api-reference/business-solutions/gift-cards/gift-card-products/query-gift-card-products.md
// docs: https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart-v2/add-line-items-to-current-cart.md
import { currentCartV2 } from "@wix/ecom";
import { wixFetch, wixModule } from "../sdk";
import { fetchCart } from "../storefront/cart";
import { cartErrorMessage } from "../storefront/cart-core";
import type { Cart } from "../storefront/types";
import { giftCardCatalogItem, purchaseProblem, toGiftCardProduct } from "./gift-card-core";
import type { GiftCardProduct, GiftCardPurchase } from "./types";

type Raw = Record<string, any>;

const cartApi = wixModule(currentCartV2);

/** The site's gift card product, or null when the site sells none (or the read isn't allowed). */
export async function fetchGiftCardProduct(): Promise<GiftCardProduct | null> {
  const r = await wixFetch("/gift-cards/v1/gift-card-products/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: { cursorPaging: { limit: 1 } } }),
  });
  if (!r.ok) throw new Error(`Gift card products query failed (${r.status}).`);
  const first = (((await r.json()) as Raw).giftCardProducts ?? [])[0];
  return first ? toGiftCardProduct(first) : null;
}

/**
 * Add a gift card to the current cart and return the cart. Refuses an incomplete purchase with
 * buyer copy before calling Wix; a line Wix refuses (quantity 0, not IN_STOCK) throws too.
 */
export async function addGiftCardToCart(product: GiftCardProduct, purchase: GiftCardPurchase, currency: string): Promise<Cart> {
  const problem = purchaseProblem(product, purchase);
  if (problem) throw new Error(problem);
  let raw: Raw;
  try {
    raw = (await cartApi.addLineItemsToCurrentCart({ catalogItems: [giftCardCatalogItem(product, purchase, currency)] } as any)).cart as Raw;
  } catch (e) {
    throw new Error(cartErrorMessage(e));
  }
  const line = ((raw?.lineItems ?? []) as Raw[]).find((l) => l.source?.catalogReference?.catalogItemId === product.id);
  if (!line || line.quantityInfo?.confirmedQuantity === 0 || (line.status && line.status !== "IN_STOCK")) {
    throw new Error("The gift card couldn't be added just now. Please try again or get in touch.");
  }
  return fetchCart();
}
