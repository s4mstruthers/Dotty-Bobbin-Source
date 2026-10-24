// One shop product as a tile, on the shipped ProductSummary DTO (prices and ribbons arrive
// formatted). The tile root is a flex column (NOT the link): the link wraps image + name +
// price, and the shipped <QuickAdd> sits beside it as the last child so every buy button in a
// row lines up. A button inside a link would be invalid and would navigate instead of adding.
import { imgAttrs } from "../../wix/media";
import type { ProductSummary } from "../../wix/storefront/types";
import NoPhoto from "../ui/NoPhoto";
import QuickAdd from "./QuickAdd";

export function ProductPrice({ p }: { p: ProductSummary }) {
  if (p.fromPrice) return <span>From {p.price}</span>;
  if (p.price !== p.maxPrice && p.maxPrice) return <span>{p.price} – {p.maxPrice}</span>;
  return (
    <span>
      {p.price}
      {p.compareAtPrice && (
        <>
          {" "}
          <s className="font-normal text-muted-foreground">
            <span className="sr-only">was </span>
            {p.compareAtPrice}
          </s>
        </>
      )}
    </span>
  );
}

export default function ProductTile({ p, motif = "bag" }: { p: ProductSummary; motif?: "bag" | "needle" | "scissors" | "spool" }) {
  return (
    <div className="relative flex flex-col rounded-lg bg-background">
      <a href={`/products/${encodeURIComponent(p.slug)}`} className="group block min-w-0 no-underline">
        <div className="relative aspect-square overflow-hidden rounded-md">
          {p.imageUrl ? (
            <>
              <img {...imgAttrs(p.imageUrl, "(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw")} alt={p.name} className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0" />
              {p.hoverImageUrl && <img {...imgAttrs(p.hoverImageUrl, "(min-width: 1024px) 22vw, 50vw")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
            </>
          ) : (
            <NoPhoto motif={motif} tone="sage" className="transition-transform duration-500 group-hover:scale-[1.03]" />
          )}
          {p.ribbons.length > 0 && (
            <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
              {p.ribbons.map((r) => (
                <span key={r} className="rounded-control bg-blush px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{r}</span>
              ))}
            </span>
          )}
        </div>
        <h3 className="mt-3 min-w-0 break-words font-sans text-[15px] font-semibold leading-snug text-foreground">{p.name}</h3>
        <p className="mt-1 text-[15px] font-bold">
          <ProductPrice p={p} />
        </p>
        {p.pricePerUnit && <p className="text-xs text-muted-foreground">{p.pricePerUnit}</p>}
        {p.discountNames.length > 0 && <p className="text-xs text-sage-deep">{p.discountNames.join(" · ")}</p>}
        {p.swatches.length > 0 ? (
          <span className="mt-2 flex gap-1.5" aria-label={p.optionsSummary}>
            {p.swatches.map((hex) => (
              <span key={hex} className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: hex }} />
            ))}
          </span>
        ) : (
          p.optionsSummary && <p className="mt-1 text-xs text-muted-foreground">{p.optionsSummary}</p>
        )}
        {p.availability === "OUT_OF_STOCK" && !p.preorder && <p className="mt-1 text-xs font-semibold text-muted-foreground">Out of stock</p>}
      </a>
      <QuickAdd product={p} />
    </div>
  );
}
