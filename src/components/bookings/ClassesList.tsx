// The live list of classes and appointments, on the shipped useServices hook (paging, the
// category filter and the weekdays a class runs on all come from Wix). Used on the home page
// and on /services. Hooks first, branches after.
import { useServices } from "../../hooks/bookings/useServices";
import type { BookingCategory, LocationOption, ServiceSummary } from "../../wix/bookings/types";
import type { CourseGroupSummary } from "../../wix/bookings/course";
import ClassCard from "./ClassCard";
import PortfolioCourseSummary from "./PortfolioCourseSummary";

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
  /**
   * Portfolio Course 1's two groups, shown as one featured panel above the cards instead of a
   * picture card each (/services and the home page both pass it).
   */
  courseGroups?: CourseGroupSummary[];
}) {
  const { compact = false, courseGroups = [], ...options } = props;
  const { services, hasMore, loadingMore, loadMore, categories, activeCategoryId, setActiveCategoryId, error } = useServices({
    ...options,
    syncUrl: !compact,
  });

  // Only offer categories that actually hold services (Wix keeps an empty default one).
  // (The server's list when it sent one; else the first list the browser loaded.)
  const used = new Set((props.initialServices ?? services ?? []).map((s) => s.categoryId).filter(Boolean));
  const shownCategories = categories.filter((c) => used.has(c.id));

  // The course groups leave the cards for the featured panel, which follows the category filter.
  const courseIds = new Set(courseGroups.map((g) => g.serviceId));
  const cards = services?.filter((s) => !courseIds.has(s.id)) ?? null;
  const showCourse = courseGroups.length > 0 && (activeCategoryId == null || courseGroups.some((g) => g.categoryId === activeCategoryId));

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

      {showCourse && <PortfolioCourseSummary groups={courseGroups} headingLevel={compact ? 3 : 2} />}

      {cards === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        showCourse ? null : <div className="rounded-lg bg-secondary p-8 text-center">
          <p className="font-display text-lg font-bold">No classes are listed right now</p>
          <p className="mt-1 text-sm text-muted-foreground">New dates are added regularly — or get in touch to ask about a private class.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((s, i) => (
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
