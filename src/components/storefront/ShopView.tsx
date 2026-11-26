// The shop listing — mounted by /shop and by /category/[slug] (scoped). Built on the shipped
// useShop hook (sort, filters, facets, paging all run on Wix) and the shipped FilterPanel.
// Categories are real links so each has its own shareable page. Hooks first, branches after.
import { SORTS, useShop } from "../../hooks/storefront/useShop";
import type { CatalogSort } from "../../wix/storefront/catalog";
import type { Category, ProductSummary } from "../../wix/storefront/types";
import ProductTile from "./ProductTile";
import { SHOP } from "../../content/site";

const MOTIFS = ["bag", "needle", "scissors", "spool"] as const;

const byIndex = (a: Category, b: Category) => a.index - b.index || a.name.localeCompare(b.name);

export default function ShopView(props: {
  initialProducts?: ProductSummary[];
  initialCategories?: Category[];
  initialCategoryId?: string | null;
}) {
  const shop = useShop(props);
  const { products, categories, activeCategoryId, loading, error, retry, hasActiveFilters, clearFilters, hasMore, loadMore, loadingMore } = shop;

  // Which category links to show: on /shop the top-level ones; on a category page its
  // children (if any) else its siblings.
  const scoped = props.initialCategoryId ?? null;
  const current = scoped ? categories.find((c) => c.id === scoped) : undefined;
  const children = scoped ? categories.filter((c) => c.parentId === scoped) : [];
  // Patterns have their own page (/patterns), so they aren't one of the shop's category links.
  const shopCategories = categories.filter((c) => c.slug !== SHOP.patternsCategorySlug);
  const row = (!scoped ? shopCategories.filter((c) => c.parentId === null) : children.length ? children : shopCategories.filter((c) => c.parentId === (current?.parentId ?? null))).sort(byIndex);

  return (
    <div>
      {row.length > 1 && (
        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Shop categories">
          <a href="/shop" aria-current={!scoped ? "page" : undefined} className={pill(!scoped)}>
            All
          </a>
          {row.map((c) => (
            <a key={c.id} href={`/category/${c.slug}`} aria-current={activeCategoryId === c.id ? "page" : undefined} className={pill(activeCategoryId === c.id)}>
              {c.name}
              {c.productCount != null && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{c.productCount}</span>}
            </a>
          ))}
        </nav>
      )}

      {/* Just the count and the sort: with a small shop the category links do the filtering, and a
          price/colour sidebar was clutter (26 Nov 2026). FilterPanel is still there if it grows. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {shop.total != null ? `${shop.total} ${shop.total === 1 ? "item" : "items"}` : ""}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Sort
          <select value={shop.sort} onChange={(e) => shop.setSort(e.target.value as CatalogSort)} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        {error ? (
          <div className="rounded-lg bg-secondary p-6 text-sm">
            <p className="text-destructive">The shop couldn't be loaded just now.</p>
            <button type="button" onClick={() => retry()} className="mt-2 font-semibold underline">
              Try again
            </button>
          </div>
        ) : products === null ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i}>
                <div className="aspect-square animate-pulse rounded-md bg-secondary" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-secondary" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          hasActiveFilters ? (
            <div className="rounded-lg bg-secondary p-8 text-center">
              <p className="font-display text-lg font-bold">Nothing matches those filters</p>
              <button type="button" onClick={clearFilters} className="link-pill mt-4 bg-background">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-secondary p-8 text-center">
              <p className="font-display text-lg font-bold">Nothing in the shop here just now</p>
              <p className="mt-1 text-sm text-muted-foreground">Ask me in class if you're after something in particular.</p>
            </div>
          )
        ) : (
          <div aria-busy={loading} className={`grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity sm:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
            {products.map((p, i) => (
              <ProductTile key={p.id} p={p} motif={MOTIFS[i % MOTIFS.length]} />
            ))}
          </div>
        )}

        {hasMore && products && products.length > 0 && (
          <div className="mt-10 text-center">
            <button type="button" disabled={loadingMore} onClick={() => loadMore()} className="link-pill disabled:opacity-50">
              {loadingMore ? "Loading…" : "Show more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function pill(active: boolean) {
  return `rounded-control border px-4 py-1.5 text-sm font-semibold no-underline transition-colors ${
    active ? "border-sage bg-secondary text-sage-deep" : "border-border hover:bg-secondary"
  }`;
}
