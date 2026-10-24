// The live list of classes and appointments, on the shipped useServices hook (paging, the
// category filter and the weekdays a class runs on all come from Wix). Used on the home page
// and on /services. Hooks first, branches after.
import { useServices } from "../../hooks/bookings/useServices";
import type { BookingCategory, LocationOption, ServiceSummary } from "../../wix/bookings/types";
import ClassCard from "./ClassCard";

const MOTIFS = ["spool", "needle", "scissors"] as const;

export default function ClassesList(props: {
  initialServices?: ServiceSummary[];
  initialHasMore?: boolean;
  initialCategories?: BookingCategory[];
  initialLocations?: { locations: LocationOption[]; hasOtherLocations: boolean };
  initialCategoryId?: string | null;
  initialLocationId?: string | null;
  /** The home page shows the list without the filter row or URL syncing. */
  compact?: boolean;
}) {
  const { compact = false, ...options } = props;
  const { services, hasMore, loadingMore, loadMore, categories, activeCategoryId, setActiveCategoryId, error } = useServices({
    ...options,
    syncUrl: !compact,
  });

  // Only offer categories that actually hold services (Wix keeps an empty default one).
  const used = new Set((props.initialServices ?? []).map((s) => s.categoryId).filter(Boolean));
  const shownCategories = categories.filter((c) => used.has(c.id));

  return (
    <div>
      {!compact && shownCategories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ id: null as string | null, name: "All" }, ...shownCategories].map((c) => (
            <button
              key={c.id ?? "all"}
              type="button"
              aria-pressed={activeCategoryId === c.id}
              onClick={() => setActiveCategoryId(c.id)}
              className={`rounded-control border px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCategoryId === c.id ? "border-sage bg-secondary text-sage-deep" : "border-border hover:bg-secondary"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-destructive">Classes couldn't be loaded just now. Please refresh the page.</p>}

      {services === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-lg bg-secondary p-8 text-center">
          <p className="font-display text-lg font-bold">No classes are listed right now</p>
          <p className="mt-1 text-sm text-muted-foreground">New dates are added regularly — or get in touch to ask about a private class.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <ClassCard key={s.id} service={s} motif={MOTIFS[i % MOTIFS.length]} />
          ))}
        </div>
      )}

      {hasMore && !compact && (
        <div className="mt-8 text-center">
          <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="link-pill disabled:opacity-50">
            {loadingMore ? "Loading…" : "Show more classes"}
          </button>
        </div>
      )}
    </div>
  );
}
