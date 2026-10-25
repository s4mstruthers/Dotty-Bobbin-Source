// One "Add to calendar" button that opens a choice of Google Calendar or Apple Calendar. A plain
// <details> menu, so it works before (or without) hydration; once hydrated, a click elsewhere or
// Escape closes it.
import { useEffect, useRef } from "react";
import type { CalendarLinks } from "../../lib/calendar";

const item = "block px-4 py-2.5 text-sm font-semibold text-foreground no-underline hover:bg-secondary";

export default function AddToCalendar({ links, className = "link-pill", align = "center" }: { links: CalendarLinks; className?: string; align?: "left" | "center" }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  const shut = () => ref.current && (ref.current.open = false);

  return (
    <details ref={ref} className="relative inline-block text-left">
      <summary className={`${className} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        Add to calendar
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
        </svg>
      </summary>
      <div
        className={`absolute z-20 mt-2 w-max min-w-full overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg ${align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"}`}
      >
        <a href={links.google} target="_blank" rel="noopener" className={item} onClick={shut}>
          Google Calendar
        </a>
        <a href={links.apple} className={item} onClick={shut}>
          Apple Calendar
        </a>
      </div>
    </details>
  );
}
