// A small row of shop products for the home page — the same tiles (with the shipped QuickAdd) as
// the shop. Hydrated client:visible so the buy buttons work when the row scrolls into view.
import type { ProductSummary } from "../../wix/storefront/types";
import ProductTile from "./ProductTile";

const MOTIFS = ["needle", "scissors", "spool", "bag"] as const;

export default function FeaturedProducts({ products }: { products: ProductSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductTile key={p.id} p={p} motif={MOTIFS[i % MOTIFS.length]} />
      ))}
    </div>
  );
}
