// Portfolio Course 1 as a featured panel at the top of the classes list (/services) and on the
// home page, in place of two picture cards: Saskia's own year-long course, so it gets more room
// than a weekly class. One side is the course (her description, when it starts, the price, the
// group size); the other is a tile per group with its places, so "Full" is seen before anyone
// clicks, and the group with places has its own Book button. Places are the same count the course
// page shows (coursePlaces over the schedule's sessions), rendered server-side and refreshed here
// so they follow the bookings. The words around the Wix data are COURSE_FEATURE (src/content/site.ts).
import { useEffect, useState } from "react";
import { COURSE_FEATURE } from "../../content/site";
import { PORTFOLIO_COURSE_1_TITLE, coursePlaces, fetchCourseSessions, type CourseGroupSummary } from "../../wix/bookings/course";
import type { Session } from "../../wix/bookings/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const live = (sessions: Session[]) => sessions.filter((s) => !s.isCancelled);

function clock(local: string): string {
  const d = new Date(local);
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return `${h}${m ? `:${String(m).padStart(2, "0")}` : ""}${d.getHours() < 12 ? "am" : "pm"}`;
}

/** "Saturdays 9am–1pm", from the next session still running; "" when there is none. */
function whenLabel(sessions: Session[]): string {
  const s = live(sessions)[0];
  if (!s) return "";
  return `${DAYS[new Date(s.startLocal).getDay()]}s ${clock(s.startLocal)}–${clock(s.endLocal)}`;
}

/** "Saturday 23 January 2027" */
function dayLabel(local: string): string {
  const d = new Date(local);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "January to December 2027", or "October 2027 to March 2028" across a new year. */
function spanLabel(sessions: Session[]): string {
  const l = live(sessions);
  if (!l.length) return "";
  const a = new Date(l[0].startLocal);
  const b = new Date(l[l.length - 1].startLocal);
  if (a.getFullYear() !== b.getFullYear()) return `${MONTHS[a.getMonth()]} ${a.getFullYear()} to ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
  if (a.getMonth() === b.getMonth()) return `${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  return `${MONTHS[a.getMonth()]} to ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}

/** The group's sessions, re-read in the browser so places left follow the bookings. */
function useLiveSessions(group: CourseGroupSummary): Session[] {
  const [sessions, setSessions] = useState(group.sessions);
  useEffect(() => {
    let on = true;
    if (group.scheduleId) {
      fetchCourseSessions(group.scheduleId).then((s) => {
        if (on && s.length) setSessions(s);
      });
    }
    return () => {
      on = false;
    };
  }, [group.scheduleId]);
  return sessions;
}

function GroupTile({ group }: { group: CourseGroupSummary }) {
  const sessions = useLiveSessions(group);
  const places = coursePlaces(sessions, group.defaultCapacity);
  const when = whenLabel(sessions);
  const full = !group.closed && places.full;
  const bookable = !group.closed && !places.full;
  const few = bookable && places.left != null && places.left <= 2;

  const status = group.closed
    ? "Bookings closed"
    : full
      ? "Full"
      : places.left != null
        ? `${few ? "Only " : ""}${places.left} ${places.left === 1 ? "place" : "places"} left`
        : "Places available";
  const pill = full
    ? "bg-foreground text-background"
    : few
      ? "bg-blush text-ink"
      : bookable
        ? "bg-secondary text-sage-deep"
        : "bg-secondary text-foreground";

  return (
    <li className="flex flex-col gap-4 rounded-md bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div>
          <p className="font-display text-lg font-bold text-foreground">{group.label}</p>
          {when && <p className="text-sm text-muted-foreground">{when}</p>}
        </div>
        <span className={`shrink-0 rounded-control px-3 py-1 text-sm font-bold ${pill}`}>{status}</span>
      </div>
      {bookable ? (
        <a href={group.path} className="btn self-start" aria-label={`${COURSE_FEATURE.bookButton}: ${group.label}`}>
          {COURSE_FEATURE.bookButton}
        </a>
      ) : full ? (
        <a href="/contact" className="link-pill self-start text-sm">
          {COURSE_FEATURE.fullLink}
        </a>
      ) : null}
    </li>
  );
}

export default function PortfolioCourseSummary({ groups, headingLevel = 2 }: { groups: CourseGroupSummary[]; headingLevel?: 2 | 3 }) {
  if (groups.length === 0) return null;
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const lead = groups[0];
  const sessions = live(lead.sessions);
  const anyOpen = groups.some((g) => !g.closed);
  const capacity = coursePlaces(lead.sessions, lead.defaultCapacity).capacity;
  const first = sessions[0];
  const facts = [
    sessions.length && first ? `${sessions.length} ${DAYS[new Date(first.startLocal).getDay()]} sessions` : "",
    spanLabel(sessions),
    lead.subscription ? `${lead.subscription.amountPerCycle} a month` : "",
    capacity ? `Up to ${capacity} in a group` : "",
  ].filter(Boolean);
  // "About the course" opens a group that still has places, so the page it lands on can be booked.
  const more = groups.find((g) => !g.closed && !coursePlaces(g.sessions, g.defaultCapacity).full) ?? lead;

  return (
    // The border keeps the panel's edge in the holiday looks whose section colour is close to
    // blush-soft (Christmas, Valentine's). On a phone the groups come straight after the title,
    // so a full group is seen before the description; on a wide screen they sit on the right.
    <section className="mb-8 rounded-lg border-2 border-blush bg-blush-soft p-5 sm:p-8" aria-labelledby="portfolio-course-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {anyOpen && <span className="rounded-control bg-blush px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-ink">{COURSE_FEATURE.ribbon}</span>}
            <p className="eyebrow">{COURSE_FEATURE.kicker}</p>
          </div>
          <Heading id="portfolio-course-title" className="mt-2 text-3xl text-sage sm:text-4xl">
            {PORTFOLIO_COURSE_1_TITLE}
          </Heading>
          {anyOpen && first && <p className="mt-2 font-semibold text-foreground">Starts {dayLabel(first.startLocal)}</p>}
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-sage-deep">{COURSE_FEATURE.groupsTitle}</p>
          <ul className="grid gap-3">
            {groups.map((g) => (
              <GroupTile key={g.key} group={g} />
            ))}
          </ul>
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          {lead.description && <p className="max-w-2xl leading-relaxed lg:mt-3">{lead.description}</p>}
          {facts.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {facts.map((f) => (
                <li key={f} className="rounded-control bg-background px-3 py-1">{f}</li>
              ))}
            </ul>
          )}
          <a href={more.path} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-foreground underline-offset-4 hover:underline">
            {COURSE_FEATURE.moreLink}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
