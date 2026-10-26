// The gift card page's buying panel: pick an amount (a preset, or your own within the product's
// range), say who it's for (someone else → their name, email and a message; yourself → nothing
// more), and add it to the same cart as the shop. Wix issues the card and emails the code once
// the order is paid. Mount client:load with the product read on the server.
import { useState } from "react";
import { useCart } from "../../hooks/storefront/useCart";
import { addGiftCardLine } from "../../wix/storefront/cart-store";
import { CUSTOM_AMOUNT_ID, purchaseProblem } from "../../wix/gift-cards/gift-card-core";
import type { GiftCardProduct, GiftCardPurchase } from "../../wix/gift-cards/types";
import { BUSINESS, GIFT_CARD_AMOUNT_LABELS } from "../../content/site";

const chip = (selected: boolean) =>
  `rounded-control border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors ${
    selected ? "border-sage bg-secondary text-sage-deep ring-2 ring-sage/30" : "border-border text-foreground hover:border-sage hover:bg-secondary"
  }`;
const heading = "mb-2 block text-xs font-bold uppercase tracking-wider text-sage-deep";
const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground";

export default function GiftCardView({ product }: { product: GiftCardProduct }) {
  const { pendingProductId, error } = useCart();
  const [amountId, setAmountId] = useState(product.amounts[0]?.id ?? (product.custom ? CUSTOM_AMOUNT_ID : ""));
  const [customText, setCustomText] = useState("");
  const [forSomeoneElse, setForSomeoneElse] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showProblem, setShowProblem] = useState(false);

  const customAmount = customText.trim() === "" ? null : Number(customText);
  const purchase: GiftCardPurchase = {
    amountId,
    customAmount: amountId === CUSTOM_AMOUNT_ID ? customAmount : null,
    quantity: 1,
    recipient: forSomeoneElse ? { name, email, message } : null,
  };
  const problem = purchaseProblem(product, purchase);
  const adding = pendingProductId === product.id;

  const add = async () => {
    setShowProblem(true);
    if (problem) return;
    try {
      await addGiftCardLine(product, purchase, BUSINESS.currency);
      setShowProblem(false);
    } catch {
      /* the cart store holds the message; the drawer and the line below show it */
    }
  };

  return (
    <div>
      <fieldset>
        <legend className={heading}>Amount</legend>
        <div className="flex flex-wrap gap-2">
          {product.amounts.map((a) => (
            <button key={a.id} type="button" className={chip(amountId === a.id)} aria-pressed={amountId === a.id} onClick={() => setAmountId(a.id)}>
              {a.price}
              {GIFT_CARD_AMOUNT_LABELS[a.priceAmount] && <span className="font-normal"> · {GIFT_CARD_AMOUNT_LABELS[a.priceAmount]}</span>}
              {a.value !== a.price && <span className="ml-1 font-normal text-muted-foreground">(worth {a.value})</span>}
            </button>
          ))}
          {product.custom && (
            <button type="button" className={chip(amountId === CUSTOM_AMOUNT_ID)} aria-pressed={amountId === CUSTOM_AMOUNT_ID} onClick={() => setAmountId(CUSTOM_AMOUNT_ID)}>
              Other amount
            </button>
          )}
        </div>
        {product.custom && amountId === CUSTOM_AMOUNT_ID && (
          <label className="mt-3 block">
            <span className="text-sm font-semibold">
              Your amount <span className="font-normal text-muted-foreground">({product.custom.minLabel} to {product.custom.maxLabel})</span>
            </span>
            <span className="relative mt-1.5 block max-w-[12rem]">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">£</span>
              <input type="number" inputMode="decimal" min={product.custom.min} max={product.custom.max} step="0.01" value={customText} onChange={(e) => setCustomText(e.target.value)}
                className="w-full rounded-md border border-border bg-background py-2 pl-7 pr-3 text-sm text-foreground" />
            </span>
          </label>
        )}
      </fieldset>

      <fieldset className="mt-6">
        <legend className={heading}>Who is it for?</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(forSomeoneElse)} aria-pressed={forSomeoneElse} onClick={() => setForSomeoneElse(true)}>
            Someone else
          </button>
          <button type="button" className={chip(!forSomeoneElse)} aria-pressed={!forSomeoneElse} onClick={() => setForSomeoneElse(false)}>
            Myself
          </button>
        </div>
        {forSomeoneElse ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Their name</span>
              <input type="text" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1.5`} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Their email</span>
              <input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1.5`} />
            </label>
            <label className="block sm:col-span-2">
              <span className="flex justify-between text-sm font-semibold">
                <span>
                  A message <span className="font-normal text-muted-foreground">(optional)</span>
                </span>
                <span className="tabular-nums font-normal text-muted-foreground">{message.length}/300</span>
              </span>
              <textarea rows={3} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} className={`${input} mt-1.5`} />
            </label>
            <p className="text-xs text-muted-foreground sm:col-span-2">The gift card code is emailed to them as soon as your order is paid.</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">The gift card code is emailed to you as soon as your order is paid.</p>
        )}
      </fieldset>

      {showProblem && problem && (
        <p className="mt-4 text-sm font-semibold text-destructive" role="alert">
          {problem}
        </p>
      )}
      {!problem && error && (
        <p className="mt-4 text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}

      <button type="button" onClick={add} disabled={adding} className="btn mt-6 w-full disabled:opacity-60 sm:w-auto">
        {adding ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}
