// Portfolio Course 1 on the classes list (/services): one small text section for both groups in
// place of two picture cards, which were very tall on a phone. Each line is the group, when it
// meets and its places — the same count the course page shows (coursePlaces over the schedule's
// sessions), rendered server-side and refreshed here so it follows the bookings.
import { useEffect, useState } from "react";
import { PORTFOLIO_COURSE_1_TITLE, coursePlaces, fetchCourseSessions, type CourseGroupSummary } from "../../wix/bookings/course";
import type { Session } from "../../wix/bookings/types";

const WEEKDAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

function clock(local: string): string {
  const d = new Date(local);
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return `${h}${m ? `:${String(m).padStart(2, "0")}` : ""}${d.getHours() < 12 ? "am" : "pm"}`;
}

/** "Saturdays 9am–1pm", from the next session still running; "" when there is none. */
function whenLabel(sessions: Session[]): string {
  const s = sessions.find((x) => !x.isCancelled);
  if (!s) return "";
  return `${WEEKDAYS[new Date(s.startLocal).getDay()]} ${clock(s.startLocal)}–${clock(s.endLocal)}`;
}

function GroupLine({ group }: { group: CourseGroupSummary }) {
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

  const places = coursePlaces(sessions, group.defaultCapacity);
  const when = whenLabel(sessions);
  const name = `${group.label}${when ? `, ${when}` : ""}`;
  const bookable = !group.closed && !places.full;
  const status = group.closed
    ? "Bookings closed"
    : places.full
      ? "FULL"
      : places.left != null
        ? `${places.left} ${places.left === 1 ? "place" : "places"} left`
        : "Places available";

  return (
    <li className="flex gap-2">
      <span aria-hidden="true" className="text-sage">•</span>
      <span>
        {bookable ? (
          <a href={group.path} className="underline">{name}</a>
        ) : (
          name
        )}
        : <span className={bookable ? "font-semibold text-sage-deep" : "font-semibold"}>{status}</span>
      </span>
    </li>
  );
}

export default function PortfolioCourseSummary({ groups }: { groups: CourseGroupSummary[] }) {
  if (groups.length === 0) return null;
  return (
    <section className="mb-6 rounded-lg border border-border bg-background p-5 sm:p-6" aria-labelledby="portfolio-course-title">
      <h2 id="portfolio-course-title" className="text-xl text-foreground">{PORTFOLIO_COURSE_1_TITLE}</h2>
      <ul className="mt-2 space-y-1.5 text-sm">
        {groups.map((g) => (
          <GroupLine key={g.key} group={g} />
        ))}
      </ul>
    </section>
  );
}
