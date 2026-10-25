// On the thank-you page after a paid class booking: Add to calendar for the class just booked.
// The class page kept it in session storage before leaving for the Wix checkout; with nothing
// kept (a shop order, a direct visit) this renders nothing. Mount client:only="react".
import { useState } from "react";
import AddToCalendar from "../ui/AddToCalendar";
import { calendarLinks, takeBookedEvent } from "../../lib/calendar";

export default function BookedClassCalendar() {
  const [booked] = useState(takeBookedEvent);
  if (!booked) return null;
  return (
    <div className="mt-4">
      <AddToCalendar links={calendarLinks(booked)} className="link-pill bg-background text-sm" align="left" />
    </div>
  );
}
