// React binding for the cart store. Works in any React root — Astro islands (several on one
// page share the same store) and SPAs alike.
import { useSyncExternalStore } from "react";
import {
  addLine,
  applyCartCoupon,
  getCartState,
  goToCheckout,
  refreshCart,
  removeCartCoupon,
  removeCartLine,
  setCartNote,
  setCartOpen,
  subscribeCart,
  updateLineQuantity,
  type CartState,
} from "../../wix/storefront/cart-store";
import type { AddToCartExtras } from "../../wix/storefront/cart";

const SERVER_STATE = getCartState();

// Module-scope so their identity never changes between renders: CartDrawer's overlay effect
// depends on closeCart, and a fresh function each render re-ran it on every keystroke, moving
// focus out of the note field, whose blur saved the note, which re-rendered — a freeze.
const openCart = () => setCartOpen(true);
const closeCart = () => setCartOpen(false);

export interface UseCart extends CartState {
  itemCount: number;
  addToCart: (
    productId: string,
    variantId?: string | null,
    quantity?: number,
    extras?: AddToCartExtras,
  ) => Promise<void>;
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>;
  removeLine: (lineItemId: string) => Promise<void>;
  /** Apply a coupon code — rejects with buyer copy (and sets .error) when it can't be applied. */
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  /** Save the buyer's note to the merchant (call on blur). */
  setNote: (note: string) => Promise<void>;
  checkout: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  refresh: () => Promise<void>;
}

export function useCart(): UseCart {
  const state = useSyncExternalStore(subscribeCart, getCartState, () => SERVER_STATE);
  return {
    ...state,
    itemCount: state.cart?.itemCount ?? 0,
    addToCart: addLine,
    updateQuantity: updateLineQuantity,
    removeLine: removeCartLine,
    applyCoupon: applyCartCoupon,
    removeCoupon: removeCartCoupon,
    setNote: setCartNote,
    checkout: goToCheckout,
    openCart,
    closeCart,
    refresh: refreshCart,
  };
}
