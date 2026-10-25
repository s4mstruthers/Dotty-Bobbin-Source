// GET /api/calendar.ics?title=&start=&end=&location= — one class or event as an .ics file, for the
// "Apple Calendar" choice of Add to calendar (src/lib/calendar.ts builds the link). On an iPhone or
// Mac, Safari hands the file straight to Calendar.
import type { APIRoute } from "astro";
import { icsText } from "../../lib/calendar";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const q = url.searchParams;
  const title = (q.get("title") ?? "").trim().slice(0, 200);
  const location = (q.get("location") ?? "").trim().slice(0, 300);
  const start = Date.parse(q.get("start") ?? "");
  const end = Date.parse(q.get("end") ?? "");
  if (!title || Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return new Response("Not a calendar event.", { status: 400 });
  }
  const filename = title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "event";
  const body = icsText({ title, location, startIso: new Date(start).toISOString(), endIso: new Date(end).toISOString() });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
};
