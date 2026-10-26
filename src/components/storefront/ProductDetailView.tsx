// The product page, on the shipped useProductDetail hook (option selection, variants, stock and
// add-to-cart all live there) with the shipped OptionPicker as the buy column. On a phone the
// image is a bounded band so name, price, the first choice and the button fit the first screen.
// Hooks first, branches after.
import { useEffect, useState } from "react";
import { useProductDetail } from "../../hooks/storefront/useProductDetail";
import { heroFitAttrs, imgFitAttrs } from "../../wix/media-fit";
import type { ProductDetail } from "../../wix/storefront/types";
import NoPhoto from "../ui/NoPhoto";
import OptionPicker from "./OptionPicker";
import { SHOP_COLLECTION_NOTE } from "../../content/site";

export default function ProductDetailView(props: { initial?: ProductDetail | null; slug?: string }) {
  const d = useProductDetail(props);
  const gallery = d.product?.gallery ?? [];
  const [active, setActive] = useState<string | null>(gallery[0] ?? null);

  // The picked colour's photo becomes the main image.
  useEffect(() => {
    if (d.imageUrl) setActive(d.imageUrl);
  }, [d.imageUrl]);

  if (d.notFound) {
    return (
      <div className="rounded-lg bg-secondary p-10 text-center">
        <p className="font-display text-2xl font-bold">This item isn't in the shop any more</p>
        <a href="/shop" className="link-pill mt-5 bg-background">Back to the shop</a>
      </div>
    );
  }
  if (!d.product) {
    return <div className="h-96 animate-pulse rounded-lg bg-secondary" aria-busy="true" />;
  }

  const p = d.product;
  const main = active ?? gallery[0] ?? "";

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <a href="/shop" className="no-underline hover:underline">Shop</a>
        {p.breadcrumbs.filter((c) => c.slug !== "all-products").map((c) => (
          <span key={c.id}>
            <span aria-hidden="true"> › </span>
            <a href={`/category/${c.slug}`} className="no-underline hover:underline">{c.name}</a>
          </span>
        ))}
        <span aria-hidden="true"> › </span>
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-16">
        <div>
          <div className="aspect-[4/3] max-h-[40vh] overflow-hidden rounded-lg bg-secondary md:aspect-square md:max-h-none">
            {main ? (
              <img {...heroFitAttrs(main, "(min-width: 768px) 50vw, 100vw")} alt={p.name} className="h-full w-full object-contain" />
            ) : (
              <NoPhoto motif="bag" />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {gallery.map((url, i) => (
                <button key={url} type="button" onClick={() => setActive(url)} aria-label={`Photo ${i + 1} of ${gallery.length}`} aria-pressed={url === main} className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 ${url === main ? "border-sage" : "border-transparent"}`}>
                  <img {...imgFitAttrs(url, "64px")} alt="" className="h-full w-full bg-secondary object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 md:mt-0">
          {p.ribbons.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {p.ribbons.map((r) => (
                <span key={r} className="rounded-control bg-blush px-3 py-0.5 text-xs font-bold text-primary-foreground">{r}</span>
              ))}
            </div>
          )}
          <h1 className="break-words text-3xl text-sage sm:text-4xl">{p.name}</h1>
          <p className="mt-3 text-2xl font-bold">
            {d.price}
            {d.compareAtPrice && (
              <s className="ml-2 text-lg font-normal text-muted-foreground">
                <span className="sr-only">was </span>
                {d.compareAtPrice}
              </s>
            )}
          </p>
          {d.pricePerUnit && <p className="text-sm text-muted-foreground">{d.pricePerUnit}</p>}
          {p.discountNames.length > 0 && <p className="text-sm text-sage-deep">{p.discountNames.join(" · ")}</p>}

          <div className="mt-6">
            <OptionPicker detail={d} showQuantity />
          </div>
          <p className="mt-4 rounded-md bg-secondary px-4 py-2 text-sm font-semibold">{SHOP_COLLECTION_NOTE}</p>

          {p.descriptionHtml && <div className="prose-db mt-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} />}
          {p.infoSections.map((s) => (
            <details key={s.title} className="mt-4 rounded-md bg-secondary px-5 py-4">
              <summary className="cursor-pointer font-display font-bold">{s.title}</summary>
              <div className="prose-db mt-2 text-sm" dangerouslySetInnerHTML={{ __html: s.html }} />
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
