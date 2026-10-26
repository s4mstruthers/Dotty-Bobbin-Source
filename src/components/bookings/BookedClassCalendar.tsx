// On the thank-you page after a paid class booking: "You're booked: <class>, <day>, <time>" and
// Add to calendar for the class just booked. The class page kept it in session storage before
// leaving for the Wix checkout; with nothing kept (a shop order, a direct visit) this renders
// nothing. Mount client:only="react".
import { useState } from "react";
import AddToCalendar from "../ui/AddToCalendar";
import { bookedEventForOrder, calendarLinks, type CalendarEvent } from "../../lib/calendar";

// Both this island and the page's own script read the kept class (the script to pick which
// panels show); they load as separate bundles, so each reads it for the order in the address.
export function bookedClass(): CalendarEvent | null {
  return bookedEventForOrder(new URLSearchParams(window.location.search).get("orderId") ?? "");
}

// The studio's clock, whatever the visitor's device is set to.
const ZONE = "Europe/London";

export default function BookedClassCalendar() {
  const [event] = useState(bookedClass);
  if (!event) return null;
  const start = new Date(event.startIso);
  const day = start.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: ZONE });
  const time = start.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: ZONE });
  return (
    <div className="mt-6 rounded-lg bg-secondary p-5">
      <p className="text-lg font-semibold">
        You're booked: {event.title}, {day}, {time}
      </p>
      <div className="mt-3">
        <AddToCalendar links={calendarLinks(event)} className="link-pill bg-background text-sm" />
      </div>
    </div>
  );
}
