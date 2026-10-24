// One class / appointment as a card: photo (or the dotted placeholder), type, name, the weekdays
// it runs, length and price. The whole card links to the service page, where the times and
// booking live. Data is the shipped ServiceSummary DTO — strings are already formatted.
import { imgFitAttrs } from "../../wix/media-fit";
import type { ServiceSummary, Weekday } from "../../wix/bookings/types";
import NoPhoto from "../ui/NoPhoto";

const TYPE_LABEL: Record<ServiceSummary["type"], string> = {
  APPOINTMENT: "One-to-one",
  CLASS: "Group class",
  COURSE: "Course",
};
const DAY_SHORT: Record<Weekday, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };
const DAY_ORDER: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function daysLabel(days: Weekday[]): string {
  return DAY_ORDER.filter((d) => days.includes(d)).map((d) => DAY_SHORT[d]).join(", ");
}

/** "£17.50", "From £30", struck base price beside a discount; nothing when the price is unknown. */
export function ServicePrice({ service }: { service: ServiceSummary }) {
  if (!service.price) return null;
  return (
    <span>
      {service.priceFrom ? "From " : ""}
      {service.price}
      {service.basePrice && <s className="ml-1.5 text-muted-foreground">{service.basePrice}</s>}
      {service.discountName && <span className="ml-1.5 text-xs text-muted-foreground">{service.discountName}</span>}
    </span>
  );
}

export default function ClassCard({ service, motif = "spool" }: { service: ServiceSummary; motif?: "spool" | "needle" | "scissors" }) {
  const days = daysLabel(service.offeredDays ?? []);
  return (
    <a
      href={`/services/${encodeURIComponent(service.slug)}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background no-underline transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(78,76,76,0.45)]"
    >
      <div className={`relative overflow-hidden ${service.imageUrl ? "aspect-[4/3]" : "aspect-[16/7]"}`}>
        {service.imageUrl ? (
          <img {...imgFitAttrs(service.imageUrl, "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw")} alt={service.name} className="h-full w-full object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <NoPhoto motif={motif} />
        )}
        <span className="absolute left-4 top-4 rounded-control bg-background px-3 py-1 text-xs font-bold text-sage-deep shadow-sm">
          {TYPE_LABEL[service.type]}
          {service.conferencing ? " · Online" : ""}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
        <h3 className="break-words text-xl text-foreground">{service.name}</h3>
        {service.tagLine && <p className="text-sm text-muted-foreground">{service.tagLine}</p>}
        <dl className="mt-1 space-y-1 text-sm">
          {days && (
            <div className="flex gap-2">
              <dt className="sr-only">Runs on</dt>
              <dd className="font-semibold text-sage-deep">{days}</dd>
            </div>
          )}
          <div className="flex flex-wrap gap-x-2">
            {service.durationLabel && (
              <>
                <dt className="sr-only">Length</dt>
                <dd>{service.durationLabel}</dd>
              </>
            )}
            {service.durationLabel && service.price && <span aria-hidden="true">·</span>}
            {service.price && (
              <>
                <dt className="sr-only">Price</dt>
                <dd className="font-semibold">
                  <ServicePrice service={service} />
                  {service.type === "CLASS" && !service.priceFrom ? <span className="font-normal text-muted-foreground"> a session</span> : null}
                </dd>
              </>
            )}
          </div>
        </dl>
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-bold text-foreground">
          See times &amp; book
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </a>
  );
}
