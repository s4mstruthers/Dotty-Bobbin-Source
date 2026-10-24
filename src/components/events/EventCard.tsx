// One retreat / day out as a rounded card: photo (or the dotted placeholder), date, title,
// where, price-from and a Book pill. The whole card links to the event page, where tickets are
// bought through Wix. Data is the shipped EventSummary DTO — date and price already formatted.
import { imgAttrs } from "../../wix/media";
import type { EventSummary } from "../../wix/events/types";
import NoPhoto from "../ui/NoPhoto";

export default function EventCard({ event, tone = "pink" }: { event: EventSummary; tone?: "pink" | "sage" }) {
  const where = event.locationType === "ONLINE" ? "Online" : event.locationName;
  return (
    <a
      href={`/events/${encodeURIComponent(event.slug)}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background no-underline transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(78,76,76,0.45)]"
    >
      <div className={`relative overflow-hidden ${event.imageUrl ? "aspect-[3/2]" : "aspect-[16/7]"}`}>
        {event.imageUrl ? (
          <img {...imgAttrs(event.imageUrl, "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", 3 / 2)} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <NoPhoto motif="calendar" tone={tone} />
        )}
        {event.soldOut && (
          <span className="absolute left-4 top-4 rounded-control bg-foreground px-3 py-1 text-xs font-bold text-background">Sold out</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {event.dateLabel && <p className="text-sm font-semibold text-sage-deep">{event.dateLabel}</p>}
        <h3 className="mt-1.5 break-words text-xl text-foreground">{event.title}</h3>
        {where && <p className="mt-1 text-sm text-muted-foreground">{where}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="font-bold">{event.priceLabel}</span>
          <span className={`btn px-5 py-2 text-sm ${event.soldOut ? "opacity-50" : ""}`}>{event.soldOut ? "Details" : "Book"}</span>
        </div>
      </div>
    </a>
  );
}
