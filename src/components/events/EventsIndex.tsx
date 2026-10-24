// The live list of upcoming retreats and days out, on the shipped useEvents hook. Only upcoming
// and in-progress events arrive (soonest first), so past ones disappear on their own.
import { useEvents } from "../../hooks/events/useEvents";
import type { EventSummary } from "../../wix/events/types";
import EventCard from "./EventCard";

export default function EventsIndex(props: { initialEvents?: EventSummary[]; initialTotal?: number }) {
  const { events, categories, activeCategoryId, setActiveCategoryId, hasMore, loadingMore, loadMore, error } = useEvents(props);

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ id: null as string | null, name: "All" }, ...categories].map((c) => (
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

      {error && <p className="mb-4 text-sm text-destructive">Events couldn't be loaded just now. Please refresh the page.</p>}

      {events === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg bg-secondary p-8 text-center">
          <p className="font-display text-lg font-bold">No retreats or days out are booked in right now</p>
          <p className="mt-1 text-sm text-muted-foreground">New dates are added through the year — check back soon, or get in touch.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e, i) => (
            <EventCard key={e.id} event={e} tone={i % 2 ? "sage" : "pink"} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="link-pill disabled:opacity-50">
            {loadingMore ? "Loading…" : "Show more dates"}
          </button>
        </div>
      )}
    </div>
  );
}
